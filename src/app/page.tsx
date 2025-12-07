import Image from "next/image";
import styles from "./page.module.css";
import ProductGrid from "@/components/products/product-grid/ProductGrid";
import { getAllProducts, getFeaturedProducts } from "@/lib/products";
import Hero from "@/components/landing-page/hero/Hero";
import Container from "@/components/common/container/Container";
import Section from "@/components/ui/section/Section";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import CustomLink from "@/components/ui/custom-link/CustomLink";
import FeaturedProductsSection from "@/components/products/featured-products/FeaturedProductsSection";

export default async function Home() {

  const featuredProducts = await getAllProducts();

  return (
    <div className={styles.page}>
      {/* <ProductGrid products={products} /> */}
      <Hero />

      <Container>
        {/* Featured Products */}
        <FeaturedProductsSection />
      </Container>
    </div>
  );
}
