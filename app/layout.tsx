import "./globals.css";
import { ShopProvider } from "@/store/shop";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "NAWEA",
  description:
    "NAWEA diseña riñoneras, bolsos, carteras, mochilas y accesorios en Buenos Aires.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap"
        />
        <link rel="icon" href="/nawea.png" type="image/x-icon" />
      </head>
      <body>
        <ShopProvider>
          {children}
          <Toaster />
        </ShopProvider>
      </body>
    </html>
  );
}
