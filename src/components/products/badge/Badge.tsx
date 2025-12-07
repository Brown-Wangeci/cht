import styles from "./Badge.module.css";

export type BadgeVariant = "shop" | "soldOut" | "new" | "default";

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

export default function Badge({ label, variant = "default" }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {label}
    </span>
  );
}
