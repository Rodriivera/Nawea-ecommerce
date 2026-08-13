import { SiteLayout } from "@/components/shop/SiteLayout";
import { CatalogView } from "@/components/shop/CatalogView";
import { ScrollReveal } from "@/components/shop/ScrollReveal";
import { fetchProductsFromDb } from "@/lib/catalog-db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo — NAWEA",
  description:
    "Toda la colección NAWEA: riñoneras, bolsos, carteras, mochilas y accesorios con filtros por precio, color y tamaño.",
};

export default async function ShopPage() {
  const products = await fetchProductsFromDb();

  return (
    <SiteLayout>
      <section className="edge pb-4 pt-14 md:pt-20">
        <ScrollReveal variant="slide-left" delay={100} duration={850}>
          <p className="label-xs text-accent">Colección completa</p>
        </ScrollReveal>
        <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <ScrollReveal variant="fade-up" delay={250} duration={1000}>
            <h1 className="display-xl">Catálogo</h1>
          </ScrollReveal>
          <ScrollReveal variant="slide-right" delay={400} duration={900}>
            <p className="max-w-sm pb-3 text-sm text-muted-foreground">
              {products.length} productos disponibles en stock.
            </p>
          </ScrollReveal>
        </div>
      </section>
      <section className="edge pb-24">
        <CatalogView items={products} />
      </section>
    </SiteLayout>
  );
}
