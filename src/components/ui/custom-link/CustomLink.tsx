import Link from "next/link";
import styles from "./CustomLink.module.css";

type CustomLinkProps = {
  href: string;
  text: string;
  align?: "left" | "center" | "right";
};

export default function CustomLink({ href, text, align = "right" }: CustomLinkProps) {
  return (
    <div className={`${styles.wrapper} ${styles[align]}`}>
      <Link href={href} className={styles.link}>
        {text}
      </Link>
    </div>
  );
}
