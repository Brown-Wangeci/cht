"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./SearchBar.module.css";
import { Search } from "lucide-react";

type Props = {
  defaultValue?: string;
  onSearch(value: string): void;
};

export default function SearchBar({ defaultValue = "", onSearch }: Props) {
  const [value, setValue] = useState(defaultValue);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const submit = (v: string) => {
    if (timer.current) clearTimeout(timer.current);
    onSearch(v.trim());
  };

  return (
    <form
      className={styles.wrapper}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
    >
      <input
        type="search"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => onSearch(v.trim()), 350);
        }}
        placeholder="Search teas…"
        aria-label="Search products"
        maxLength={100}
        className={styles.input}
      />
      <Search className={styles.icon} size={18} aria-hidden />
    </form>
  );
}
