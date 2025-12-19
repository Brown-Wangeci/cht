import Link from "next/link";
import styles from "./CustomLink.module.css";

type CustomLinkProps = {
  href: string;
  text: string;
  align?: "left" | "center" | "right";
  size?: "small" | "medium" | "large";
  onClick?: () => void;
};

export default function CustomLink({ href, text, align = "right", size = "large", onClick }: CustomLinkProps) {
  return (
    <div className={`${styles.wrapper} ${styles[align]}`}>
      <Link href={href} className={`${styles.link} ${styles[size]}`} onClick={onClick}>
        {text}
      </Link>
    </div>
  );
}
