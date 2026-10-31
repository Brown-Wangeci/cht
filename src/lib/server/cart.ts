import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db, type Tx } from "@/db";
import { carts, productVariants, products, type CartLine, type CheckoutItemSnapshot } from "@/db/schema";
import { calcTotals, toMoney, type OrderTotals } from "@/lib/pricing";

export const MAX_QTY_PER_LINE = 99;
export const MAX_CART_LINES = 50;

export type ResolvedCartItem = CheckoutItemSnapshot & { stockOnHand: number };

const clampInt = (n: unknown, min: number, max: number) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, Math.trunc(num)));
};

/** Validates untrusted cart lines: drops malformed entries and merges duplicate variants. */
export function normalizeLines(items: unknown): CartLine[] {
  if (!Array.isArray(items)) return [];
  const byVariant = new Map<string, number>();

  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const raw = it as Record<string, unknown>;
    const variantId = typeof raw.variantId === "string" ? raw.variantId.trim() : "";
    if (!variantId || variantId.length > 100) continue;
    const quantity = clampInt(raw.quantity, 1, MAX_QTY_PER_LINE);
    byVariant.set(variantId, Math.min(MAX_QTY_PER_LINE, (byVariant.get(variantId) ?? 0) + quantity));
    if (byVariant.size >= MAX_CART_LINES) break;
  }

  return [...byVariant].map(([variantId, quantity]) => ({ variantId, quantity }));
}

/**
 * Resolves cart lines against the catalogue in a single query.
 * Server-trusted: prices come from product_variants, quantities are clamped to stock,
 * and unavailable (inactive / out of stock / deleted) variants are dropped.
 */
export async function resolveCartLines(lines: CartLine[], conn: typeof db | Tx = db): Promise<ResolvedCartItem[]> {
  if (!lines.length) return [];

  const rows = await conn
    .select({ variant: productVariants, product: products })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(inArray(productVariants.id, lines.map((l) => l.variantId)));

  const byId = new Map(rows.map((r) => [r.variant.id, r]));
  const items: ResolvedCartItem[] = [];

  for (const line of lines) {
    const row = byId.get(line.variantId);
    if (!row || row.product.active === false) continue;

    const stock = Number(row.variant.stockOnHand ?? 0);
    if (stock <= 0) continue;

    items.push({
      variantId: row.variant.id,
      productId: row.product.id,
      name: row.product.name,
      slug: row.product.slug,
      category: row.product.category,
      image: row.product.images?.[0] ?? "",
      weightGrams: Number(row.variant.weightGrams) || 0,
      price: toMoney(row.variant.price),
      quantity: clampInt(line.quantity, 1, Math.min(MAX_QTY_PER_LINE, stock)),
      stockOnHand: stock,
    });
  }

  return items;
}

export type CartSnapshot = {
  status: string | null;
  lineCount: number;
  items: ResolvedCartItem[];
  totals: OrderTotals;
};

/** Loads a cart by id and resolves it. `lineCount` is the raw line count, before unavailable items are dropped. */
export async function getCartSnapshot(cartId: string | undefined, conn: typeof db | Tx = db): Promise<CartSnapshot> {
  if (!cartId) return { status: null, lineCount: 0, items: [], totals: calcTotals([]) };

  const [cart] = await conn.select().from(carts).where(eq(carts.id, cartId)).limit(1);
  const lines = normalizeLines(cart?.items);
  const items = await resolveCartLines(lines, conn);

  return { status: cart?.status ?? null, lineCount: lines.length, items, totals: calcTotals(items) };
}

export const toSnapshot = (items: ResolvedCartItem[]): CheckoutItemSnapshot[] =>
  items.map((i) => ({
    variantId: i.variantId,
    productId: i.productId,
    name: i.name,
    slug: i.slug,
    category: i.category,
    image: i.image,
    weightGrams: i.weightGrams,
    price: i.price,
    quantity: i.quantity,
  }));
