import styles from './Section.module.css';

type SectionProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  align?: 'left' | 'center';
  paddingBlock?: string;
  marginBottom?: boolean;
};

export default function Section({
  eyebrow,
  title,
  subtitle,
  children,
  align = 'left',
  paddingBlock = 'var(--space-4xl)',
  marginBottom = true,
}: SectionProps) {
  return (
    <section className={styles.section} style={{ paddingBlock }}>
      {(eyebrow || title || subtitle) && (
        <div className={( marginBottom ? ` ${styles.header}` : '' + `${styles[align]}`)}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          {title && <h2 className={styles.title}>{title}</h2>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
