"use client";

import styles from "./QuantitySelector.module.css";

type Props = {
  value: number;
  min?: number;
  max?: number;

  onIncrement: () => void;
  onDecrement: () => void;

  disableDecrement?: boolean;
  disableIncrement?: boolean;
};

export default function QuantitySelector({
  value,
  min = 0,
  max = 99,
  onIncrement,
  onDecrement,
  disableDecrement,
  disableIncrement,
}: Props) {
  const canDecrement = value > min && !disableDecrement;
  const canIncrement = value < max && !disableIncrement;

  const displayValue = Math.max(min, Math.min(value, max));

  return (
    <div className={styles.wrapper} aria-label="Quantity selector">
      <button
        type="button"
        onClick={() => canDecrement && onDecrement()}
        className={styles.button}
        disabled={!canDecrement}
        aria-label="Decrease quantity"
        aria-disabled={!canDecrement}
      >
        −
      </button>

      <span className={styles.value} aria-live="polite">
        {displayValue}
      </span>

      <button
        type="button"
        onClick={() => canIncrement && onIncrement()}
        className={styles.button}
        disabled={!canIncrement}
        aria-label="Increase quantity"
        aria-disabled={!canIncrement}
      >
        +
      </button>
    </div>
  );
}
