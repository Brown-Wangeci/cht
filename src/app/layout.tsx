import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/header/Header";
import Footer from "@/components/layout/footer/Footer";
import CartDrawerGate from "@/components/cart/CartDrawerGate";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Logo Tea",
  description: "Premium tea e-commerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ minHeight: "100vh" }}  className={jakarta.className}>
        <Header />
        <main style={{ paddingTop: "calc(var( --header-height ) + 40px )" }} >{children}</main>
        <CartDrawerGate />
        <Footer />
      </body>
    </html>
  );
}
