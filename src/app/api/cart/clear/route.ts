import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const JSON_BASE = process.env.JSON_SERVER_URL!;
const COOKIE_NAME = "cart_session";

type JsonCartItem = {
  id: string | number;
  sessionId: string;
  productId: string;
  quantity: number;
};

export async function POST() {
  const store = await cookies();
  const sessionId = store.get(COOKIE_NAME)?.value;
  if (!sessionId) return NextResponse.json({ ok: true });

  const res = await fetch(
    `${JSON_BASE}/cartItems?sessionId=${encodeURIComponent(sessionId)}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }

  const items = (await res.json()) as JsonCartItem[];

  await Promise.all(
    items.map((i) =>
      fetch(`${JSON_BASE}/cartItems/${i.id}`, { method: "DELETE" })
    )
  );

  return NextResponse.json({ ok: true });
}
