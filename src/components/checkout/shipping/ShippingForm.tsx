import ShippingButton from "./shipping-button/ShippingButton";
import styles from "./ShippingForm.module.css";
import { submitShipping } from "@/lib/actions/checkout";


export default function ShippingForm() {
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Delivery details</h2>

      <form className={styles.form} action={submitShipping}>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="firstName">
              First name*
            </label>
            <input
              className={styles.input}
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="lastName">
              Last name*
            </label>
            <input
              className={styles.input}
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              required
            />
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">
              Phone number*
            </label>
            <input
              className={styles.input}
              id="phone"
              name="phone"
              autoComplete="tel"
              inputMode="tel"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email*
            </label>
            <input
              className={styles.input}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="address1">
            Address line 1*
          </label>
          <input
            className={styles.input}
            id="address1"
            name="address1"
            autoComplete="shipping address-line1"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="address2">
            Address line 2 (optional)
          </label>
          <input
            className={styles.input}
            id="address2"
            name="address2"
            autoComplete="shipping address-line2"
          />
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="city">
              City / Town*
            </label>
            <input
              className={styles.input}
              id="city"
              name="city"
              autoComplete="shipping address-level2"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="country">
              Country*
            </label>
            <input
              className={styles.input}
              id="country"
              name="country"
              autoComplete="country-name"
              defaultValue="Kenya"
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="notes">
            Delivery notes (optional)
          </label>
          <textarea
            className={styles.textarea}
            id="notes"
            name="notes"
            rows={4}
          />
        </div>

        {/* <button className={styles.primaryBtn} type="submit">
          Continue to payment
        </button>

        <p className={styles.helper}>
          You can still go back and add items — only the order summary updates.
        </p> */}
        <ShippingButton
            className={styles.primaryBtn} 
            helperClassName={styles.helper}
        />
      </form>
    </section>
  );
}
