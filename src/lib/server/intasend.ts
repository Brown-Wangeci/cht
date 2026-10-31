import "server-only";

/**
 * Minimal IntaSend collection client (checkout + payment status).
 *
 * Mirrors what the official intasend-node SDK sends — same hosts, publishable key in both the
 * header and the body — without the SDK's AGPL licence or its untyped Buffer rejections.
 * Docs: https://developers.intasend.com/guides/collections/checkout/
 */

export class IntaSendError extends Error {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`IntaSend request failed (${status}): ${body}`);
    this.name = "IntaSendError";
  }
}

function getConfig() {
  const publishableKey = process.env.INTASEND_PUBLISHABLE_KEY?.trim();
  if (!publishableKey) throw new Error("Missing INTASEND_PUBLISHABLE_KEY");

  const isTest = String(process.env.INTASEND_TEST_ENVIRONMENT ?? "true") === "true";
  const baseUrl =
    process.env.INTASEND_API_BASE_URL?.trim().replace(/\/+$/, "") ||
    (isTest ? "https://sandbox.intasend.com" : "https://payment.intasend.com");

  return { publishableKey, baseUrl };
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { publishableKey, baseUrl } = getConfig();

  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      INTASEND_PUBLIC_API_KEY: publishableKey,
      "X-IntaSend-Public-API-Key": publishableKey,
    },
    body: JSON.stringify({ ...body, public_key: publishableKey }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const text = await res.text();
  if (!res.ok) throw new IntaSendError(res.status, text.slice(0, 1000));

  try {
    return (text ? JSON.parse(text) : {}) as T;
  } catch {
    throw new IntaSendError(res.status, `Invalid JSON: ${text.slice(0, 200)}`);
  }
}

export type CheckoutRequest = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  amount: number;
  currency: string;
  api_ref: string;
  redirect_url: string;
  host?: string;
};

export type CheckoutResponse = {
  id?: string;
  url?: string;
  signature?: string;
};

export function createCheckout(payload: CheckoutRequest) {
  return post<CheckoutResponse>("/api/v1/checkout/", payload);
}

export type InvoiceState =
  | "PENDING"
  | "PROCESSING"
  | "RETRY"
  | "PARTIAL"
  | "COMPLETE"
  | "FAILED"
  | "CANCELED";

export type InvoiceStatus = {
  invoice?: {
    invoice_id?: string;
    state?: InvoiceState | string;
    provider?: string;
    value?: number | string;
    net_amount?: number | string;
    currency?: string;
    api_ref?: string | null;
    failed_reason?: string | null;
  };
};

/** Authoritative status lookup — never trust the webhook body alone. */
export function getInvoiceStatus(invoiceId: string) {
  return post<InvoiceStatus>("/api/v1/payment/status/", { invoice_id: invoiceId });
}

/** Normalises to the 2547XXXXXXXX / 2541XXXXXXXX form IntaSend (M-Pesa) expects. */
export function toIntaSendPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;
  return digits;
}
