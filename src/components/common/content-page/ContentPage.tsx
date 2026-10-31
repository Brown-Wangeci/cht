import Container from "../container/Container";
import styles from "./ContentPage.module.css";

type Props = {
  eyebrow?: string;
  title: string;
  intro?: React.ReactNode;
  updated?: string;
  children: React.ReactNode;
};

/** Shared layout for static content pages (about, contact, policies). */
export default function ContentPage({ eyebrow, title, intro, updated, children }: Props) {
  return (
    <div className={styles.page}>
      <Container>
        <header className={styles.header}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          <h1 className={styles.title}>{title}</h1>
          {intro && <p className={styles.intro}>{intro}</p>}
          {updated && <p className={styles.updated}>Last updated: {updated}</p>}
        </header>
        <div className={styles.prose}>{children}</div>
      </Container>
    </div>
  );
}
