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

/**
 * Server cart shape returned by GET /api/cart
 * We keep it minimal and map it into CartItem[]
 */
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
  hydrated: boolean; // localStorage rehydrated
  syncing: boolean; // talking to server
  error: string | null;

  // Actions (keep same API)
  addItem: (product: Product) => void;
  decreaseItemQuantity: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;

  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // New helper
  rehydrateCart: () => Promise<void>;
}

/** ---------- Internal helpers (client) ---------- **/

const safeJson = async <T,>(res: Response): Promise<T> => {
  // Useful when server returns text on error
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text || `Request failed (${res.status})`);
  }
};

const ensureSession = async () => {
  // Creates/ensures an httpOnly cookie session on the server
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

const syncLocalFromServer = async (set: (partial: Partial<CartState>) => void) => {
  await ensureSession();
  const serverItems = await fetchCart();
  set({
    items: serverItems,
    count: calcCount(serverItems),
    subtotal: calcSubtotal(serverItems),
    error: null,
  });
};

/** Optimistic mutations */
const optimisticAdd = (items: CartItem[], product: Product): CartItem[] => {
  const existing = items.find((i) => i.id === product.id);
  if (existing) {
    return items.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
  }
  return [...items, { ...product, quantity: 1 }];
};

const optimisticDecrease = (items: CartItem[], id: string): CartItem[] => {
  const existing = items.find((i) => i.id === id);
  if (!existing) return items;
  if (existing.quantity > 1) {
    return items.map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i));
  }
  return items.filter((i) => i.id !== id);
};

const optimisticRemove = (items: CartItem[], id: string) => items.filter((i) => i.id !== id);

/** Server write endpoints */
const apiAddItem = async (productId: string) => {
  const res = await fetch("/api/cart/items", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity: 1 }),
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
      error: null,

      rehydrateCart: async () => {
        set({ syncing: true });
        try {
          await syncLocalFromServer(set);
        } catch (e: any) {
          set({ error: e?.message ?? "Cart sync failed" });
        } finally {
          set({ syncing: false });
        }
      },

      addItem: (product) => {
        const prev = get().items;
        const optimistic = optimisticAdd(prev, product);

        set({
          items: optimistic,
          count: calcCount(optimistic),
          subtotal: calcSubtotal(optimistic),
          error: null,
        });

        void (async () => {
          set({ syncing: true });
          try {
            await ensureSession();
            await apiAddItem(product.id);
            await syncLocalFromServer(set);
          } catch (e: any) {
            set({
              items: prev,
              count: calcCount(prev),
              subtotal: calcSubtotal(prev),
              error: e?.message ?? "Failed to add item",
            });
          } finally {
            set({ syncing: false });
          }
        })();
      },

      decreaseItemQuantity: (id) => {
        const prev = get().items;
        const next = optimisticDecrease(prev, id);

        set({
          items: next,
          count: calcCount(next),
          subtotal: calcSubtotal(next),
          error: null,
        });

        void (async () => {
          set({ syncing: true });
          try {
            await ensureSession();

            const nextItem = next.find((i) => i.id === id);
            if (!nextItem) await apiRemoveItem(id);
            else await apiUpdateQty(id, nextItem.quantity);

            await syncLocalFromServer(set);
          } catch (e: any) {
            set({
              items: prev,
              count: calcCount(prev),
              subtotal: calcSubtotal(prev),
              error: e?.message ?? "Failed to update quantity",
            });
          } finally {
            set({ syncing: false });
          }
        })();
      },

      removeItem: (id) => {
        const prev = get().items;
        const next = optimisticRemove(prev, id);

        set({
          items: next,
          count: calcCount(next),
          subtotal: calcSubtotal(next),
          error: null,
        });

        void (async () => {
          set({ syncing: true });
          try {
            await ensureSession();
            await apiRemoveItem(id);
            await syncLocalFromServer(set);
          } catch (e: any) {
            set({
              items: prev,
              count: calcCount(prev),
              subtotal: calcSubtotal(prev),
              error: e?.message ?? "Failed to remove item",
            });
          } finally {
            set({ syncing: false });
          }
        })();
      },

      clearCart: () => {
        const prev = get().items;

        set({ items: [], count: 0, subtotal: 0, error: null });

        void (async () => {
          set({ syncing: true });
          try {
            await ensureSession();
            await apiClear();
            await syncLocalFromServer(set);
          } catch (e: any) {
            set({
              items: prev,
              count: calcCount(prev),
              subtotal: calcSubtotal(prev),
              error: e?.message ?? "Failed to clear cart",
            });
          } finally {
            set({ syncing: false });
          }
        })();
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({
        // Persist only cart data (drawer open state shouldn't survive refresh)
        items: state.items,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        state.hydrated = true;
        state.count = calcCount(state.items);
        state.subtotal = calcSubtotal(state.items);

        // After hydration, reconcile with server (async)
        void state.rehydrateCart();
      },
    }
  )
);
