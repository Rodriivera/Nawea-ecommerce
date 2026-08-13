"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Plus } from "lucide-react";
import { useState } from "react";
import { money } from "@/lib/format";
import type { Product } from "@/data/catalog";
import { useShop } from "@/store/shop";
import { cn } from "@/lib/utils";

const badgeTone: Record<string, string> = {
  NEW: "bg-foreground text-background",
  "BEST SELLER": "bg-transparent text-foreground border border-foreground",
  LIMITED: "bg-accent text-accent-foreground",
  SALE: "bg-transparent text-accent border border-accent",
};

export function ProductCard({
  product,
  ratio = "portrait",
  index,
}: {
  product: Product;
  ratio?: "portrait" | "square" | "tall";
  index?: number;
}) {
  const { toggleFavorite, isFavorite, addToCart } = useShop();
  const [hover, setHover] = useState(false);
  const fav = isFavorite(product.slug);

  const aspect =
    ratio === "square" ? "aspect-square" : ratio === "tall" ? "aspect-[3/4.4]" : "aspect-[3/4]";

  return (
    <article
      className="group relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link
        href={`/producto/${product.slug}`}
        className="block"
        aria-label={product.name}
      >
        <div className={cn("relative overflow-hidden bg-cream", aspect)}>
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={cn(
              "object-cover transition-[opacity,transform] duration-[900ms] ease-nawea",
              hover ? "scale-[1.04] opacity-0" : "scale-100 opacity-100",
            )}
          />
          <Image
            src={product.altImage}
            alt={`${product.name} — vista alternativa`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={cn(
              "object-cover transition-all duration-[1000ms] ease-nawea",
              hover ? "scale-100 opacity-100" : "scale-[1.05] opacity-0",
            )}
          />

          

          {typeof index === "number" && (
            <span className="label-xs absolute right-3 top-3 text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}

          {product.stock === 0 && (
            <span className="label-xs absolute top-3 left-3 bg-background px-2 py-1">
              Agotado
            </span>
          )}

          <div
            className={cn(
              "absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 transition-all duration-500 ease-nawea",
              hover ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
            )}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                const colorName = product.colors?.[0]?.name ?? "Único";
                const sizeName = product.sizes?.[0] ?? "Único";
                addToCart(product, colorName, sizeName);
              }}
              disabled={product.stock === 0}
              className="label-xs flex flex-1 items-center justify-center gap-2 bg-foreground px-3 py-3 text-background transition-colors hover:bg-white hover:text-black disabled:opacity-40 cursor-pointer rounded-full transition-colors duration-300"
            >
              <Plus className="h-3 w-3" /> Agregar
            </button>
            <button
              type="button"
              aria-label="Agregar a favoritos"
              onClick={(e) => {
                e.preventDefault();
                toggleFavorite(product.slug);
              }}
              className="flex h-[42px] w-[42px] items-center justify-center bg-background  hover:bg-white hover:text-red-500 rounded-full transition-colors duration-300 cursor-pointer"
            >
              <Heart className={cn("h-4 w-4", fav && "fill-red-400 text-red-400")} />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="label-xs text-muted-foreground">{product.code}</p>
            <h3 className="mt-1 truncate text-[0.95rem] font-medium tracking-tight">
              {product.name}
            </h3>
            
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[0.95rem] tabular-nums">{money(product.price)}</p>
            {product.compareAt && (
              <p className="text-xs tabular-nums text-muted-foreground line-through">
                {money(product.compareAt)}
              </p>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
