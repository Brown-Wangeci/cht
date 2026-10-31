import type { Metadata } from "next";
import Link from "next/link";
import ProductGrid from "@/components/products/product-grid/ProductGrid";
import ProductsHeader from "@/components/products/products-header/ProductsHeader";
import Container from "@/components/common/container/Container";
import { getCatalog } from "@/lib/products";
import { AVAILABILITY_OPTIONS, SORT_OPTIONS, type AvailabilityOption, type SortOption } from "@/types/product";
import styles from "./ProductsPage.module.css";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop premium Kenyan teas and herbal infusions from the Central Highlands.",
  alternates: { canonical: "/products" },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? [v] : [])
    .flatMap((s) => s.split(","))
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;

  const q = first(sp.q).trim().slice(0, 100);
  const sortParam = first(sp.sort);
  const sort: SortOption = SORT_OPTIONS.some((o) => o.value === sortParam) ? (sortParam as SortOption) : "featured";
  const availability = list(sp.availability).filter((a): a is AvailabilityOption =>
    AVAILABILITY_OPTIONS.some((o) => o.value === a)
  );
  const categories = list(sp.category);

  const catalog = await getCatalog({ q, categories, availability, sort });
  const filtered = Boolean(q || categories.length || availability.length);

  return (
    <div>
      <ProductsHeader
        categories={catalog.categories}
        current={{ q, categories, availability, sort }}
      />

      {catalog.items.length ? (
        <ProductGrid products={catalog.items} />
      ) : (
        <Container>
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>
              {filtered ? "No teas match your filters" : "Our shelves are being restocked"}
            </p>
            <p className={styles.emptyText}>
              {filtered ? "Try a different search or clear the filters." : "Please check back soon."}
            </p>
            {filtered && (
              <Link href="/products" className={styles.emptyLink}>
                Clear all filters
              </Link>
            )}
          </div>
        </Container>
      )}
    </div>
  );
}
