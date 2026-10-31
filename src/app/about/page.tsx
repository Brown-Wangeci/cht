import type { Metadata } from "next";
import Link from "next/link";
import ContentPage from "@/components/common/content-page/ContentPage";
import styles from "@/components/common/content-page/ContentPage.module.css";
import { getCompany } from "@/lib/company";

const company = getCompany();

export const metadata: Metadata = {
  title: "Our Story",
  description: company.company.summary,
};

export default function AboutPage() {
  const { brand, company: info } = company;

  return (
    <ContentPage eyebrow="Our Story" title={brand.taglines[0]} intro={info.summary}>
      <h2>Grown in the Central Highlands</h2>
      <p>{info.about.positioning}</p>
      <p>
        At over {brand.story.elevationMeters.toLocaleString("en-KE")} metres (
        {brand.story.elevationFeet.toLocaleString("en-KE")} feet), the cool climate and rich soils of the{" "}
        {brand.story.region} give our leaves their character.
      </p>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>The name</h3>
          <p>{info.about.nameMeaning}</p>
        </div>
        <div className={styles.card}>
          <h3>Who we are</h3>
          <p>
            {info.legalName} — {info.ownershipModel.toLowerCase()}.
          </p>
        </div>
        <div className={styles.card}>
          <h3>Our brand</h3>
          <p>{brand.taglines[1]}.</p>
        </div>
      </div>

      <p>
        <Link href="/products" className={styles.cta}>
          Explore our teas
        </Link>
      </p>
    </ContentPage>
  );
}
