"use client";

import Image from "next/image";
import { useState } from "react";
import { Product } from "@/lib/products";
import styles from "./ProductGallery.module.css";

type Props = {
  product: Product;
};

export default function ProductGallery({ product }: Props) {
  // Allow for expansion: product.images ?? fallback to single image
  const images = product.images;
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className={styles.gallery}>
      {/* Main Image */}
      <div className={styles.mainImageWrapper}>
        <Image
          src={images[activeIndex]}
          alt={product.name}
          fill
          className={styles.mainImage}
          sizes="(max-width: 900px) 100vw, 560px"
          priority
        />
      </div>

      {/* Thumbnails */}
      <div className={styles.thumbsRow}>
        {images.map((img, idx) => (
          <button
            key={img + idx}
            type="button"
            className={`${styles.thumbWrapper} ${
              idx === activeIndex ? styles.thumbActive : ""
            }`}
            onClick={() => setActiveIndex(idx)}
          >
            <Image
              src={img}
              alt={product.name}
              fill
              className={styles.thumbImage}
              sizes="120px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
