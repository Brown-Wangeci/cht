"use client";

import styles from "./ShippingForm.module.css";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitShipping, type SubmitShippingResult } from "@/lib/actions/checkout";
import { useCartStore } from "@/lib/stores/cart";

type Props = {
  initialValues: Record<string, string> | null;
};

export default function ShippingForm({ initialValues }: Props) {
  const router = useRouter();

  // zustand state
  const count = useCartStore((s) => s.count);
  const dirty = useCartStore((s) => s.dirty);
  const syncing = useCartStore((s) => s.syncing);

  // zustand actions
  const setLocked = useCartStore((s) => s.setLocked);
  const setError = useCartStore((s) => s.setError);
  const rehydrateCart = useCartStore((s) => s.rehydrateCart);

  const initialState: SubmitShippingResult = { ok: false, error: "" };

  const [state, formAction, pending] = useActionState<SubmitShippingResult, FormData>(
    async (_prev, formData) => submitShipping(formData),
    initialState
  );

  const isCartEmpty = count === 0;
  const isSyncingBlocked = dirty || syncing;
  const isBlocked = isCartEmpty || isSyncingBlocked || pending;

  let helperText = "You can still go back and add items — only the order summary updates.";
  let buttonText = "Continue to payment";

  if (pending) {
    buttonText = "Submitting…";
  } else if (isCartEmpty) {
    helperText = "Please add at least one item to your cart to proceed to payment.";
  } else if (isSyncingBlocked) {
    helperText = "The cart is currently syncing with the server. Please wait…";
  }

  useEffect(() => {
    if (!state) return;

    console.log("ShippingForm useActionState result:", state);

    if (state.ok) {
      setError(null);
      setLocked(true);      // optimistic UX
      void rehydrateCart(); // confirm from server
      router.push("/checkout/payment");
      router.refresh();
      return;
    }

    if (!state.ok && state.error) {
      setError(state.error);
      alert(state.error);

      if (state.redirectTo) {
        router.push(state.redirectTo);
        router.refresh();
      }
    }
  }, [state, setError, setLocked, rehydrateCart, router]);

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Delivery details</h2>

      <form className={styles.form} action={formAction}>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="firstName">First name*</label>
            <input
              className={styles.input}
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              required
              defaultValue={initialValues?.firstName ?? ""}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="lastName">Last name*</label>
            <input
              className={styles.input}
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              required
              defaultValue={initialValues?.lastName ?? ""}
            />
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">Phone number*</label>
            <input
              className={styles.input}
              id="phone"
              name="phone"
              autoComplete="tel"
              inputMode="tel"
              required
              defaultValue={initialValues?.phone ?? ""}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email*</label>
            <input
              className={styles.input}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={initialValues?.email ?? ""}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="address1">Address line 1*</label>
          <input
            className={styles.input}
            id="address1"
            name="address1"
            autoComplete="shipping address-line1"
            required
            defaultValue={initialValues?.address1 ?? ""}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="address2">Address line 2 (optional)</label>
          <input
            className={styles.input}
            id="address2"
            name="address2"
            autoComplete="shipping address-line2"
            defaultValue={initialValues?.address2 ?? ""}
          />
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="city">City / Town*</label>
            <input
              className={styles.input}
              id="city"
              name="city"
              autoComplete="shipping address-level2"
              required
              defaultValue={initialValues?.city ?? ""}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="country">Country*</label>
            <input
              className={styles.input}
              id="country"
              name="country"
              autoComplete="country-name"
              required
              defaultValue={initialValues?.country ?? "Kenya"}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="notes">Delivery notes (optional)</label>
          <textarea
            className={styles.textarea}
            id="notes"
            name="notes"
            rows={4}
            defaultValue={initialValues?.notes ?? ""}
          />
        </div>

        <button className={styles.primaryBtn} type="submit" disabled={isBlocked}>
          {buttonText}
        </button>

        <p className={styles.helper}>{helperText}</p>
      </form>
    </section>
  );
}
