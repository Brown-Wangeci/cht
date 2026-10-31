import "server-only";

const map: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes customer-supplied text before it is placed in an HTML email. */
export const escapeHtml = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => map[c]);
