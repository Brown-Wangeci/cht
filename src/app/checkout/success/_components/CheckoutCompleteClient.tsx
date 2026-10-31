"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/stores/cart";

/**
 * Runs once the order exists: empties the local cart and asks the server to end the
 * checkout (clears checkout/cart cookies, remembers the order for this receipt page).
 */
export default function CheckoutCompleteClient() {
  useEffect(() => {
    useCartStore.getState().resetCart();
    void fetch("/api/checkout/complete", { method: "POST" }).catch(() => {
      // Non-fatal: the cart API also rotates spent carts on the next sync.
    });
  }, []);

  return null;
}
