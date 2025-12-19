import styles from "./Loader.module.css";

type Props = {
    label: string;
};

const Loader = ({ label }: Props) => {
  return (
      <div className={styles["dot-spinner"]} aria-label={label} role="status">
        <div className={styles["dot-spinner__dot"]} />
        <div className={styles["dot-spinner__dot"]} />
        <div className={styles["dot-spinner__dot"]} />
        <div className={styles["dot-spinner__dot"]} />
        <div className={styles["dot-spinner__dot"]} />
        <div className={styles["dot-spinner__dot"]} />
        <div className={styles["dot-spinner__dot"]} />
        <div className={styles["dot-spinner__dot"]} />
      </div>
  );
}
export default Loader;