"use client";

import { useState } from "react";
import type { ProductWithVariants } from "@/types/product";
import ProductImage from "@/components/ui/product-image/ProductImage";
import styles from "./ProductGallery.module.css";

type Props = {
  product: ProductWithVariants;
};

export default function ProductGallery({ product }: Props) {
  const images = product.images?.filter(Boolean) ?? [];
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className={styles.gallery}>
      {/* Main Image */}
      <div className={styles.mainImageWrapper}>
        <ProductImage
          src={images[activeIndex]}
          alt={product.name}
          fill
          className={styles.mainImage}
          sizes="(max-width: 900px) 100vw, 560px"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className={styles.thumbsRow}>
          {images.map((img, idx) => (
            <button
              key={img + idx}
              type="button"
              className={`${styles.thumbWrapper} ${
                idx === activeIndex ? styles.thumbActive : ""
              }`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Show image ${idx + 1} of ${images.length}`}
              aria-current={idx === activeIndex}
            >
              <ProductImage
                src={img}
                alt=""
                fill
                className={styles.thumbImage}
                sizes="120px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
