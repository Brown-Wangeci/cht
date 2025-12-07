"use client";

import FilterDropdown from "../filter-dropdown/FilterDropdown";
import SearchBar from "../search-bar/SearchBar";
import SortDropdown from "../sort-dropdown/SortDropdown";
import styles from "./FiltersBar.module.css";

export default function FiltersBar() {
  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <span className={styles.label}>Filter:</span>
        <FilterDropdown label="Type" items={["Black Tea", "Green Tea", "Herbal", "Oolong"]} />
        <FilterDropdown label="Availability" items={["In Stock", "Out of Stock"]} />
        <FilterDropdown label="Packaging" items={["Loose Leaf", "Tea Bags", "Tin"]} />
      </div>

      <div className={styles.center}>
        <SearchBar />
      </div>

      <div className={styles.right}>
        <span className={styles.label}>Sort by:</span>
        <SortDropdown
          options={[
            "Price, low to high",
            "Price, high to low",
            "Newest",
            "Best selling",
          ]}
        />
      </div>
    </div>
  );
}
