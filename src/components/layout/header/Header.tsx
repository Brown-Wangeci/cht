"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./Header.module.css";
import Container from "@/components/common/container/Container";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart";
import useLockBodyScroll from "@/lib/hooks/useLockBodyScroll";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleCart = useCartStore((s) => s.toggleCart);
  const isCartOpen = useCartStore((s) => s.isOpen);
  const cartCount = useCartStore((s) => s.count) ?? 0;

  // ✅ lock scroll ONLY when mobile menu is open
  // (cart drawer handles its own lock)
  useLockBodyScroll(mobileMenuOpen && !isCartOpen);

  const navLinks = [
    { href: "/", label: "Home" },
    // { href: "/about", label: "Our Story" },
    // { href: "/contact", label: "Contact" },
    { href: "/products", label: "Shop" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };


  const openCartFromHeader = useCallback(() => {
    toggleCart();
  }, [toggleCart]);

  const openCartFromMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    toggleCart();
  }, [toggleCart]);

  return (
    <div className={styles.headerWrapper}>
      <div className={styles.smallBanner}>
        <p className={styles.annoucement}>Free shipping on orders over Ksh. 6000!</p>
      </div>

      <header className={styles.header}>
        <Container>
          <nav className={styles.nav}>
            <Link href="/" className={styles.logo}>
              Logo
            </Link>

            {/* Desktop Navigation */}
            <div className={styles.links}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.link} ${isActive(link.href) ? styles.active : ""}`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Cart button (drawer) */}
              <button
                type="button"
                className={styles.cart}
                onClick={openCartFromHeader}
                aria-label="Open cart"
              >
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <ShoppingCart size={20} />
                  {cartCount > 0 && <CartBadge count={cartCount} />}
                </div>
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className={styles.mobileToggle}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
          </nav>
        </Container>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className={styles.mobileMenuOverlay}>
            <div className={styles.mobileMenuHeader}>
              <Link href="/" className={styles.logo} onClick={() => setMobileMenuOpen(false)}>
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

            <div className={styles.mobileLinksContainer}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.mobileLink} ${isActive(link.href) ? styles.active : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile cart button (drawer) */}
              <button
                type="button"
                className={styles.mobileCart}
                onClick={openCartFromMobileMenu}
                aria-label="Open cart"
              >
                <div style={{ position: "relative" }}>
                  <ShoppingCart size={28} />
                  {cartCount > 0 && <CartBadge count={cartCount} />}
                </div>
              </button>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

function CartBadge({ count }: { count: number }) {
  return (
    <span
      style={{
        position: "absolute",
        top: "-8px",
        right: "-8px",
        backgroundColor: "var(--color-accent)",
        color: "white",
        fontSize: "0.7rem",
        fontWeight: "bold",
        height: "16px",
        width: "16px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {count}
    </span>
  );
}
