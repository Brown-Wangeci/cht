import { create } from "zustand";
import { persist } from "zustand/middleware";

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

  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  rehydrateCart: () => Promise<void>;
  __flushToServer: () => Promise<void>;
}

/** ---------- Helpers ---------- **/
const calcCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + (i.quantity || 0), 0);

const calcSubtotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + (Number(i.price) || 0) * (i.quantity || 0), 0);

const toLines = (items: CartItem[]): CartLine[] =>
  items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));

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
    let data: any = null;
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

const fetchCartFromServer = async (): Promise<CartItem[]> => {
  const res = await fetch("/api/cart", { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
};

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
          if (get().dirty) {
            await get().__flushToServer();
            // If flush succeeds, dirty will become false and items remain correct.
            // We can skip fetch, but doing a fetch is harmless (and can pick up server-side fixes).
          }

          const serverItems = await fetchCartFromServer();
          set({ serverItems });

          // Only overwrite local if we are NOT dirty anymore
          // (dirty implies local optimistic state should remain the UI source of truth).
          if (!get().dirty) {
            set({
              items: serverItems,
              count: calcCount(serverItems),
              subtotal: calcSubtotal(serverItems),
              error: null,
              pendingByVariantId: {},
            });
          } else {
            // still dirty → keep local items
            set({ error: null });
          }
        } catch (e: any) {
          // Cart is locked → make it read-only and stop retries
          if (e?.code === "CART_LOCKED" || e?.name === "CartLockedError") {
            // rollback to last server snapshot
            const rollback = get().serverItems;
            set({
              items: rollback,
              count: calcCount(rollback),
              subtotal: calcSubtotal(rollback),
              locked: true,
              error: e?.message ?? "Cart is locked for checkout",
              dirty: false,
              pendingByVariantId: {},
            });
            return;
          }

          // Other errors (network, server, etc.)
          set((s) => ({
            error: e?.message ?? "Failed to load cart from server",
            dirty: s.dirty || s.items.length > 0,
          }));
        } finally {
          set({ syncing: false });
        }
      },

      __flushToServer: async () => {
        let skipReschedule = false;
        const state = get();

        if (state.locked) {
          // Cart is locked → do not attempt syncs
          return;
        }

        if (state.__flushInFlight) {
          set({ __flushQueued: true });
          return;
        }

        set({ __flushInFlight: true, syncing: true });

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
        } catch (e: any) {
          // Cart is locked: stop retry loop and stop treating it as dirty
          if (e?.code === "CART_LOCKED" || e?.name === "CartLockedError") {
            // rollback to last server snapshot
            const rollback = get().serverItems;
            set({
              items: rollback,
              count: calcCount(rollback),
              subtotal: calcSubtotal(rollback),
              locked: true,
              error: e?.message ?? "Cart is locked for checkout",
              dirty: false,                 // IMPORTANT: stops retry-on-focus/online
              pendingByVariantId: {},        // clear pending
              __flushQueued: false,          // stop queueing
            });

            // void get().rehydrateCart();

            skipReschedule = true;
            return; // IMPORTANT: prevents rescheduling
          }

          // keep optimistic UI but remain locked (dirty) so checkout/buttons stay disabled
          set((s) => ({
            error: e?.message ?? "Sync delayed... checking connection",
            dirty: true,
            pendingByVariantId: s.pendingByVariantId,
          }));
        } finally {
          set({ __flushInFlight: false, syncing: false });

          if (skipReschedule) return;

          const final = get();
          if (final.__flushQueued || final.dirty) {
            set({ __flushQueued: false });
            scheduleFlush({ getState: get, setState: set }, get().__flushToServer, 200);
          }
        }
      },

      addItem: (variantProduct) => {

        if (get().locked) {
          set({ error: "Cart is locked for checkout" });
          return;
        }


        const prev = get().items;
        const existing = prev.find((i) => i.variantId === variantProduct.variantId);

        const max = variantProduct.stockOnHand ?? 99;

        const next = existing
          ? prev.map((i) =>
              i.variantId === variantProduct.variantId
                ? { ...i, quantity: Math.min((i.quantity || 0) + 1, max) }
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
          set({ error: "Cart is locked for checkout" });
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
          set({ error: "Cart is locked for checkout" });
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
          set({ error: "Cart is locked for checkout" });
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

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
    }),
    {
      name: "tea-cart-storage",
      partialize: (s) => ({
        items: s.items,
        serverItems: s.serverItems,
        locked: s.locked,
        dirty: s.dirty,
        error: s.error,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        state.hydrated = true;
        state.count = calcCount(state.items);
        state.subtotal = calcSubtotal(state.items);

        (state as any).serverItems = Array.isArray((state as any).serverItems)
          ? (state as any).serverItems
          : [];

        attachRetryListeners();

        // If dirty, attempt flush immediately (no refresh required once server returns)
        if (state.dirty) void useCartStore.getState().__flushToServer();
        else void state.rehydrateCart();
      },
    }
  )
);
