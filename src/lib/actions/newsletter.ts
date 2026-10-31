"use server";

import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { isValidEmail } from "@/lib/validation";

export type NewsletterState = { ok: boolean; message: string; email?: string } | null;

export async function subscribeNewsletter(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  // Honeypot: real visitors never fill this hidden field.
  if (String(formData.get("website") ?? "")) return { ok: true, message: "Thanks for subscribing!" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) return { ok: false, message: "Please enter a valid email address.", email };

  try {
    await db.insert(newsletterSubscribers).values({ email }).onConflictDoNothing();
    return { ok: true, message: "Thanks for subscribing!" };
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return { ok: false, message: "Something went wrong. Please try again.", email };
  }
}
