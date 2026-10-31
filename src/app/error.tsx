"use client";

import { useEffect } from "react";
import Link from "next/link";
import ContentPage from "@/components/common/content-page/ContentPage";
import styles from "@/components/common/content-page/ContentPage.module.css";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ContentPage
      eyebrow="Error"
      title="Something went wrong"
      intro="We couldn’t load this page. Please try again in a moment."
    >
      <p style={{ display: "flex", gap: "var(--space-md)", alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={reset} className={styles.cta} style={{ border: "none", cursor: "pointer" }}>
          Try again
        </button>
        <Link href="/">Go to the homepage</Link>
      </p>
      {error.digest && <p style={{ fontSize: 12 }}>Reference: {error.digest}</p>}
    </ContentPage>
  );
}
