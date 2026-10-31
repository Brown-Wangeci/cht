"use client";

import { useState } from "react";
import styles from "./ProductTabs.module.css";

type Props = {
  name: string;
  description?: string;
  ingredients: string | null;
  tastingNotes: string[] | null;
};

type TabKey = "Description" | "Ingredients & Tasting Notes";

const tabId = (tab: TabKey) => `tab-${tab.toLowerCase().replace(/[^a-z]+/g, "-")}`;

export default function ProductTabs({
  name,
  description,
  ingredients,
  tastingNotes,
}: Props) {

  // Build only the tabs that have data
  const availableTabs: TabKey[] = [];

  if (description) availableTabs.push("Description");

  if (ingredients || (tastingNotes?.length ?? 0) > 0) {
    availableTabs.push("Ingredients & Tasting Notes");
  }

  const [active, setActive] = useState<TabKey | undefined>(() => availableTabs[0]);

  const safeActive = active && availableTabs.includes(active)
    ? active
    : availableTabs[0];

  if (!safeActive) return null;

  return (
    <div className={styles.tabs}>
      <div className={styles.list} role="tablist" aria-label="Product details">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={tabId(tab)}
            aria-selected={safeActive  === tab}
            aria-controls="product-tab-panel"
            className={`${styles.tab} ${
              safeActive  === tab ? styles.tabActive : ""
            }`}
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.panel} role="tabpanel" id="product-tab-panel" aria-labelledby={tabId(safeActive)}>
        {safeActive === "Description" && description && (
          <div>
            <h2 className={styles.panelTitle}>About {name}</h2>
            <p className={styles.paragraph}>{description}</p>
          </div>
        )}

        {safeActive === "Ingredients & Tasting Notes" && (
          <div>
            <h2 className={styles.panelTitle}>Ingredients & Tasting Notes</h2>

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
          </div>
        )}
      </div>
    </div>
  );
}
