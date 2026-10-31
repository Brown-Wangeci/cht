import "server-only";
import { db } from "@/db";
import { products } from "@/db/schema";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { toMoney } from "@/lib/pricing";
import type {
  AvailabilityOption,
  Product,
  ProductVariant,
  ProductWithVariants,
  SortOption,
} from "@/types/product";

export type { Product, ProductVariant, ProductWithVariants } from "@/types/product";

type ProductRow = Product & { variants: (Omit<ProductVariant, "price"> & { price: string | number })[] };

const normalize = (p: ProductRow): ProductWithVariants => ({
  ...p,
  variants: Array.isArray(p.variants)
    ? p.variants
        .map((v) => ({ ...v, price: toMoney(v.price) }))
        .sort((a, b) => a.weightGrams - b.weightGrams)
    : [],
});

const withVariants = { variants: true } as const;

export async function getAllProducts(): Promise<ProductWithVariants[]> {
  const rows = await db.query.products.findMany({
    where: eq(products.active, true),
    with: withVariants,
    orderBy: [desc(products.createdAt)],
  });
  return rows.map(normalize);
}

export async function getProductBySlug(slug: string): Promise<ProductWithVariants | undefined> {
  const row = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.active, true)),
    with: withVariants,
  });
  return row ? normalize(row) : undefined;
}

export async function getFeaturedProducts(limit = 3): Promise<ProductWithVariants[]> {
  const rows = await db.query.products.findMany({
    where: and(eq(products.isBestSeller, true), eq(products.active, true)),
    with: withVariants,
    orderBy: [desc(products.createdAt)],
    limit,
  });

  if (rows.length >= limit) return rows.map(normalize);

  // Not enough best-sellers flagged yet: top up with the newest products so the section never looks empty.
  const fill = await db.query.products.findMany({
    where: and(eq(products.active, true), sql`coalesce(${products.isBestSeller}, false) = false`),
    with: withVariants,
    orderBy: [desc(products.createdAt)],
    limit: limit - rows.length,
  });

  return [...rows, ...fill].map(normalize);
}

export async function getRelatedProducts(currentSlug: string, limit = 3): Promise<ProductWithVariants[]> {
  const current = await db.query.products.findFirst({
    where: eq(products.slug, currentSlug),
    columns: { category: true, slug: true },
  });

  if (!current) return [];

  const sameCategory = await db.query.products.findMany({
    where: and(
      eq(products.active, true),
      ne(products.slug, current.slug),
      eq(products.category, current.category)
    ),
    with: withVariants,
    orderBy: [sql`random()`],
    limit,
  });

  if (sameCategory.length >= limit) return sameCategory.map(normalize);

  const fill = await db.query.products.findMany({
    where: and(
      eq(products.active, true),
      ne(products.slug, current.slug),
      ne(products.category, current.category)
    ),
    with: withVariants,
    orderBy: [sql`random()`],
    limit: limit - sameCategory.length,
  });

  return [...sameCategory, ...fill].map(normalize);
}

export type CatalogQuery = {
  q?: string;
  categories?: string[];
  availability?: AvailabilityOption[];
  sort?: SortOption;
};

const minPrice = (p: ProductWithVariants) =>
  p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : Number.POSITIVE_INFINITY;

const inStock = (p: ProductWithVariants) => p.variants.some((v) => (v.stockOnHand ?? 0) > 0);

/** Shop listing: the catalogue is small, so filtering/sorting happens in memory on one query. */
export async function getCatalog(query: CatalogQuery) {
  const all = await getAllProducts();
  const categories = [...new Set(all.map((p) => p.category))].sort((a, b) => a.localeCompare(b));

  const q = query.q?.trim().toLowerCase();
  const wantedCategories = new Set(query.categories ?? []);
  const wantedAvailability = new Set(query.availability ?? []);

  let items = all.filter((p) => {
    if (wantedCategories.size && !wantedCategories.has(p.category)) return false;
    if (wantedAvailability.size === 1) {
      if (wantedAvailability.has("in-stock") && !inStock(p)) return false;
      if (wantedAvailability.has("out-of-stock") && inStock(p)) return false;
    }
    if (q) {
      const haystack = [p.name, p.category, p.description, ...(p.tastingNotes ?? [])].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const byDate = (a: ProductWithVariants, b: ProductWithVariants) =>
    (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);

  switch (query.sort) {
    case "price-asc":
      items = items.sort((a, b) => minPrice(a) - minPrice(b));
      break;
    case "price-desc":
      items = items.sort((a, b) => minPrice(b) - minPrice(a));
      break;
    case "newest":
      items = items.sort(byDate);
      break;
    case "name":
      items = items.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      // Featured: in-stock first, then best-sellers, then newest.
      items = items.sort(
        (a, b) =>
          Number(inStock(b)) - Number(inStock(a)) ||
          Number(!!b.isBestSeller) - Number(!!a.isBestSeller) ||
          byDate(a, b)
      );
  }

  return { items, categories, total: all.length };
}
