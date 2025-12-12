import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/products";

export interface CartItem extends Product {
  quantity: number;
}

const calcCount = (items: CartItem[]) =>
  items.reduce((total, item) => total + item.quantity, 0);

const calcSubtotal = (items: CartItem[]) =>
  items.reduce((total, item) => total + item.price * item.quantity, 0);

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  count: number;
  subtotal: number;

  addItem: (product: Product) => void;
  decreaseItemQuantity: (id: string) => void;
  removeItem: (id: string) => void;

  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      count: 0,
      subtotal: 0,

      addItem: (product) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id);
          let updatedItems;
          if (existingItem) {
            updatedItems = state.items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          } else {
            updatedItems = [...state.items, { ...product, quantity: 1 }];
          }
          return {
            items: updatedItems,
            count: calcCount(updatedItems),
            subtotal: calcSubtotal(updatedItems),
          };
        });

      },

      decreaseItemQuantity: (id) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.id === id);
          if (!existingItem) return {};
          let updatedItems;
          if (existingItem.quantity > 1) {
            updatedItems = state.items.map((item) =>
              item.id === id
                ? { ...item, quantity: item.quantity - 1 }
                : item
            );
          } else {
            updatedItems = state.items.filter((item) => item.id !== id);
          }
          return {
            items: updatedItems,
            count: calcCount(updatedItems),
            subtotal: calcSubtotal(updatedItems),
          };
        });
      },

      removeItem: (id) => {
        set((state) => {
          const updatedItems = state.items.filter((item) => item.id !== id);
          return {
            items: updatedItems,
            count: calcCount(updatedItems),
            subtotal: calcSubtotal(updatedItems),
          };
        });
      },

      

      clearCart: () => set({ items: [], count: 0, subtotal: 0 }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({
        // Persist only what you need
        items: state.items,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // After reading persisted items, recompute derived values
        state.count = calcCount(state.items);
        state.subtotal = calcSubtotal(state.items);
      },
    }
  )
);
