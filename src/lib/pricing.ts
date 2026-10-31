/**
 * Delivery pricing shared by the client (cart drawer) and the server (authoritative totals).
 *
 * Configure via env (inlined at build time):
 *   NEXT_PUBLIC_DELIVERY_FEE_KES          flat delivery fee, e.g. 350
 *   NEXT_PUBLIC_FREE_DELIVERY_THRESHOLD_KES  subtotal at/above which delivery is free (default 5000)
 */
const toAmount = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export const CURRENCY = "KES";
export const DELIVERY_FEE = toAmount(process.env.NEXT_PUBLIC_DELIVERY_FEE_KES, 0);
export const FREE_DELIVERY_THRESHOLD = toAmount(
  process.env.NEXT_PUBLIC_FREE_DELIVERY_THRESHOLD_KES,
  5000
);

export const roundMoney = (n: number) => Math.round(n * 100) / 100;

export const toMoney = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : 0;
  return Number.isFinite(n) && n >= 0 ? roundMoney(n) : 0;
};

export function calcShippingFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  return roundMoney(DELIVERY_FEE);
}

export type OrderTotals = {
  count: number;
  subtotal: number;
  shippingFee: number;
  total: number;
};

export function calcTotals(items: { price: number; quantity: number }[]): OrderTotals {
  const count = items.reduce((t, i) => t + (i.quantity || 0), 0);
  const subtotal = roundMoney(items.reduce((t, i) => t + (i.price || 0) * (i.quantity || 0), 0));
  const shippingFee = calcShippingFee(subtotal);
  return { count, subtotal, shippingFee, total: roundMoney(subtotal + shippingFee) };
}

const kes = new Intl.NumberFormat("en-KE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatKES = (n: number | string | null | undefined) => `KSH ${kes.format(toMoney(n))}`;

export const deliveryPromo = () =>
  DELIVERY_FEE > 0 ? `Free delivery on orders over ${formatKES(FREE_DELIVERY_THRESHOLD)}` : "Free delivery";
