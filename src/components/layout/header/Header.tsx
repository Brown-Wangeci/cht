'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Header.module.css';
import Container from '@/components/common/container/Container';
import { ShoppingCart } from "lucide-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'Our Story' },
    { href: '/contact', label: 'Contact' },
    { href: '/products', label: 'Shop' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Prevent scrolling on the body when the menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <div className={styles.headerWrapper}>
      <div className={styles.smallBanner}>
        <p className={styles.annoucement} >Free shipping on orders over Ksh. 6000!</p>
      </div>
      <header className={styles.header}>
        <Container>
          <nav className={styles.nav}>
            {/* Main Logo (Visible on Desktop & Mobile Header Bar) */}
            <Link href="/" className={styles.logo}>
              Logo
            </Link>

            {/* Desktop Navigation */}
            <div className={styles.links}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.link} ${isActive(link.href) ? styles.active : ''}`}
                >
                  { link.label}
                </Link>
              ))}
              <Link href="/cart" className={styles.cart}>
                <ShoppingCart size={20} />
              </Link>
            </div>


            {/* Mobile Menu Toggle (Hamburger) */}
            <button
              className={styles.mobileToggle}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
          </nav>
        </Container>

        {/* Full Screen Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className={styles.mobileMenuOverlay}>
            {/* <Container> */}
              {/* Mobile Menu Header (Logo + Close Button) */}
              <div className={styles.mobileMenuHeader}>
                <Link 
                  href="/" 
                  className={styles.logo} 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Logo
                </Link>
                <button
                  className={styles.closeButton}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              {/* Mobile Links List */}
              <div className={styles.mobileLinksContainer}>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${styles.mobileLink} ${isActive(link.href) ? styles.active : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    { link.label }
                  </Link>
                ))}
                <Link href="/cart" className={styles.mobileCart}>
                  <ShoppingCart size={28} />
                </Link>
              </div>
            {/* </Container> */}
          </div>
        )}
      </header>
    </div>
  );
}