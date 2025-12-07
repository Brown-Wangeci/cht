"use client";

import { useState } from "react";
import styles from "./SearchBar.module.css";
import { Search } from "lucide-react";

export default function SearchBar() {
  const [value, setValue] = useState("");

  return (
    <div className={styles.wrapper}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search..."
        className={styles.input}
      />
      <Search className={styles.icon} size={18} />
    </div>
  );
}
