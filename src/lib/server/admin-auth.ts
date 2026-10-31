import "server-only";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Single-password admin auth.
 * Env: ADMIN_PASSWORD (required to enable /admin), ADMIN_SESSION_SECRET (recommended; signs the session cookie).
 * Without a dedicated secret the signing key is derived from the password, so changing it logs everyone out.
 */

export const ADMIN_COOKIE = "admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const getPassword = () => process.env.ADMIN_PASSWORD?.trim() || null;

const getSigningKey = () => {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  const password = getPassword();
  if (!secret && !password) return null;
  return createHash("sha256").update(`admin-session:${secret || password}`).digest();
};

const sign = (payload: string, key: Buffer) => createHmac("sha256", key).update(payload).digest("base64url");

/** Constant-time comparison for arbitrary-length strings (hash first so lengths match). */
export const safeCompare = (a: string, b: string) => {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
};

export const isAdminConfigured = () => Boolean(getPassword());

export const verifyAdminPassword = (candidate: string) => {
  const password = getPassword();
  return Boolean(password) && safeCompare(candidate, password!);
};

export function createAdminSessionValue() {
  const key = getSigningKey();
  if (!key) throw new Error("ADMIN_PASSWORD is not configured");
  const expires = String(Date.now() + SESSION_TTL_MS);
  return `${expires}.${sign(expires, key)}`;
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/admin",
  maxAge: SESSION_TTL_MS / 1000,
};

export async function isAdmin() {
  const key = getSigningKey();
  if (!key || !getPassword()) return false;

  const value = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  const [expires, signature] = value.split(".");
  if (!expires || !signature) return false;
  if (!safeCompare(signature, sign(expires, key))) return false;

  return Number(expires) > Date.now();
}

/** Guard for admin pages and actions. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
