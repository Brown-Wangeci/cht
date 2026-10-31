"use client";

import styles from "./SortDropdown.module.css";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Option = { value: string; label: string };

type Props = {
  options: readonly Option[];
  value: string;
  onChange(value: string): void;
};

export default function SortDropdown({ options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  // Close menu when clicking outside / Escape
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

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={styles.triggerLabel}>{selected.label}</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className={styles.menu} role="listbox" aria-label="Sort by">
          {options.map((option) => {
            const isSelected = option.value === selected.value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`${styles.option} ${
                  isSelected ? styles.optionSelected : ""
                }`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span className={styles.optionLabel}>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
