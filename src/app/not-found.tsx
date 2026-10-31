import Link from "next/link";
import ContentPage from "@/components/common/content-page/ContentPage";
import styles from "@/components/common/content-page/ContentPage.module.css";

export default function NotFound() {
  return (
    <ContentPage eyebrow="404" title="Page not found" intro="The page you’re looking for doesn’t exist or has moved.">
      <p>
        <Link href="/products" className={styles.cta}>
          Browse our teas
        </Link>
      </p>
    </ContentPage>
  );
}
