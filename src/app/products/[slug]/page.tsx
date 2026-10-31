import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import Container from "@/components/common/container/Container";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import ProductGallery from "@/components/products/product-details/ProductGallery";
import Breadcrumbs from "@/components/common/breadcrumbs/Breadcrumbs";
import styles from "./ProductDetailsPage.module.css";
import ProductSummary from "@/components/products/product-details/ProductSummary";
import ProductTabs from "@/components/products/product-details/ProductTabs";
import RelatedProductsSection from "@/components/products/product-details/RelatedProductsSection";
import { getCompany } from "@/lib/company";
import { getAppUrl } from "@/lib/site";

// Stock levels change with every order; keep pages at most a minute stale (the webhook also revalidates).
export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

const loadProduct = cache((slug: string) => getProductBySlug(slug));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: "Product not found" };

  const description = product.description.slice(0, 160);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      images: product.images?.[0] ? [{ url: product.images[0] }] : undefined,
    },
  };
}

export default async function ProductDetailsPage({ params }: PageProps) {
  const { slug } = await params;

  const product = await loadProduct(slug);

  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(product.slug);

  const appUrl = getAppUrl();
  const brand = getCompany().brand.primaryBrand;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    category: product.category,
    brand: { "@type": "Brand", name: brand },
    image: product.images?.map((src) => `${appUrl}${src}`),
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku ?? v.id,
      price: v.price.toFixed(2),
      priceCurrency: "KES",
      availability:
        (v.stockOnHand ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${appUrl}/products/${product.slug}`,
    })),
  };

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Container>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/products" },
            {
              label: product.category,
              href: `/products?category=${encodeURIComponent(product.category)}`,
            },
            { label: product.name },
          ]}
        />

        <section className={styles.topSection}>
          <ProductGallery key={`gallery-${product.id}`} product={product} />
          <ProductSummary key={product.id} product={product} />
        </section>

        <section className={styles.tabsSection}>
          <ProductTabs
            name={product.name}
            description={product.description}
            ingredients={product.ingredients}
            tastingNotes={product.tastingNotes}
          />
        </section>

        {relatedProducts.length > 0 && (
          <RelatedProductsSection products={relatedProducts} />
        )}
      </Container>
    </div>
  );
}
