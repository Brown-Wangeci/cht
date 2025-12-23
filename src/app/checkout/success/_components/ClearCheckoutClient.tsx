"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/stores/cart";

export default function ClearCheckoutClient() {
  useEffect(() => {
    // 1) Clear persisted cart snapshot in localStorage (matches your persist name)
    try {
      localStorage.removeItem("tea-cart-storage");
    } catch {
      // ignore
    }

    // 2) Close drawer UI (nice UX)
    try {
      useCartStore.getState().closeCart?.();
    } catch {
      // ignore
    }
  }, []);

  return null;
}
