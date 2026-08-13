import "./globals.css";
import { ShopProvider } from "@/store/shop";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  weight: ["400", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "NAWEA",
  description:
    "NAWEA diseña riñoneras, bolsos, carteras, mochilas y accesorios en Buenos Aires.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${bricolage.variable} ${dmSans.variable}`}>
      <head>
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

