import { db } from "@/db";
import { checkoutSessions } from "@/db/schema";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCheckoutCartSnapshot } from "@/lib/actions/checkout";

const CART_SESSION_COOKIE = "cart_session";

const normalizePhone = (phone: string) => String(phone ?? "").replace(/[^\d+]/g, "");
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const str = (v: unknown) => String(v ?? "").trim();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ sessionId comes from cookie (server-owned)
    const store = await cookies();
    const cartSessionId = store.get(CART_SESSION_COOKIE)?.value?.trim();

    if (!cartSessionId) {
      return NextResponse.json({ error: "Missing cart session" }, { status: 400 });
    }

    // ✅ server-trusted totals/items (prevents total tampering)
    const { items, totals } = await getCheckoutCartSnapshot();

    if (!items.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // ✅ validate input fields (minimal, aligned with your submitShipping)
    const email = str(body.email);
    const firstName = str(body.firstName);
    const lastName = str(body.lastName);
    const phone = normalizePhone(body.phone);

    const addressLine1 = str(body.address);
    const city = str(body.city);

    if (
      !firstName ||
      !lastName ||
      !email ||
      !isValidEmail(email) ||
      !phone ||
      !addressLine1 ||
      !city
    ) {
      return NextResponse.json({ error: "Invalid checkout details" }, { status: 400 });
    }

    const [session] = await db
      .insert(checkoutSessions)
      .values({
        cartSessionId,          // ✅ cookie-derived
        email,
        firstName,
        lastName,
        phone,
        addressLine1,
        city,
        totalAmount: String(totals.subtotal), // ✅ server-derived (numeric column accepts string)
        status: "pending",
      })
      .returning();

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Checkout POST Error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
