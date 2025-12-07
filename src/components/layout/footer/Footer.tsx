import styles from './Footer.module.css';
import Container from '@/components/common/container/Container';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.content}>
          <div className={styles.column}>
            <h3 className={styles.brand}>Logo</h3>
            <p className={styles.description}>
              Premium tea sourced directly from the finest gardens. Crafted for moments of tranquility.
            </p>
          </div>
          
          <div className={styles.column}>
            <h4 className={styles.heading}>Quick Links</h4>
            <div className={styles.links}>
              <Link href="/" className={styles.link}>Home</Link>
              <Link href="/products" className={styles.link}>Shop</Link>
              <Link href="/about" className={styles.link}>Our Story</Link>
              <Link href="/contact" className={styles.link}>Contact</Link>
            </div>
          </div>
          
          <div className={styles.column}>
            <h4 className={styles.heading}>Newsletter</h4>
            <p className={styles.description}>Stay updated with our latest offerings.</p>
            <div className={styles.newsletter}>
              <input 
                type="email" 
                placeholder="Your email" 
                className={styles.input}
              />
              <button className={styles.button} disabled>Subscribe</button>
            </div>
          </div>
        </div>
        
        <div className={styles.bottom}>
          <p>&copy; {currentYear} Logo. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
