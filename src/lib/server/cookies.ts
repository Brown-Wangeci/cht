import "server-only";

export const CART_SESSION_COOKIE = "cart_session";
export const CHECKOUT_SESSION_COOKIE = "checkout_session";
/** Set once an order completes so the success page stays viewable after the checkout cookie is cleared. */
export const LAST_ORDER_COOKIE = "last_order";

const base = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export const cartCookieOptions = { ...base, maxAge: 60 * 60 * 24 * 30 }; // 30 days
export const checkoutCookieOptions = { ...base, maxAge: 60 * 60 * 24 * 2 }; // 2 days
export const lastOrderCookieOptions = { ...base, maxAge: 60 * 60 * 24 }; // 1 day

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Cookie values are user-controlled; only accept well-formed UUIDs before they reach a uuid column. */
export const asUuid = (v: string | undefined | null) => {
  const s = String(v ?? "").trim();
  return UUID_RE.test(s) ? s : undefined;
};
