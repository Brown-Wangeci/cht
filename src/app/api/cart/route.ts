import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

import { db } from "@/db";
import { carts, productVariants } from "@/db/schema";
import { eq } from "drizzle-orm";

type CartLine = { variantId: string; quantity: number };

const CART_SESSION_COOKIE = "cart_session";

const clampInt = (n: unknown, min: number, max: number) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, Math.trunc(num)));
};

const money = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : 0;
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

const normalizeLines = (items: unknown): CartLine[] => {
  if (!Array.isArray(items)) return [];
  const out: CartLine[] = [];
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const variantId = String((it as any).variantId ?? "").trim();
    const quantity = clampInt((it as any).quantity, 1, 99);
    if (!variantId) continue;
    out.push({ variantId, quantity });
  }
  return out;
};

// ✅ Read cookie; if missing, create and set it
const getOrCreateSessionId = async () => {
  const store = await cookies();
  let sessionId = store.get(CART_SESSION_COOKIE)?.value?.trim();

  let created = false;
  if (!sessionId) {
    sessionId = randomUUID();
    created = true;
  }

  return { sessionId, created };
};

const cookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

/**
 * POST: snapshot sync (guest)
 * body: { items: [{variantId, quantity}] }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const lines = normalizeLines(body?.items);

    const { sessionId, created } = await getOrCreateSessionId();

    // Check cart status before updating
    const [existingCart] = await db
      .select({ status: carts.status })
      .from(carts)
      .where(eq(carts.id, sessionId))
      .limit(1);

    if (existingCart?.status === "locked") {
      return NextResponse.json(
        { code: "CART_LOCKED", message: "Cart is locked for checkout" },
        { status: 409 }
      );
    }

    await db
      .insert(carts)
      .values({
        id: sessionId,
        items: lines,
        status: "open", // ensure status is open on upsert
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: carts.id,
        set: {
          items: lines,
          updatedAt: new Date()
        },
      });

    const res = NextResponse.json({ success: true });

    if (created) {
      res.cookies.set(CART_SESSION_COOKIE, sessionId, cookieOptions);
    }

    return res;
  } catch (error) {
    console.error("Cart POST Sync Error:", error);
    return NextResponse.json({ error: "Failed to sync cart" }, { status: 500 });
  }
}

/**
 * GET: resolves cart lines into UI-ready items
 * returns: { items: [...] }
 */
export async function GET() {
  try {
    const { sessionId, created } = await getOrCreateSessionId();

    const [existingCart] = await db
      .select()
      .from(carts)
      .where(eq(carts.id, sessionId))
      .limit(1);

    const lines = normalizeLines(existingCart?.items ?? []);
    if (!lines.length) {
      const res = NextResponse.json({ items: [] });
      if (created) res.cookies.set(CART_SESSION_COOKIE, sessionId, cookieOptions);
      return res;
    }

    const resolved = await Promise.all(
      lines.map(async (line) => {
        const variant = await db.query.productVariants.findFirst({
          where: eq(productVariants.id, line.variantId),
          with: { product: true },
        });

        if (!variant || !variant.product) return null;

        const image =
          Array.isArray(variant.product.images) && variant.product.images.length
            ? variant.product.images[0]!
            : "";

        return {
          variantId: variant.id,
          productId: variant.product.id,
          slug: variant.product.slug,
          name: variant.product.name,
          category: variant.product.category,
          image,
          weightGrams: variant.weightGrams,
          price: money(variant.price),
          quantity: clampInt(line.quantity, 1, 99),
          stockOnHand: variant.stockOnHand ?? 0,
        };
      })
    );

    const items = resolved.filter((x): x is NonNullable<typeof x> => Boolean(x));

    const res = NextResponse.json({ items });

    if (created) {
      res.cookies.set(CART_SESSION_COOKIE, sessionId, cookieOptions);
    }

    return res;
  } catch (error) {
    console.error("Cart GET Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}
