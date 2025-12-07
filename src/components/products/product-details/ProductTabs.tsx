// components/products/product-details/ProductTabs.tsx
"use client";

import { useState } from "react";
import styles from "./ProductTabs.module.css";

type Props = {
  description: string;
  ingredients: string;
  tastingNotes: string[];
  reviewCount: number;
};

const TABS = ["Description", "Ingredients & Brewing", "Customer Reviews"] as const;
type TabKey = (typeof TABS)[number];

export default function ProductTabs({
  description,
  ingredients,
  tastingNotes,
  reviewCount,
}: Props) {
  const [active, setActive] = useState<TabKey>("Description");

  return (
    <div className={styles.tabs}>
      <div className={styles.list} role="tablist" aria-label="Product details">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active === tab}
            className={`${styles.tab} ${
              active === tab ? styles.tabActive : ""
            }`}
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.panel}>
        {active === "Description" && (
          <div>
            <h3 className={styles.panelTitle}>A Taste of the Kenyan Sun</h3>
            <p className={styles.paragraph}>{description}</p>
          </div>
        )}

        {active === "Ingredients & Brewing" && (
          <div>
            <h3 className={styles.panelTitle}>Ingredients & Brewing</h3>
            <p className={styles.paragraph}>
              <strong>Ingredients:</strong> {ingredients}
            </p>
            {tastingNotes.length > 0 && (
              <div className={styles.notes}>
                <strong>Tasting notes:</strong>
                <ul>
                  {tastingNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {active === "Customer Reviews" && (
          <div>
            <h3 className={styles.panelTitle}>
              Customer Reviews ({reviewCount})
            </h3>
            <p className={styles.paragraph}>
              Reviews will appear here. For now, enjoy your tea knowing others
              love it too.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
