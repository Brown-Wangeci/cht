"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./ChangeItemsButton.module.css";
import { useCartStore } from "@/lib/stores/cart";

type Props = {
  /** Show regardless of the client-side lock flag (the payment page knows the cart is locked server-side). */
  alwaysVisible?: boolean;
};

export default function ChangeItemsButton({ alwaysVisible = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const locked = useCartStore((s) => s.locked);
  const setLocked = useCartStore((s) => s.setLocked);
  const setError = useCartStore((s) => s.setError);
  const rehydrateCart = useCartStore((s) => s.rehydrateCart);
  const openCart = useCartStore((s) => s.openCart);

  if (!locked && !alwaysVisible) return null;

  const handleChangeItems = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout/cancel", { method: "POST" });
      const data: { error?: string; redirectTo?: string } = await res.json().catch(() => ({}));

      if (res.status === 409 && data.redirectTo) {
        router.push(data.redirectTo);
        return;
      }

      if (!res.ok) throw new Error(data.error ?? "Failed to unlock your cart");

      // Cart is editable again; delivery details stay saved for when the shopper returns.
      setLocked(false);
      await rehydrateCart();

      router.push("/products");
      openCart();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleChangeItems}
      disabled={loading}
      className={styles.changeItemsButton}
    >
      {loading ? "Changing…" : "Change items"}
    </button>
  );
}
