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

export async function POST(req: Request) {
  const store = await cookies();
  const sessionId = store.get(COOKIE_NAME)?.value;
  if (!sessionId) return NextResponse.json({ error: "No session" }, { status: 401 });

  const body = (await req.json()) as { productId?: string; quantity?: number };
  const productId = String(body.productId ?? "").trim();
  const quantity = Math.max(1, Math.min(99, Number(body.quantity ?? 1)));

  if (!productId) {
    return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
  }

  const existingRes = await fetch(
    `${JSON_BASE}/cartItems?sessionId=${encodeURIComponent(sessionId)}&productId=${encodeURIComponent(productId)}`,
    { cache: "no-store" }
  );

  if (!existingRes.ok) {
    return NextResponse.json({ error: "Cart lookup failed" }, { status: 500 });
  }

  const existing = (await existingRes.json()) as JsonCartItem[];

  if (existing.length) {
    const row = existing[0];
    const patchRes = await fetch(`${JSON_BASE}/cartItems/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantity: Math.max(1, Math.min(99, row.quantity + quantity)),
      }),
    });

    if (!patchRes.ok) {
      return NextResponse.json({ error: "Failed to add" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  const createRes = await fetch(`${JSON_BASE}/cartItems`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, productId, quantity }),
  });

  if (!createRes.ok) {
    return NextResponse.json({ error: "Failed to add" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const store = await cookies();
  const sessionId = store.get(COOKIE_NAME)?.value;
  if (!sessionId) return NextResponse.json({ error: "No session" }, { status: 401 });

  const body = (await req.json()) as { productId?: string; quantity?: number };
  const productId = String(body.productId ?? "").trim();
  const quantity = Math.max(1, Math.min(99, Number(body.quantity ?? 1)));

  if (!productId) {
    return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
  }

  const existingRes = await fetch(
    `${JSON_BASE}/cartItems?sessionId=${encodeURIComponent(sessionId)}&productId=${encodeURIComponent(productId)}`,
    { cache: "no-store" }
  );

  if (!existingRes.ok) {
    return NextResponse.json({ error: "Cart lookup failed" }, { status: 500 });
  }

  const existing = (await existingRes.json()) as JsonCartItem[];
  if (!existing.length) return NextResponse.json({ ok: true });

  const row = existing[0];

  const patchRes = await fetch(`${JSON_BASE}/cartItems/${row.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  });

  if (!patchRes.ok) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const store = await cookies();
  const sessionId = store.get(COOKIE_NAME)?.value;
  if (!sessionId) return NextResponse.json({ error: "No session" }, { status: 401 });

  const url = new URL(req.url);
  const productId = String(url.searchParams.get("id") ?? "").trim();
  if (!productId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const existingRes = await fetch(
    `${JSON_BASE}/cartItems?sessionId=${encodeURIComponent(sessionId)}&productId=${encodeURIComponent(productId)}`,
    { cache: "no-store" }
  );

  if (!existingRes.ok) {
    return NextResponse.json({ error: "Cart lookup failed" }, { status: 500 });
  }

  const existing = (await existingRes.json()) as JsonCartItem[];
  if (!existing.length) return NextResponse.json({ ok: true });

  const row = existing[0];

  const delRes = await fetch(`${JSON_BASE}/cartItems/${row.id}`, { method: "DELETE" });
  if (!delRes.ok) {
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
