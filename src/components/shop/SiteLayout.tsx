"use client";

import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { SearchOverlay } from "./SearchOverlay";

export function SiteLayout({
  children,
  overlayHeader = false,
}: {
  children: ReactNode;
  overlayHeader?: boolean;
}) {
  return (
    <div className="min-h-dvh">
      <Header overlay={overlayHeader} />
      <main className={overlayHeader ? "" : "pt-16 md:pt-[72px]"}>{children}</main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
    </div>
  );
}
