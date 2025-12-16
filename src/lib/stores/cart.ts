import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/products";

export interface CartItem extends Product {
  quantity: number;
}

/** Derived calculations */
const calcCount = (items: CartItem[]) =>
  items.reduce((total, item) => total + (item.quantity || 0), 0);

const calcSubtotal = (items: CartItem[]) =>
  items.reduce((total, item) => total + (item.price || 0) * (item.quantity || 0), 0);

type ServerCartResponse = {
  items: CartItem[];
};

interface CartState {
  // UI
  isOpen: boolean;

  // Data
  items: CartItem[];
  count: number;
  subtotal: number;

  // Lifecycle / status
  hydrated: boolean;
  syncing: boolean;
  dirty: boolean; // local optimistic state not fully synced to server yet
  error: string | null;

  // Pending locks
  pendingById: Record<string, boolean>;

  // Internal sync state for SSR safety (NOT persisted)
   __timerId: ReturnType<typeof setTimeout> | null;
   __flushInFlight: boolean;
   __flushQueued: boolean;

  // Actions
  addItem: (product: Product) => void;
  decreaseItemQuantity: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;

  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  rehydrateCart: () => Promise<void>;
}

/** ---------- Internal helpers (client) ---------- **/

const safeJson = async <T,>(res: Response): Promise<T> => {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return (await res.json()) as T;

  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text || `Request failed (${res.status})`);
  }
};

const ensureSession = async () => {
  const res = await fetch("/api/cart/session", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to initialize cart session");
};

const fetchCart = async (): Promise<CartItem[]> => {
  const res = await fetch("/api/cart", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch cart");
  const data = await safeJson<ServerCartResponse>(res);
  return Array.isArray(data.items) ? data.items : [];
};

const apiAddItem = async (productId: string, quantity: number) => {
  const res = await fetch("/api/cart/items", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) throw new Error("Failed to add item");
};

const apiUpdateQty = async (productId: string, quantity: number) => {
  const res = await fetch("/api/cart/items", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) throw new Error("Failed to update quantity");
};

const apiRemoveItem = async (productId: string) => {
  const res = await fetch(`/api/cart/items?id=${encodeURIComponent(productId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to remove item");
};

const apiClear = async () => {
  const res = await fetch("/api/cart/clear", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to clear cart");
};

/** Optimistic mutations */
const optimisticAdd = (items: CartItem[], product: Product): CartItem[] => {
  const existing = items.find((i) => i.id === product.id);
  if (existing) {
    return items.map((i) =>
      i.id === product.id ? { ...i, quantity: (i.quantity || 0) + 1 } : i
    );
  }
  return [...items, { ...product, quantity: 1 }];
};

const optimisticDecrease = (items: CartItem[], id: string): CartItem[] => {
  const existing = items.find((i) => i.id === id);
  if (!existing) return items;
  if ((existing.quantity || 0) > 1) {
    return items.map((i) =>
      i.id === id ? { ...i, quantity: (i.quantity || 0) - 1 } : i
    );
  }
  return items.filter((i) => i.id !== id);
};

const optimisticRemove = (items: CartItem[], id: string) =>
  items.filter((i) => i.id !== id);

/** ---------- Batching / Coalescing ---------- **/

const makeQtyMap = (items: CartItem[]) => {
  const map: Record<string, number> = {};
  for (const i of items) map[i.id] = Number(i.quantity) || 0;
  return map;
};


// Takes the store instance (get, set) to manage internal state
const scheduleFlush = (
  flushFn: () => Promise<void>,
  store: { 
    getState: () => CartState;
    setState: (partial: Partial<CartState> | CartState) => void;
  }
) => {
  const { __timerId } = store.getState();

  if (__timerId) clearTimeout(__timerId);

  const newTimerId = setTimeout(() => {
    void flushFn();
  }, 150);

  // Save the new timer ID to the store instance
  store.setState({ __timerId: newTimerId });
};

/** ---------- Store ---------- **/

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      count: 0,
      subtotal: 0,

      hydrated: false,
      syncing: false,
      dirty: false,
      error: null,

      pendingById: {},

      __timerId: null,
      __flushInFlight: false,
      __flushQueued: false,

      rehydrateCart: async () => {
        set({ syncing: true });
        try {
          await ensureSession();
          const serverItems = await fetchCart();

          set({
            items: serverItems,
            count: calcCount(serverItems),
            subtotal: calcSubtotal(serverItems),
            error: null,
            dirty: false,
            pendingById: {},
          });
        } catch (e: any) {
          // IMPORTANT: if we are dirty (unsynced) and server is still down,
          // keep the dirty state so UI remains locked.
          set((state) => ({
            error: e?.message ?? "Cart sync failed",
            dirty: state.dirty || state.items.length > 0,
          }));
        } finally {
          set({ syncing: false });
        }
      },

      /**
       * Core: flush desired optimistic state to server safely.
       * - Fetches server cart first (no shadow reliance)
       * - Applies diffs
       * - Reconciles from server
       */
      // ts-expect-error internal
      __flushToServer: async () => {

        const state = get(); // SSR FIX: Read internal state from instance

        // 1. Debounce check (uses instance state)
        if (state.__flushInFlight) {
          set({ __flushQueued: true });
          return;
        }

        // Set internal state: flushInFlight = true, syncing = true
        set({ __flushInFlight: true, syncing: true });

        try {
          await ensureSession();

          // 2. SNAPSHOT: Capture the specific local state we are trying to sync
          const desiredItems = get().items;
          const desiredQty = makeQtyMap(desiredItems);

          // 3. Fetch server state (Source of Truth)
          const serverBefore = await fetchCart();
          const serverQty = makeQtyMap(serverBefore);

          const desiredIds = new Set(Object.keys(desiredQty));
          const serverIds = new Set(Object.keys(serverQty));

          // 4. Diffing Logic
          // Special case: Local is empty, Server has items -> Clear everything
          if (desiredItems.length === 0 && serverBefore.length > 0) {
            await apiClear();
          } else {
            // A) Handle Removals
            for (const id of serverIds) {
              if (!desiredIds.has(id)) {
                await apiRemoveItem(id);
              }
            }

            // B) Handle Updates (Unified Logic)
            for (const id of desiredIds) {
              const want = desiredQty[id] ?? 0;
              const had = serverQty[id] ?? 0;

              // Skip invalid quantities
              if (want <= 0) {
                if (had > 0) await apiRemoveItem(id);
                continue;
              }

              // Case 1: New Item -> POST (Add)
              if (had === 0) {
                await apiAddItem(id, want);
                continue;
              }

              // Case 2: Existing Item -> PATCH (Update Absolute)
              // We use PATCH for both increase and decrease. 
              // This is "Idempotent" - safer than adding deltas.
              if (want !== had) {
                await apiUpdateQty(id, want);
              }
            }
          }

          // 5. Fetch Final Server State
          const serverFinal = await fetchCart();

          // 6. CRITICAL: Race Condition Check
          // We check if the current state reference is strictly equal to our snapshot.
          // If the user clicked a button while we were awaiting APIs, 'get().items' 
          // will be a NEW reference.
          const currentItems = get().items;
          
          if (currentItems === desiredItems) {
            // Safe to overwrite: User hasn't touched the UI since we started.
            set({
              items: serverFinal,
              count: calcCount(serverFinal),
              subtotal: calcSubtotal(serverFinal),
              error: null,
              dirty: false,
              pendingById: {}, // Release all locks
            });
          } else {
            // Unsafe: User changed the cart while we were syncing.
            // Do NOT overwrite local items. 
            // Mark as dirty so the next flush cycle picks up the new changes.
            console.log("Stale sync detected - rescheduling");
            set({ dirty: true });
            
            // We do NOT clear pendingById here, because the items are still technically pending
            // the next sync cycle.
          }

        } catch (e: any) {
          // On error, keep dirty state true
          set((state) => ({
            error: e?.message ?? "Sync failed",
            dirty: true,
            syncing: false,
            pendingById: state.pendingById, // Keep locks
          }));
        } finally {

          // Final state reads
          const finalState = get();

          set({ syncing: false, __flushInFlight: false });

          // Check if we need to run again immediately
          // (Either due to queueing OR because we detected a race condition above)
          if (finalState.__flushQueued || finalState.dirty) {
            set({ __flushQueued: false });
            scheduleFlush((get() as any).__flushToServer, { getState: get, setState: set });
          }
        }
      },

      addItem: (product) => {
        const prev = get().items;
        const next = optimisticAdd(prev, product);

        set((state) => ({
          items: next,
          count: calcCount(next),
          subtotal: calcSubtotal(next),
          error: null,
          dirty: true,
          pendingById: { ...state.pendingById, [product.id]: true },
        }));

        scheduleFlush((get() as any).__flushToServer, { getState: get, setState: set });
      },

      decreaseItemQuantity: (id) => {
        const prev = get().items;
        const next = optimisticDecrease(prev, id);

        set((state) => ({
          items: next,
          count: calcCount(next),
          subtotal: calcSubtotal(next),
          error: null,
          dirty: true,
          pendingById: { ...state.pendingById, [id]: true },
        }));

        scheduleFlush((get() as any).__flushToServer, { getState: get, setState: set });
      },

      removeItem: (id) => {
        const prev = get().items;
        const next = optimisticRemove(prev, id);

        set((state) => ({
          items: next,
          count: calcCount(next),
          subtotal: calcSubtotal(next),
          error: null,
          dirty: true,
          pendingById: { ...state.pendingById, [id]: true },
        }));

        scheduleFlush((get() as any).__flushToServer, { getState: get, setState: set });
      },

      clearCart: () => {
        const ids = get().items.map((i) => i.id);
        const pending: Record<string, boolean> = {};
        for (const id of ids) pending[id] = true;

        set({
          items: [],
          count: 0,
          subtotal: 0,
          error: null,
          dirty: true,
          pendingById: pending,
        });

        scheduleFlush((get() as any).__flushToServer, { getState: get, setState: set });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({
        items: state.items,
        dirty: state.dirty,
        pendingById: state.pendingById,
        error: state.error,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        state.hydrated = true;
        state.count = calcCount(state.items);
        state.subtotal = calcSubtotal(state.items);

        // ✅ Always try reconcile
        void state.rehydrateCart();

        // ✅ If unsynced, re-flush as soon as we're online (no refresh required)
        if (typeof window !== "undefined") {
          // Use the bound store action
          const flush = () => void (state as any).__flushToServer?.();

          // If we were dirty during refresh, keep trying when connection returns
          if (state.dirty) flush();

          window.addEventListener("online", flush);
        }
      },
    }
  )
);
