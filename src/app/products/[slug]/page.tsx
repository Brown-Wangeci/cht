// app/products/[slug]/page.tsx
import { notFound } from "next/navigation";
import Container from "@/components/common/container/Container";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import ProductGallery from "@/components/products/product-details/ProductGallery";
import Breadcrumbs from "@/components/common/breadcrumbs/Breadcrumbs";
import styles from "./ProductDetailsPage.module.css";
import ProductSummary from "@/components/products/product-details/ProductSummary";
import ProductTabs from "@/components/products/product-details/ProductTabs";
import RelatedProductsSection from "@/components/products/product-details/RelatedProductsSection";

type PageProps = {
  params: { slug: string };
};

export default async function ProductDetailsPage({ params }: PageProps) {
  const product = await getProductBySlug("imperial-dragon-well");
  console.log(product);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.slug);

  return (
    <main className={styles.page}>
      <Container>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/products" },
            { label: product.category, href: `/products?category=${encodeURIComponent(product.category)}` },
            { label: product.name },
          ]}
        />

        <section className={styles.topSection}>
          <ProductGallery product={product} />
          <ProductSummary product={product} />
        </section>

        <section className={styles.tabsSection}>
          <ProductTabs
            description={product.description}
            ingredients={product.ingredients}
            tastingNotes={product.tastingNotes}
            reviewCount={product.reviewCount}
          />
        </section>

        {relatedProducts.length > 0 && (
          <RelatedProductsSection products={relatedProducts} />
        )}
      </Container>
    </main>
  );
}
