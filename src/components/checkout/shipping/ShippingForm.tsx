"use client";

import styles from "./ShippingForm.module.css";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  submitShipping,
  type ShippingField,
  type ShippingValues,
  type SubmitShippingResult,
} from "@/lib/actions/checkout";
import { useCartStore } from "@/lib/stores/cart";

type Props = {
  initialValues: Partial<ShippingValues> | null;
};

type FieldProps = {
  id: ShippingField;
  label: string;
  error?: string;
  children: React.ReactNode;
};

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p id={`${id}-error`} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function ShippingForm({ initialValues }: Props) {
  const router = useRouter();

  // zustand state
  const count = useCartStore((s) => s.count);
  const hydrated = useCartStore((s) => s.hydrated);
  const dirty = useCartStore((s) => s.dirty);
  const syncing = useCartStore((s) => s.syncing);

  // zustand actions
  const setLocked = useCartStore((s) => s.setLocked);
  const setError = useCartStore((s) => s.setError);
  const rehydrateCart = useCartStore((s) => s.rehydrateCart);

  const [state, formAction, pending] = useActionState<SubmitShippingResult | null, FormData>(
    submitShipping,
    null
  );

  const failed = state && !state.ok ? state : null;
  const fieldErrors = failed?.fieldErrors ?? {};

  // Submitted values win (React resets uncontrolled forms after an action), then saved details.
  const value = (k: ShippingField) =>
    failed?.values?.[k] ?? initialValues?.[k] ?? (k === "country" ? "Kenya" : "");

  const inputProps = (k: ShippingField) => ({
    id: k,
    name: k,
    defaultValue: value(k),
    "aria-invalid": fieldErrors[k] ? true : undefined,
    "aria-describedby": fieldErrors[k] ? `${k}-error` : undefined,
  });

  const isCartEmpty = hydrated && count === 0;
  const isSyncingBlocked = dirty || syncing;
  const isBlocked = isCartEmpty || isSyncingBlocked || pending;

  let helperText = "You can still go back and add items — only the order summary updates.";
  let buttonText = "Continue to payment";

  if (pending) {
    buttonText = "Saving…";
  } else if (isCartEmpty) {
    helperText = "Please add at least one item to your cart to proceed to payment.";
  } else if (isSyncingBlocked) {
    helperText = "The cart is currently syncing with the server. Please wait…";
  }

  useEffect(() => {
    if (!state) return;

    if (state.ok) {
      setError(null);
      setLocked(true);      // optimistic UX
      void rehydrateCart(); // confirm from server
      router.push("/checkout/payment");
      return;
    }

    if (state.redirectTo) {
      setError(state.error);
      router.push(state.redirectTo);
    }
  }, [state, setError, setLocked, rehydrateCart, router]);

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Delivery details</h2>

      <form className={styles.form} action={formAction} noValidate>
        {failed?.error && (
          <p className={styles.formError} role="alert">
            {failed.error}
          </p>
        )}

        <div className={styles.grid2}>
          <Field id="firstName" label="First name*" error={fieldErrors.firstName}>
            <input className={styles.input} autoComplete="given-name" required maxLength={60} {...inputProps("firstName")} />
          </Field>

          <Field id="lastName" label="Last name*" error={fieldErrors.lastName}>
            <input className={styles.input} autoComplete="family-name" required maxLength={60} {...inputProps("lastName")} />
          </Field>
        </div>

        <div className={styles.grid2}>
          <Field id="phone" label="Phone number*" error={fieldErrors.phone}>
            <input
              className={styles.input}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="0712 345 678"
              required
              maxLength={20}
              {...inputProps("phone")}
            />
          </Field>

          <Field id="email" label="Email*" error={fieldErrors.email}>
            <input className={styles.input} type="email" autoComplete="email" required maxLength={254} {...inputProps("email")} />
          </Field>
        </div>

        <Field id="address1" label="Address line 1*" error={fieldErrors.address1}>
          <input
            className={styles.input}
            autoComplete="shipping address-line1"
            placeholder="Street, building, apartment"
            required
            maxLength={200}
            {...inputProps("address1")}
          />
        </Field>

        <Field id="address2" label="Address line 2 (optional)" error={fieldErrors.address2}>
          <input className={styles.input} autoComplete="shipping address-line2" maxLength={200} {...inputProps("address2")} />
        </Field>

        <div className={styles.grid2}>
          <Field id="city" label="City / Town*" error={fieldErrors.city}>
            <input className={styles.input} autoComplete="shipping address-level2" required maxLength={80} {...inputProps("city")} />
          </Field>

          <Field id="country" label="Country*" error={fieldErrors.country}>
            <input className={styles.input} autoComplete="country-name" required maxLength={60} {...inputProps("country")} />
          </Field>
        </div>

        <Field id="notes" label="Delivery notes (optional)" error={fieldErrors.notes}>
          <textarea className={styles.textarea} rows={4} maxLength={500} {...inputProps("notes")} />
        </Field>

        <button className={styles.primaryBtn} type="submit" disabled={isBlocked}>
          {buttonText}
        </button>

        <p className={styles.helper}>{helperText}</p>
      </form>
    </section>
  );
}
