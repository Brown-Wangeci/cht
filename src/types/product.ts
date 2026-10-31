import type { InferSelectModel } from "drizzle-orm";
import type { products, productVariants } from "@/db/schema";

export type Product = InferSelectModel<typeof products>;

export type ProductVariant = Omit<InferSelectModel<typeof productVariants>, "price"> & {
  price: number; // force numeric for UI
};

export type ProductWithVariants = Product & { variants: ProductVariant[] };

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name, A–Z" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const AVAILABILITY_OPTIONS = [
  { value: "in-stock", label: "In stock" },
  { value: "out-of-stock", label: "Out of stock" },
] as const;

export type AvailabilityOption = (typeof AVAILABILITY_OPTIONS)[number]["value"];
