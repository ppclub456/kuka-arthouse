import type { Metadata } from "next";
import { CartDrawer } from "@/components/cart-drawer";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kuka Arthouse | Homepage",
    template: "%s | Kuka Arthouse",
  },
  description:
    "Physical fine-art reproductions shipped to Australia & beyond — wall art inspired by Japanese, famous masters, new artists, vintage, floral & abstract. Standard size 70 × 100 cm. Guest checkout; optional login.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-transparent text-foreground antialiased selection:bg-cyan-500/30 selection:text-white">
        <Providers>
          <SiteHeader />
          <CartDrawer />
          <div className="flex flex-1 flex-col">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
