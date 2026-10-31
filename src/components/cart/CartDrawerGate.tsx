"use client";

import { usePathname } from "next/navigation";
import CartDrawer from "@/components/cart/cart-drawer/CartDrawer";

export default function CartDrawerGate() {
  const pathname = usePathname();
  const hidden = pathname?.startsWith("/checkout") || pathname?.startsWith("/admin");

  // Don’t even mount the drawer in checkout (cart is locked) or the admin area
  if (hidden) return null;

  return <CartDrawer />;
}
