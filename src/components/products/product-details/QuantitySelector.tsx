// components/products/product-details/QuantitySelector.tsx
"use client";

import { useState } from "react";
import styles from "./QuantitySelector.module.css";

export default function QuantitySelector() {
  const [qty, setQty] = useState(1);

  const increment = () => setQty((q) => q + 1);
  const decrement = () => setQty((q) => (q > 1 ? q - 1 : 1));

  return (
    <div className={styles.wrapper} aria-label="Quantity selector">
      <button type="button" onClick={decrement} className={styles.button}>
        −
      </button>
      <span className={styles.value}>{qty}</span>
      <button type="button" onClick={increment} className={styles.button}>
        +
      </button>
    </div>
  );
}
