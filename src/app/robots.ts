import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/checkout/", "/admin", "/api/", "/order/"] }],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
