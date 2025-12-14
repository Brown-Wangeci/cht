"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getProductById } from "@/lib/products";

export type CheckoutCartItemInput = {
  id: string;
  name: string;
  slug: string;
  category: string;
  image: string;
  price: number;
  quantity: number;
};

export type CheckoutTotals = {
  count: number;
  subtotal: number;
};

export type CheckoutShippingCookie = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  country: string;
  notes: string;
  totals: CheckoutTotals;
  items: CheckoutCartItemInput[];
};

const CHECKOUT_SHIPPING_COOKIE = "checkout_shipping";
const CART_SESSION_COOKIE = "cart_session";

const JSON_BASE = process.env.JSON_SERVER_URL!;
const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: isProd,
  path: "/" as const,
};

type JsonCartItem = {
  id: string | number;
  sessionId: string;
  productId: string;
  quantity: number;
};

const clampInt = (n: unknown, min: number, max: number) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, Math.trunc(num)));
};

const clampMoney = (n: unknown) => {
  const num = Number(n);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100) / 100;
};

const calcTotals = (items: CheckoutCartItemInput[]): CheckoutTotals => {
  const count = items.reduce((t, i) => t + (Number(i.quantity) || 0), 0);
  const subtotal = items.reduce(
    (t, i) => t + (Number(i.price) || 0) * (Number(i.quantity) || 0),
    0
  );
  return {
    count,
    subtotal: Math.round(subtotal * 100) / 100,
  };
};

const normalizePhone = (phone: string) => phone.replace(/[^\d+]/g, "");
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getRequired = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

const getOptional = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

/**
 * Server-trusted cart snapshot:
 * Reads the JSON-server cart using the httpOnly `cart_session` cookie,
 * then resolves product details (incl. official price) from `products`.
 */
export async function getCheckoutCartSnapshot(): Promise<{
  items: CheckoutCartItemInput[];
  totals: CheckoutTotals;
}> {
  const store = await cookies();
  const sessionId = store.get(CART_SESSION_COOKIE)?.value;

  if (!sessionId) {
    return { items: [], totals: { count: 0, subtotal: 0 } };
  }

  const res = await fetch(
    `${JSON_BASE}/cartItems?sessionId=${encodeURIComponent(sessionId)}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return { items: [], totals: { count: 0, subtotal: 0 } };
  }

  const raw = (await res.json()) as JsonCartItem[];

  const items = (
    await Promise.all(
      raw.map(async (row) => {
        const productId = String(row.productId ?? "").trim();
        if (!productId) return null;

        const product = await getProductById(productId);
        if (!product) return null;

        const qty = clampInt(row.quantity, 1, 99);

        const image = Array.isArray(product.images) ? product.images[0] ?? "" : "";

        return {
          id: String(product.id),
          name: String(product.name ?? "").trim(),
          slug: String(product.slug ?? "").trim(),
          category: String(product.category ?? "").trim(),
          image: String(image ?? "").trim(),
          price: clampMoney(product.price),
          quantity: qty,
        } satisfies CheckoutCartItemInput;
      })
    )
  ).filter(Boolean) as CheckoutCartItemInput[];

  const totals = calcTotals(items);
  return { items, totals };
}

export async function submitShipping(formData: FormData) {
  const firstName = getRequired(formData, "firstName");
  const lastName = getRequired(formData, "lastName");
  const email = getRequired(formData, "email");
  const phoneRaw = getRequired(formData, "phone");

  const address1 = getRequired(formData, "address1");
  const address2 = getOptional(formData, "address2");
  const city = getRequired(formData, "city");
  const country = getRequired(formData, "country");
  const notes = getOptional(formData, "notes");

  const phone = normalizePhone(phoneRaw);

  // ✅ Read server-trusted cart (JSON-server session)
  const { items, totals } = await getCheckoutCartSnapshot();

  if (!items.length) redirect("/products");

  if (
    !firstName ||
    !lastName ||
    !email ||
    !isValidEmail(email) ||
    !phone ||
    !address1 ||
    !city ||
    !country
  ) {
    redirect("/checkout/shipping");
  }

  const store = await cookies();
  store.set(
    CHECKOUT_SHIPPING_COOKIE,
    JSON.stringify({
      firstName,
      lastName,
      email,
      phone,
      address1,
      address2,
      city,
      country,
      notes,
      totals,
      items,
    } satisfies CheckoutShippingCookie),
    { ...cookieOptions }
  );

  redirect("/checkout/payment");
}
