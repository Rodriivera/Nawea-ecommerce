"use client";

import Link from "next/link";
import { Heart, Minus, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import { SiteLayout } from "@/components/shop/SiteLayout";
import { ProductCard } from "@/components/shop/ProductCard";
import { ScrollReveal } from "@/components/shop/ScrollReveal";
import { money } from "@/lib/format";
import { useShop } from "@/store/shop";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Product } from "@/data/catalog";

export function ProductDetailView({
  product,
  relatedProducts,
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  const { addToCart, toggleFavorite, isFavorite } = useShop();
  const [color, setColor] = useState(product.colors[0]?.name ?? "Único");
  const [size, setSize] = useState(product.sizes[0] ?? "Único");
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);

  const gallery = useMemo(() => {
    if (product.images && product.images.length > 0) {
      return Array.from(new Set(product.images.filter(Boolean)));
    }
    const set = new Set([product.image, product.altImage].filter(Boolean));
    return Array.from(set);
  }, [product]);

  const fav = isFavorite(product.slug);
  const soldOut = product.stock === 0;

  return (
    <SiteLayout>
      <section className="edge pt-8">
        <ScrollReveal variant="slide-left" delay={100} duration={800}>
          <nav className="label-xs flex items-center gap-2 text-muted-foreground">
            <Link href="/catalogo" className="link-underline">
              Catálogo
            </Link>
            <span>/</span>
            <Link href={`/categoria/${product.category}`} className="link-underline">
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-foreground">{product.code}</span>
          </nav>
        </ScrollReveal>
      </section>

      <section className="edge mt-6 grid gap-10 lg:grid-cols-[1.45fr_1fr] lg:gap-16">
        {/* galería */}
        <ScrollReveal variant="slide-left" delay={200} duration={950}>
          <div className="relative aspect-[4/5] overflow-hidden bg-cream lg:aspect-[4/4.6]">
            <img
              src={gallery[active] || gallery[0] || "/placeholder.jpg"}
              alt={product.name}
              className="h-full w-full object-cover transition-opacity duration-500"
            />
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-3">
              {gallery.map((g, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    "h-24 w-20 overflow-hidden bg-cream transition-opacity cursor-pointer",
                    active === i ? "opacity-100 ring-1 ring-foreground" : "opacity-50",
                  )}
                  aria-label={`Ver imagen ${i + 1}`}
                >
                  <img src={g} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </ScrollReveal>

        {/* información */}
        <ScrollReveal variant="fade-up" delay={250} duration={900} className="lg:sticky lg:top-28 lg:self-start">
          <p className="label-xs text-accent">{product.code}</p>
          <h1 className="display-md mt-4">{product.name}</h1>

          <div className="mt-5 flex items-baseline gap-3">
            <p className="text-xl tabular-nums">{money(product.price)}</p>
            {product.compareAt && (
              <p className="text-sm tabular-nums text-muted-foreground line-through">
                {money(product.compareAt)}
              </p>
            )}
          </div>
          <p className="mt-7 max-w-md text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          {/* color */}
          {product.colors.length > 0 && (
            <div className="mt-9">
              <p className="label-xs text-muted-foreground">
                Color — <span className="text-foreground">{color}</span>
              </p>
              <div className="mt-3 flex gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    aria-label={c.name}
                    onClick={() => setColor(c.name)}
                    className={cn(
                      "h-9 w-9 border transition-all duration-300 rounded-full cursor-pointer",
                      color === c.name ? "border-foreground p-1" : "border-border p-0",
                    )}
                  >
                    <span className="block h-full w-full rounded-full" style={{ backgroundColor: c.hex }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* variantes */}
          {product.sizes.length > 0 && (
            <div className="mt-7">
              <p className="label-xs text-muted-foreground">Variante</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={cn(
                      "label-xs border px-4 py-3 transition-colors rounded-full cursor-pointer",
                      size === s
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* cantidad + CTA */}
          <div className="mt-9 flex items-stretch gap-3">
            <div
              className={cn(
                "flex items-center border rounded-full transition-colors",
                soldOut
                  ? "border-border/60 bg-muted/40 text-muted-foreground opacity-60"
                  : "border-border",
              )}
            >
              <button
                type="button"
                aria-label="Menos"
                disabled={soldOut}
                className={cn(
                  "px-3 py-3 transition-colors rounded-l-full",
                  soldOut ? "cursor-default" : "cursor-pointer ",
                )}
                onClick={() => setQty(Math.max(1, qty - 1))}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
              <button
                type="button"
                aria-label="Más"
                disabled={soldOut}
                className={cn(
                  "px-3 py-3 transition-colors rounded-r-full",
                  soldOut ? "cursor-default" : "cursor-pointer ",
                )}
                onClick={() => setQty(qty + 1)}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              type="button"
              disabled={soldOut}
              onClick={() => addToCart(product, color, size, qty)}
              className={cn(
                "label-sm flex-1 bg-foreground py-4 text-background rounded-full border border-foreground transition-colors duration-300",
                soldOut
                  ? "opacity-40 cursor-default"
                  : "hover:bg-accent cursor-pointer",
              )}
            >
              {soldOut ? "Agotado" : "Agregar al carrito"}
            </button>
            <button
              type="button"
              aria-label="Favoritos"
              onClick={() => toggleFavorite(product.slug)}
              className="flex w-12 items-center justify-center border border-foreground hover:text-red-500 rounded-full transition-colors duration-300 cursor-pointer"
            >
              <Heart className={cn("h-4 w-4", fav && "fill-accent text-accent")} />
            </button>
          </div>

          <Link
            href="/checkout"
            onClick={() => !soldOut && addToCart(product, color, size, qty)}
            className={cn(
              "label-sm mt-3 flex items-center justify-center border border-foreground py-4 transition-colors duration-300 hover:bg-foreground hover:text-background rounded-full cursor-pointer",
              soldOut && "pointer-events-none opacity-40",
            )}
          >
            Comprar ahora
          </Link>

          <p className="label-xs mt-4 text-muted-foreground">
            {soldOut
              ? "Sin stock — avisanos y te escribimos cuando vuelva"
              : `${product.stock} unidades disponibles · despacho en 24 h`}
          </p>

          {/* características */}
          {product.features.length > 0 && (
            <ul className="mt-9 space-y-2 border-t border-border pt-6">
              {product.features.map((f) => (
                <li key={f} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="text-accent">—</span>
                  {f}
                </li>
              ))}
            </ul>
          )}

          <Accordion type="single" collapsible className="mt-8 border-t border-border">
            {[
              ["Materiales", product.materials],
              ["Dimensiones", product.dimensions],
              ["Cuidados", product.care],
            ]
              .filter(([_, body]) => Boolean(body))
              .map(([title, body]) => (
                <AccordionItem key={title} value={title!} className="border-b border-border">
                  <AccordionTrigger className="label-xs py-4 hover:no-underline">
                    {title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                    {body}
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </ScrollReveal>
      </section>

      {/* relacionados */}
      {relatedProducts.length > 0 && (
        <section className="edge pt-24">
          <ScrollReveal variant="slide-left" delay={100} duration={850} className="flex items-baseline gap-4">
            <span className="label-xs text-accent">✳</span>
            <h2 className="display-md">También te puede interesar</h2>
          </ScrollReveal>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {relatedProducts.map((p, i) => (
              <ScrollReveal key={p.id} variant="fade-up" delay={i * 100} duration={750}>
                <ProductCard product={p} />
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
