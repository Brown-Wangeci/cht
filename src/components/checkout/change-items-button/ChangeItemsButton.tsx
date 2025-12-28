"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./ChangeItemsButton.module.css";
import { useCartStore } from "@/lib/stores/cart";

export default function ChangeItemsButton() {
  console.log("Rendering ChangeItemsButton");
  const router = useRouter();
  const [loading, setLoading] = useState(false);


  const locked = useCartStore((s) => s.locked);
  const setLocked = useCartStore((s) => s.setLocked);
  const setError = useCartStore((s) => s.setError);
  const rehydrateCart = useCartStore((s) => s.rehydrateCart)

  console.log("Cart locked state:", locked);

  if (!locked) return null;

  console.log("Rendering ChangeItemsButton for locked cart");

  const handleCancelCheckout = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => ({}));


      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to cancel checkout");
      }

      // success: unlock cart + clear error
      setLocked(false);
      setError(null);

      // Optional but good: refresh state from server after cancel
      void rehydrateCart();

      /**
       * ✅ Cart is now unlocked
       * ✅ Checkout session is cancelled
       * User can safely modify cart
       */
      router.push("/products"); // or "/checkout/shipping"
      router.refresh();
    } catch (err: any) {
      setLoading(false);
      alert(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCancelCheckout}
      disabled={loading}
      className={styles.changeItemsButton}
    >
        {loading ? "Changing…" : "Change Items"}
    </button>
  );
}
