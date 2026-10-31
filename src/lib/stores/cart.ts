import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calcTotals } from "@/lib/pricing";

export type CartLine = { variantId: string; quantity: number };

export type CartItem = {
  // keys
  variantId: string;
  productId: string;

  // display
  slug: string;
  name: string;
  category: string;
  image: string;
  weightGrams: number;
  price: number;

  // state
  quantity: number;
  stockOnHand?: number;
};

interface CartState {

  isOpen: boolean;

  items: CartItem[];
  count: number;
  subtotal: number;

  serverItems: CartItem[];
  locked: boolean;

  hydrated: boolean;
  syncing: boolean;
  dirty: boolean;
  error: string | null;

  pendingByVariantId: Record<string, boolean>;

  // Internal flags for batching
  __timerId: ReturnType<typeof setTimeout> | null;
  __flushInFlight: boolean;
  __flushQueued: boolean;

  addItem: (variantProduct: Omit<CartItem, "quantity">) => void;
  decreaseItemQuantity: (variantId: string) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  /** Wipes the local cart after an order completes (server cart is already finalised). */
  resetCart: () => void;

  setLocked: (locked: boolean) => void;
  setError: (error: string | null) => void;

  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  rehydrateCart: () => Promise<void>;
  /** Flushes pending changes immediately; resolves true once the server has the current cart. */
  syncNow: () => Promise<boolean>;
  __flushToServer: () => Promise<void>;
}

/** ---------- Helpers ---------- **/
const calcCount = (items: CartItem[]) => calcTotals(items).count;

const calcSubtotal = (items: CartItem[]) => calcTotals(items).subtotal;

const toLines = (items: CartItem[]): CartLine[] =>
  items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));

const errorMessage = (e: unknown, fallback: string) =>
  e instanceof Error && e.message ? e.message : fallback;

const scheduleFlush = (
  store: { getState: () => CartState; setState: (partial: Partial<CartState>) => void },
  fn: () => Promise<void>,
  delayMs = 200
) => {
  const { __timerId } = store.getState();
  if (__timerId) clearTimeout(__timerId);

  const tid = setTimeout(() => void fn(), delayMs);
  store.setState({ __timerId: tid });
};

/** ---------- API ---------- **/
class CartLockedError extends Error {
  code = "CART_LOCKED" as const;
  constructor(message = "Cart is locked for checkout") {
    super(message);
    this.name = "CartLockedError";
  }
}

const apiSyncCart = async (lines: CartLine[]) => {
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: lines }),
  });

  if (!res.ok) {
    // Try to read structured error from API
    let data: { code?: string; message?: string; error?: string } | null = null;
    try {
      data = await res.json();
    } catch {
      // ignore
    }

    if (res.status === 409 && data?.code === "CART_LOCKED") {
      throw new CartLockedError(data?.message);
    }

    throw new Error(data?.error ?? "Sync failed");
  }

  return res.json();
};

const fetchCartFromServer = async (): Promise<{ items: CartItem[]; locked: boolean }> => {
  const res = await fetch("/api/cart", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load cart from server");
  const data = await res.json();
  return {
    items: Array.isArray(data.items) ? data.items : [],
    locked: data.locked === true,
  };
};

const LOCKED_MESSAGE = "Your cart is locked during checkout. Click “Change items” to edit.";

/** ---------- Online retry listeners (attach once) ---------- **/
let listenersAttached = false;

const attachRetryListeners = () => {
  if (typeof window === "undefined") return;
  if (listenersAttached) return;
  listenersAttached = true;

  const flush = () => void useCartStore.getState().__flushToServer?.();

  const onOnline = () => {
    const s = useCartStore.getState();
    if (!s.locked && s.dirty) flush();
  };

  const onFocus = () => {
    const s = useCartStore.getState();
    if (!s.locked && s.dirty) flush();
  };

  const onVisibility = () => {
    const s = useCartStore.getState();
    if (document.visibilityState === "visible" && !s.locked && s.dirty) flush();
  };

  window.addEventListener("online", onOnline);
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVisibility);
};

/** ---------- Store ---------- **/
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({

      isOpen: false,

      items: [],
      count: 0,
      subtotal: 0,

      serverItems: [],
      locked: false,

      hydrated: false,
      syncing: false,
      dirty: false,
      error: null,

      pendingByVariantId: {},

      __timerId: null,
      __flushInFlight: false,
      __flushQueued: false,

      rehydrateCart: async () => {
        set({ syncing: true });

        try {
          // If we have local unsynced changes, prefer syncing first
          // to avoid snapping UI back to stale server state.
          if (get().dirty && !get().locked) {
            await get().__flushToServer();
          }

          const server = await fetchCartFromServer();
          set({ serverItems: server.items, locked: server.locked });

          // Server wins unless we still hold unsynced local edits on an editable cart.
          if (!get().dirty || server.locked) {
            set({
              items: server.items,
              count: calcCount(server.items),
              subtotal: calcSubtotal(server.items),
              dirty: false,
              error: null,
              pendingByVariantId: {},
            });
          } else {
            // still dirty → keep local items
            set({ error: null });
          }
        } catch (e: unknown) {
          // Other errors (network, server, etc.)
          set((s) => ({
            error: errorMessage(e, "Failed to load cart from server"),
            dirty: s.dirty,
          }));
        } finally {
          set({ syncing: false });
        }
      },

      syncNow: async () => {
        const { __timerId } = get();
        if (__timerId) {
          clearTimeout(__timerId);
          set({ __timerId: null });
        }

        await get().__flushToServer();

        // A flush may already have been in flight (ours is then queued) — wait for it to settle.
        for (let i = 0; i < 50 && (get().__flushInFlight || get().__timerId || get().dirty); i++) {
          await new Promise((r) => setTimeout(r, 100));
          if (get().error && get().dirty && !get().__flushInFlight) break;
        }

        const s = get();
        return !s.dirty && !s.locked;
      },

      __flushToServer: async () => {
        let skipReschedule = false;
        let retryDelayMs = 200;
        const state = get();

        if (state.locked) {
          // Cart is locked → do not attempt syncs
          return;
        }

        if (state.__flushInFlight) {
          set({ __flushQueued: true });
          return;
        }

        set({ __flushInFlight: true, syncing: true, __timerId: null });

        try {
          const snapshot = get().items; // reference snapshot
          const snapshotLines = toLines(snapshot);

          await apiSyncCart(snapshotLines);

          // Race safety: only clear dirty if cart didn't change during the request
          if (get().items === snapshot) {
            set({
              serverItems: snapshot,
              locked: false,
              dirty: false,
              error: null,
              pendingByVariantId: {},
            });
          } else {
            // user changed cart while request was in flight
            set({ dirty: true });
          }
        } catch (e: unknown) {
          // Cart is locked: stop retry loop and stop treating it as dirty
          if (e instanceof CartLockedError) {
            // rollback to last server snapshot
            const rollback = get().serverItems;
            set({
              items: rollback,
              count: calcCount(rollback),
              subtotal: calcSubtotal(rollback),
              locked: true,
              error: LOCKED_MESSAGE,
              dirty: false,                 // IMPORTANT: stops retry-on-focus/online
              pendingByVariantId: {},        // clear pending
              __flushQueued: false,          // stop queueing
            });

            skipReschedule = true;
            return; // IMPORTANT: prevents rescheduling
          }

          // keep optimistic UI but remain locked (dirty) so checkout/buttons stay disabled
          set((s) => ({
            error: errorMessage(e, "Sync delayed... checking connection"),
            dirty: true,
            pendingByVariantId: s.pendingByVariantId,
          }));
          // Network/server trouble: back off instead of hammering (online/focus listeners also retry).
          retryDelayMs = 5000;
        } finally {
          set({ __flushInFlight: false, syncing: false });

          if (!skipReschedule) {
            const final = get();
            if (final.__flushQueued || final.dirty) {
              set({ __flushQueued: false });
              scheduleFlush({ getState: get, setState: set }, get().__flushToServer, retryDelayMs);
            }
          }
        }
      },

      addItem: (variantProduct) => {

        if (get().locked) {
          set({ error: LOCKED_MESSAGE });
          return;
        }

        const prev = get().items;
        const existing = prev.find((i) => i.variantId === variantProduct.variantId);

        const max = Math.min(99, variantProduct.stockOnHand ?? existing?.stockOnHand ?? 99);

        if (max <= 0) {
          set({ error: `${variantProduct.name} is out of stock` });
          return;
        }

        if (existing && existing.quantity >= max) {
          set({ error: `Only ${max} of ${variantProduct.name} available` });
          return;
        }

        const next = existing
          ? prev.map((i) =>
              i.variantId === variantProduct.variantId
                ? { ...i, ...variantProduct, quantity: Math.min((i.quantity || 0) + 1, max) }
                : i
            )
          : [
              ...prev,
              {
                ...variantProduct,
                quantity: 1,
              },
            ];

        set((s) => ({
          items: next,
          count: calcCount(next),
          subtotal: calcSubtotal(next),
          dirty: true,
          error: null,
          pendingByVariantId: { ...s.pendingByVariantId, [variantProduct.variantId]: true },
        }));

        scheduleFlush({ getState: get, setState: set }, get().__flushToServer, 200);
      },

      decreaseItemQuantity: (variantId) => {

        if (get().locked) {
          set({ error: LOCKED_MESSAGE });
          return;
        }

        const prev = get().items;
        const existing = prev.find((i) => i.variantId === variantId);
        if (!existing) return;

        const next =
          existing.quantity > 1
            ? prev.map((i) => (i.variantId === variantId ? { ...i, quantity: i.quantity - 1 } : i))
            : prev.filter((i) => i.variantId !== variantId);

        set((s) => ({
          items: next,
          count: calcCount(next),
          subtotal: calcSubtotal(next),
          dirty: true,
          error: null,
          pendingByVariantId: { ...s.pendingByVariantId, [variantId]: true },
        }));

        scheduleFlush({ getState: get, setState: set }, get().__flushToServer, 200);
      },

      removeItem: (variantId) => {

        if (get().locked) {
          set({ error: LOCKED_MESSAGE });
          return;
        }

        const next = get().items.filter((i) => i.variantId !== variantId);

        set((s) => ({
          items: next,
          count: calcCount(next),
          subtotal: calcSubtotal(next),
          dirty: true,
          error: null,
          pendingByVariantId: { ...s.pendingByVariantId, [variantId]: true },
        }));

        scheduleFlush({ getState: get, setState: set }, get().__flushToServer, 200);
      },

      clearCart: () => {
        if (get().locked) {
          set({ error: LOCKED_MESSAGE });
          return;
        }

        const pending: Record<string, boolean> = {};
        for (const i of get().items) pending[i.variantId] = true;

        set({
          items: [],
          count: 0,
          subtotal: 0,
          dirty: true,
          error: null,
          pendingByVariantId: pending,
        });

        scheduleFlush({ getState: get, setState: set }, get().__flushToServer, 200);
      },

      resetCart: () => {
        const { __timerId } = get();
        if (__timerId) clearTimeout(__timerId);

        set({
          isOpen: false,
          items: [],
          serverItems: [],
          count: 0,
          subtotal: 0,
          locked: false,
          dirty: false,
          error: null,
          pendingByVariantId: {},
          __timerId: null,
          __flushQueued: false,
        });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setLocked: (locked) => set({ locked }),
      setError: (error) => set({ error }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
    }),
    {
      name: "tea-cart-storage",
      // Rehydrated from localStorage after mount (see CartHydrator) so the first client
      // render matches the server HTML.
      skipHydration: true,
      partialize: (s) => ({
        items: s.items,
        serverItems: s.serverItems,
        locked: s.locked,
        dirty: s.dirty,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        const items = Array.isArray(state.items) ? state.items : [];
        useCartStore.setState({
          hydrated: true,
          items,
          serverItems: Array.isArray(state.serverItems) ? state.serverItems : [],
          count: calcCount(items),
          subtotal: calcSubtotal(items),
        });

        attachRetryListeners();

        // If dirty, attempt flush immediately (no refresh required once server returns)
        if (state.dirty) void useCartStore.getState().__flushToServer();
        else void useCartStore.getState().rehydrateCart();
      },
    }
  )
);
