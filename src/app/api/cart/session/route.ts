import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "cart_session";

function createSessionId() {
  // simple session id (fine for json-server dev). For prod: use crypto.randomUUID()
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function POST() {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;

  if (!existing) {
    store.set(COOKIE_NAME, createSessionId(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return NextResponse.json({ ok: true });
}
