"use client";

import styles from "./SortDropdown.module.css";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  options: string[];
};

export default function SortDropdown({ options }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(options[0]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close menu when clicking outside
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

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={styles.triggerLabel}>{selected}</span>
        <ChevronDown size={14} className={styles.icon} />
      </button>

      {open && (
        <div className={styles.menu}>
          {options.map((option) => {
            const isSelected = option === selected;

            return (
              <button
                key={option}
                className={`${styles.option} ${
                  isSelected ? styles.optionSelected : ""
                }`}
                onClick={() => {
                  setSelected(option);
                  setOpen(false);
                }}
              >
                <span className={styles.optionLabel}>{option}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
