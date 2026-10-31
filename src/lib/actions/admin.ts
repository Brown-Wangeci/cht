"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, products, productVariants } from "@/db/schema";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminSessionValue,
  isAdminConfigured,
  requireAdmin,
  verifyAdminPassword,
} from "@/lib/server/admin-auth";
import { asUuid } from "@/lib/server/cookies";
import { ORDER_STATUSES, type OrderStatus } from "@/types/order";

export type AdminLoginState = { error: string } | null;

export async function loginAdmin(_prev: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  if (!isAdminConfigured()) return { error: "Admin access is not configured (set ADMIN_PASSWORD)." };

  const password = String(formData.get("password") ?? "");
  if (!verifyAdminPassword(password)) {
    // Slow down brute-force attempts.
    await new Promise((r) => setTimeout(r, 800));
    return { error: "Incorrect password." };
  }

  (await cookies()).set(ADMIN_COOKIE, createAdminSessionValue(), adminCookieOptions);
  redirect("/admin");
}

export async function logoutAdmin() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin/login");
}

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();

  const orderId = asUuid(String(formData.get("orderId") ?? ""));
  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!orderId || !ORDER_STATUSES.includes(status)) return;

  await db
    .update(orders)
    .set({
      status,
      fulfilledAt: status === "fulfilled" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function updateVariantStock(formData: FormData) {
  await requireAdmin();

  const variantId = String(formData.get("variantId") ?? "");
  const stock = Math.trunc(Number(formData.get("stock")));
  if (!variantId || !Number.isFinite(stock) || stock < 0 || stock > 100000) return;

  await db.update(productVariants).set({ stockOnHand: stock }).where(eq(productVariants.id, variantId));

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/products", "layout");
}

export async function setProductActive(formData: FormData) {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  const active = formData.get("active") === "true";
  if (!productId) return;

  await db.update(products).set({ active }).where(eq(products.id, productId));

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/products", "layout");
}
