"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/stores/cart";

/** Restores the persisted cart after mount so server and first client render agree (no hydration mismatch). */
export default function CartHydrator() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  return null;
}
