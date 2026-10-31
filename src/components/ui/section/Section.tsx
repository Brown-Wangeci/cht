import styles from './Section.module.css';

type SectionProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  align?: 'left' | 'center';
  paddingBlock?: string;
  marginBottom?: boolean;
  headingLevel?: 1 | 2;
};

export default function Section({
  eyebrow,
  title,
  subtitle,
  children,
  align = 'left',
  paddingBlock = 'var(--space-4xl)',
  marginBottom = true,
  headingLevel = 2,
}: SectionProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const headerClass = [marginBottom ? styles.header : '', styles[align]].filter(Boolean).join(' ');

  return (
    <section className={styles.section} style={{ paddingBlock }}>
      {(eyebrow || title || subtitle) && (
        <div className={headerClass}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          {title && <Heading className={styles.title}>{title}</Heading>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
