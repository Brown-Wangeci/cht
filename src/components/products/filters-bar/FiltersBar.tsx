"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import FilterDropdown from "../filter-dropdown/FilterDropdown";
import SearchBar from "../search-bar/SearchBar";
import SortDropdown from "../sort-dropdown/SortDropdown";
import styles from "./FiltersBar.module.css";
import { AVAILABILITY_OPTIONS, SORT_OPTIONS } from "@/types/product";

export type CatalogFilters = {
  q: string;
  categories: string[];
  availability: string[];
  sort: string;
};

type Props = {
  categories: string[];
  current: CatalogFilters;
};

/** Filters live in the URL so results are server-rendered, shareable and survive refresh. */
export default function FiltersBar({ categories, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const navigate = (next: CatalogFilters) => {
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    next.categories.forEach((c) => params.append("category", c));
    next.availability.forEach((a) => params.append("availability", a));
    if (next.sort && next.sort !== "featured") params.set("sort", next.sort);

    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return (
    <div className={styles.bar} aria-busy={isPending}>
      <div className={styles.left}>
        <span className={styles.label}>Filter:</span>
        <FilterDropdown
          label="Type"
          items={categories.map((c) => ({ value: c, label: c }))}
          selected={current.categories}
          onChange={(selected) => navigate({ ...current, categories: selected })}
        />
        <FilterDropdown
          label="Availability"
          items={[...AVAILABILITY_OPTIONS]}
          selected={current.availability}
          onChange={(selected) => navigate({ ...current, availability: selected })}
        />
      </div>

      <div className={styles.center}>
        <SearchBar defaultValue={current.q} onSearch={(q) => q !== current.q && navigate({ ...current, q })} />
      </div>

      <div className={styles.right}>
        <span className={styles.label}>Sort by:</span>
        <SortDropdown
          options={SORT_OPTIONS}
          value={current.sort}
          onChange={(sort) => navigate({ ...current, sort })}
        />
      </div>
    </div>
  );
}
