"use client";

import { useState } from "react";
import styles from "./ProductTabs.module.css";

type Props = {
  description?: string;
  ingredients: string | null;
  tastingNotes: string[] | null;
};

type TabKey = "Description" | "Ingredients & Brewing" | "Customer Reviews";

export default function ProductTabs({
  description,
  ingredients,
  tastingNotes,
}: Props) {
  
  // Build only the tabs that have data (Customer Reviews always shown here)
  const availableTabs: TabKey[] = [];
  
  if (description) availableTabs.push("Description");
  
  if (ingredients || (tastingNotes?.length ?? 0) > 0) {
    availableTabs.push("Ingredients & Brewing");
  }
  
  availableTabs.push("Customer Reviews");

  const [active, setActive] = useState<TabKey>(() => availableTabs[0]);
  
  const safeActive = availableTabs.includes(active)
    ? active
    : availableTabs[0];

  // If literally nothing is available (unlikely since reviews is always pushed), render nothing
  if (availableTabs.length === 0) return null;

  return (
    <div className={styles.tabs}>
      <div className={styles.list} role="tablist" aria-label="Product details">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={safeActive  === tab}
            className={`${styles.tab} ${
              safeActive  === tab ? styles.tabActive : ""
            }`}
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.panel}>
        {safeActive === "Description" && description && (
          <div>
            <h3 className={styles.panelTitle}>A Taste of the Kenyan Sun</h3>
            <p className={styles.paragraph}>{description}</p>
          </div>
        )}

        {safeActive === "Ingredients & Brewing" && (
          <div>
            {(ingredients || (tastingNotes?.length ?? 0) > 0) && (
              <>
                <h3 className={styles.panelTitle}>Ingredients & Brewing</h3>

                {ingredients && (
                  <p className={styles.paragraph}>
                    <strong>Ingredients:</strong> {ingredients}
                  </p>
                )}

                {Array.isArray(tastingNotes) && tastingNotes.length > 0 && (
                  <div className={styles.notes}>
                    <strong>Tasting notes:</strong>
                    <ul>
                      {tastingNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {safeActive === "Customer Reviews" && (
          <div>
            <h3 className={styles.panelTitle}>
              Customer Reviews
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
