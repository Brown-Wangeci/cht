"use client";

import { usePathname } from "next/navigation";
import CartDrawer from "@/components/cart/cart-drawer/CartDrawer";

export default function CartDrawerGate() {
  const pathname = usePathname();
  const inCheckout = pathname?.startsWith("/checkout");

  // Don’t even mount the drawer in checkout
  if (inCheckout) return null;

  return <CartDrawer />;
}
