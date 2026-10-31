/** Public base URL of the site (no trailing slash). Server-side only: reads APP_URL. */
export function getAppUrl() {
  const url = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (url) return url;
  if (process.env.NODE_ENV === "production") throw new Error("Missing APP_URL");
  return "http://localhost:3000";
}
