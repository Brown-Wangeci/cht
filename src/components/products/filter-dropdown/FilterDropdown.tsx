"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./FilterDropdown.module.css";
import { ChevronDown } from "lucide-react";

type Item = { value: string; label: string };

type Props = {
  label: string;
  items: Item[];
  selected: string[];
  onChange(selected: string[]): void;
};

export default function FilterDropdown({ label, items, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleItem = (value: string) => {
    const next = selected.includes(value) ? selected.filter((i) => i !== value) : [...selected, value];
    onChange(next);
  };

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const hasSelection = selected.length > 0;
  const triggerLabel = hasSelection ? `${label} · ${selected.length}` : label;

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <button
        type="button"
        className={`${styles.trigger} ${hasSelection ? styles.triggerActive : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span>{triggerLabel}</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className={styles.menu}>
          <div className={styles.menuInner} role="group" aria-label={label}>
            {items.map((item) => {
              const isChecked = selected.includes(item.value);

              return (
                <button
                  key={item.value}
                  type="button"
                  role="checkbox"
                  aria-checked={isChecked}
                  className={`${styles.item} ${isChecked ? styles.itemSelected : ""}`}
                  onClick={() => toggleItem(item.value)}
                >
                  <span
                    className={`${styles.checkbox} ${
                      isChecked ? styles.checkboxChecked : ""
                    }`}
                  >
                    <span className={styles.checkboxInner} />
                  </span>
                  <span className={styles.itemLabel}>{item.label}</span>
                </button>
              );
            })}
          </div>

          {hasSelection && (
            <button
              type="button"
              className={styles.clear}
              onClick={() => onChange([])}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
