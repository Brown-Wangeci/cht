import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getProductById } from "@/lib/products";
import type { CartItem } from "@/lib/stores/cart";

const JSON_BASE = process.env.JSON_SERVER_URL!;
const COOKIE_NAME = "cart_session";

type JsonCartItem = {
  id: string | number;
  sessionId: string;
  productId: string;
  quantity: number;
};

export async function GET() {
  const store = await cookies();
  const sessionId = store.get(COOKIE_NAME)?.value;

  if (!sessionId) {
    return NextResponse.json({ items: [] });
  }

  const res = await fetch(
    `${JSON_BASE}/cartItems?sessionId=${encodeURIComponent(sessionId)}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return NextResponse.json({ items: [] });
  }

  const raw = (await res.json()) as JsonCartItem[];

  // 🔹 Parallel product resolution (important improvement)
  const items = (
    await Promise.all(
      raw.map(async (row) => {
        const product = await getProductById(row.productId);
        if (!product) return null;

        return {
          ...product,
          quantity: Math.max(1, Math.min(99, Number(row.quantity) || 1)),
        } satisfies CartItem;
      })
    )
  ).filter(Boolean) as CartItem[];

  return NextResponse.json({ items });
}
