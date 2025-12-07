"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./FilterDropdown.module.css";
import { ChevronDown } from "lucide-react";

type Props = {
  label: string;
  items: string[];
  onChange?(selected: string[]): void;
};

export default function FilterDropdown({ label, items, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleItem = (item: string) => {
    setSelected((prev) => {
      const exists = prev.includes(item);
      const next = exists ? prev.filter((i) => i !== item) : [...prev, item];
      onChange?.(next);
      return next;
    });
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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
      >
        <span>{triggerLabel}</span>
        <ChevronDown size={14} className={styles.icon} />
      </button>

      {open && (
        <div className={styles.menu}>
          <div className={styles.menuInner}>
            {items.map((item) => {
              const isChecked = selected.includes(item);

              return (
                <button
                  key={item}
                  type="button"
                  className={`${styles.item} ${isChecked ? styles.itemSelected : ""}`}
                  onClick={() => toggleItem(item)}
                >
                  <span
                    className={`${styles.checkbox} ${
                      isChecked ? styles.checkboxChecked : ""
                    }`}
                  >
                    <span className={styles.checkboxInner} />
                  </span>
                  <span className={styles.itemLabel}>{item}</span>
                </button>
              );
            })}
          </div>

          {hasSelection && (
            <button
              type="button"
              className={styles.clear}
              onClick={() => {
                setSelected([]);
                onChange?.([]);
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
