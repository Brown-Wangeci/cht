import productsData from "@/data/products.json";

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  soldOut: boolean;
  description: string;
  category: string;
  isNew: boolean;
  isBestSeller: boolean;
  origin: string;
  harvestDate: string;
  tastingNotes: string[];
  ingredients: string;
};

export async function getAllProducts(): Promise<Product[]> {
  return productsData;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return productsData.find((product) => product.slug === slug);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return productsData.find((product) => product.id === id);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return productsData.filter((product) => product.isBestSeller).slice(0, 3);
}

export async function getRelatedProducts(currentSlug: string): Promise<Product[]> {
  return productsData.filter((product) => product.slug !== currentSlug).slice(0, 3);
}
