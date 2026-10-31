/** Shared input validation for forms (used by server actions; safe to import on the client). */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Kenyan mobile/landline numbers in local (07…, 01…) or international (+254…, 254…) form. */
const KE_PHONE_RE = /^(?:\+?254|0)?[17]\d{8}$/;
/** Fallback for international numbers (E.164-ish). */
const INTL_PHONE_RE = /^\+[1-9]\d{7,14}$/;

export const normalizePhone = (phone: string) => phone.replace(/[^\d+]/g, "");

export const isValidPhone = (phone: string) => {
  const p = normalizePhone(phone);
  return KE_PHONE_RE.test(p) || INTL_PHONE_RE.test(p);
};

export const isValidEmail = (email: string) => email.length <= 254 && EMAIL_RE.test(email);
