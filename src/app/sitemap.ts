import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/products";
import { getAppUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = getAppUrl();
  const products = await getAllProducts();

  const staticPages = ["", "/products", "/about", "/contact", "/delivery-returns", "/terms", "/privacy"].map(
    (path) => ({
      url: `${appUrl}${path}`,
      changeFrequency: path === "" || path === "/products" ? ("daily" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/products" ? 0.9 : 0.4,
    })
  );

  const productPages = products.map((p) => ({
    url: `${appUrl}/products/${p.slug}`,
    lastModified: p.createdAt ?? undefined,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
