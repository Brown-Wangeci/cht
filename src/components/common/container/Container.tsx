import styles from './Container.module.css';
import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  style?: React.CSSProperties;
}

export default function Container({ children, style }: ContainerProps) {
  return <div className={styles.container} style={style}>{children}</div>;
}
