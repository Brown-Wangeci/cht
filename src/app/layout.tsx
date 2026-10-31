import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/header/Header";
import Footer from "@/components/layout/footer/Footer";
import CartDrawerGate from "@/components/cart/CartDrawerGate";
import CartHydrator from "@/components/cart/CartHydrator";
import { getCompany } from "@/lib/company";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

const company = getCompany();
const brand = company.brand.primaryBrand;
const tagline = company.brand.taglines[0];
const description = `${company.brand.taglines[1]}. Premium teas and herbal infusions from Kenya's Central Highlands, delivered to your door.`;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: {
    default: `${brand} — ${tagline}`,
    template: `%s | ${brand}`,
  },
  description,
  applicationName: brand,
  openGraph: {
    type: "website",
    siteName: brand,
    title: `${brand} — ${tagline}`,
    description,
    locale: "en_KE",
    images: [{ url: "/images/hero-home-1.png", alt: `${brand} tea plantation` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand} — ${tagline}`,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#1A3501",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ minHeight: "100vh" }} className={`${jakarta.className} ${jakarta.variable}`}>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <CartHydrator />
        <Header />
        <main id="main-content" style={{ paddingTop: "calc(var( --header-height ) + 40px )" }} >{children}</main>
        <CartDrawerGate />
        <Footer />
      </body>
    </html>
  );
}
