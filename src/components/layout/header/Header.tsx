"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./Header.module.css";
import Container from "@/components/common/container/Container";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart";
import useLockBodyScroll from "@/lib/hooks/useLockBodyScroll";
import { getCompany } from "@/lib/company";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  // No cart UI in checkout (cart is locked) or the admin area.
  const inCheckout = pathname.startsWith("/checkout") || pathname.startsWith("/admin");

  const toggleCart = useCartStore((s) => s.toggleCart);
  const isCartOpen = useCartStore((s) => s.isOpen);
  const cartCount = useCartStore((s) => s.count) ?? 0;

  // ✅ lock scroll ONLY when mobile menu is open
  // (cart drawer handles its own lock)
  useLockBodyScroll(mobileMenuOpen && !isCartOpen);

  const company = getCompany();
  const brandName = company.brand.primaryBrand;
  const legalName = company.company.legalName;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "Our Story" },
    { href: "/contact", label: "Contact" },
    { href: "/products", label: "Shop" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const openCart = useCallback(() => {
    toggleCart();
  }, [toggleCart]);

  return (
    <div className={styles.headerWrapper}>
      <div className={styles.smallBanner}>
        <p>{legalName}</p>
      </div>

      <header className={styles.header}>
        <Container>
          <nav className={styles.nav}>
            <Link href="/" className={styles.logo} aria-label={brandName}>
              {brandName}
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

              {/* Desktop cart */}
              {!inCheckout && (
                <button
                  type="button"
                  className={styles.cart}
                  onClick={openCart}
                  aria-label={cartCount > 0 ? `Open cart (${cartCount} items)` : "Open cart"}
                >
                  <div className={styles.cartIconWrap}>
                    <ShoppingCart size={20} aria-hidden />
                    {cartCount > 0 && <CartBadge count={cartCount} />}
                  </div>
                </button>
              )}
            </div>

            {/* Mobile actions (cart + menu) */}
            <div className={styles.mobileActions}>
              {!inCheckout && (
                <button
                  type="button"
                  className={styles.mobileCart}
                  onClick={openCart}
                  aria-label={cartCount > 0 ? `Open cart (${cartCount} items)` : "Open cart"}
                >
                  <div className={styles.cartIconWrap}>
                    <ShoppingCart size={24} aria-hidden />
                    {cartCount > 0 && <CartBadge count={cartCount} />}
                  </div>
                </button>
              )}

              <button
                className={styles.mobileToggle}
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
                type="button"
              >
                ☰
              </button>
            </div>
          </nav>
        </Container>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className={styles.mobileMenuOverlay} role="dialog" aria-modal="true" aria-label="Menu">
            <div className={styles.mobileMenuHeader}>
              <Link
                href="/"
                className={styles.logo}
                onClick={() => setMobileMenuOpen(false)}
                aria-label={brandName}
              >
                {brandName}
              </Link>

              <button
                className={styles.closeButton}
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                type="button"
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
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

function CartBadge({ count }: { count: number }) {
  return (
    <span className={styles.cartBadge} aria-hidden>
      {count}
    </span>
  );
}
