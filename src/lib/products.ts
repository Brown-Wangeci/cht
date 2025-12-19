import { db } from "@/db";
import { products } from "@/db/schema";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import type { products as productsTable, productVariants as variantsTable } from "@/db/schema";

export type Product = InferSelectModel<typeof productsTable>;

export type ProductVariant = Omit<InferSelectModel<typeof variantsTable>, "price"> & {
  price: number; // force numeric for UI
};

export type ProductWithVariants = Product & { variants: ProductVariant[] };

const money = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : 0;
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

const normalize = (p: any): ProductWithVariants => ({
  ...p,
  variants: Array.isArray(p.variants)
    ? p.variants.map((v: any) => ({ ...v, price: money(v.price) }))
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

export async function getProductById(id: string): Promise<ProductWithVariants | undefined> {
  const row = await db.query.products.findFirst({
    where: and(eq(products.id, id), eq(products.active, true)),
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
  return rows.map(normalize);
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

  const remaining = limit - sameCategory.length;

  const fill = await db.query.products.findMany({
    where: and(
      eq(products.active, true),
      ne(products.slug, current.slug),
      ne(products.category, current.category)
    ),
    with: withVariants,
    orderBy: [sql`random()`],
    limit: remaining,
  });

  return [...sameCategory, ...fill].map(normalize);
}
