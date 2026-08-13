"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, RotateCcw, Rows3, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { ScrollReveal } from "./ScrollReveal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/data/catalog";

const SORTS = [
  { id: "destacados", label: "Destacados" },
  { id: "vendidos", label: "Más vendidos" },
  { id: "nuevos", label: "Nuevos" },
  { id: "precio-asc", label: "Precio ↑" },
  { id: "precio-desc", label: "Precio ↓" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

const PRICE_RANGES = [
  { id: "all", label: "Todos", test: () => true },
  { id: "lt50", label: "Hasta $50.000", test: (p: Product) => p.price < 50000 },
  { id: "50-100", label: "$50.000 — $100.000", test: (p: Product) => p.price >= 50000 && p.price < 100000 },
  { id: "gt100", label: "Más de $100.000", test: (p: Product) => p.price >= 100000 },
];

export function CatalogView({ items }: { items: Product[] }) {
  const [sort, setSort] = useState<SortId>("destacados");
  const [price, setPrice] = useState("all");
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [dense, setDense] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const colors = useMemo(
    () => Array.from(new Set(items.flatMap((p) => p.colors.map((c) => c.name)))),
    [items],
  );
  const sizes = useMemo(() => Array.from(new Set(items.flatMap((p) => p.sizes))), [items]);

  const filtered = useMemo(() => {
    const range = PRICE_RANGES.find((r) => r.id === price)!;
    let list = items.filter((p) => range.test(p));
    if (color) list = list.filter((p) => p.colors.some((c) => c.name === color));
    if (size) list = list.filter((p) => p.sizes.includes(size));
    if (onlyAvailable) list = list.filter((p) => p.stock > 0);

    switch (sort) {
      case "vendidos":
        return [...list].sort((a, b) => b.sold - a.sold);
      case "nuevos":
        return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      case "precio-asc":
        return [...list].sort((a, b) => a.price - b.price);
      case "precio-desc":
        return [...list].sort((a, b) => b.price - a.price);
      default:
        return list;
    }
  }, [items, price, color, size, onlyAvailable, sort]);

  const activeCount =
    (price !== "all" ? 1 : 0) + (color ? 1 : 0) + (size ? 1 : 0) + (onlyAvailable ? 1 : 0);

  const clear = () => {
    setPrice("all");
    setColor(null);
    setSize(null);
    setOnlyAvailable(false);
  };

  const FilterBody = (
    <div className="space-y-10">
      <div>
        <p className="label-xs text-muted-foreground">Precio</p>
        <ul className="mt-4 space-y-2.5">
          {PRICE_RANGES.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setPrice(r.id)}
                className={cn(
                  "text-sm transition-colors cursor-pointer",
                  price === r.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className={cn(price === r.id && "border-b border-foreground pb-0.5")}>
                  {r.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="label-xs text-muted-foreground">Color</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(color === c ? null : c)}
              className={cn(
                "label-xs border px-3 py-2 transition-colors rounded-full cursor-pointer" ,
                color === c
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="label-xs text-muted-foreground">Tamaño</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(size === s ? null : s)}
              className={cn(
                "label-xs border px-3 py-2 transition-colors rounded-full cursor-pointer",
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

      <div>
        <p className="label-xs text-muted-foreground">Disponibilidad</p>
        <button
          type="button"
          onClick={() => setOnlyAvailable((v) => !v)}
          className="mt-4 flex items-center gap-3 text-sm cursor-pointer"
        >
          <span
            className={cn(
              "flex h-4 w-4 items-center justify-center border transition-colors",
              onlyAvailable ? "border-foreground bg-foreground" : "border-input",
            )}
          >
            {onlyAvailable && <span className="h-1.5 w-1.5 bg-background" />}
          </span>
          Solo en stock
        </button>
      </div>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={clear}
          className="label-xs group flex w-full items-center justify-between border border-border px-3.5 py-2.5 text-foreground transition-all duration-300 hover:border-foreground hover:bg-foreground hover:text-background cursor-pointer rounded-full"
        >
          <span className="flex items-center gap-2">
            <RotateCcw className="h-3 w-3 transition-transform duration-300 group-hover:-rotate-90" />
            Limpiar filtros
          </span>
          <span className="flex h-4 w-4 items-center justify-center bg-foreground/10 text-[10px] font-medium text-foreground transition-colors group-hover:bg-background group-hover:text-foreground">
            {activeCount}
          </span>
        </button>
      )}
    </div>
  );

  return (
    <div>
      {/* barra de control */}
      <ScrollReveal variant="fade-down" delay={150} duration={850} className="sticky top-16 z-30 -mx-5 mb-10 border-y border-border bg-background/90 px-5 py-3 backdrop-blur-md md:top-[72px] md:-mx-10 md:px-10 xl:-mx-14 xl:px-14">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <span className="label-xs text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
            </span>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="label-xs flex items-center gap-2 lg:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
              {activeCount > 0 && <span className="text-accent">{activeCount}</span>}
            </button>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden items-center gap-4 md:flex">
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSort(s.id)}
                  className={cn(
                    "label-xs transition-colors cursor-pointer",
                    sort === s.id
                      ? "text-foreground underline underline-offset-4"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="md:hidden">
              <Select value={sort} onValueChange={(val) => setSort(val as SortId)}>
                <SelectTrigger aria-label="Ordenar" className="min-w-[135px]">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent align="end">
                  {SORTS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="hidden items-center gap-1 lg:flex">
              <button
                type="button"
                aria-label="Vista amplia"
                onClick={() => setDense(false)}
                className={cn("p-1.5", !dense ? "text-foreground" : "text-muted-foreground cursor-pointer")}
              >
                <Rows3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Vista densa"
                onClick={() => setDense(true)}
                className={cn("p-1.5", dense ? "text-foreground" : "text-muted-foreground cursor-pointer")}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <div className="grid gap-12 lg:grid-cols-[200px_1fr] lg:gap-10">
        <aside className="hidden lg:block">
          <ScrollReveal variant="slide-left" delay={200} duration={900} className="sticky top-40">
            {FilterBody}
          </ScrollReveal>
        </aside>

        <div>
          {filtered.length === 0 ? (
            <ScrollReveal variant="fade-up" delay={200} duration={800}>
              <p className="py-24 text-center text-sm text-muted-foreground">
                No hay piezas con esos filtros. Probá ampliar el rango de precio.
              </p>
            </ScrollReveal>
          ) : (
            <div
              className={cn(
                "grid gap-x-4 gap-y-12",
                dense ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3",
              )}
            >
              {filtered.map((p, i) => (
                <ScrollReveal
                  key={p.id}
                  variant="fade-up"
                  delay={(i % 4) * 100}
                  duration={750}
                >
                  <ProductCard product={p} ratio={dense ? "square" : "portrait"} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* filtros mobile */}
      <div
        className={cn(
          "fixed inset-0 z-[85] bg-background transition-[opacity,visibility] duration-400 ease-nawea lg:hidden",
          filtersOpen ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="display text-xl">Filtros</span>
          <button type="button" aria-label="Cerrar" onClick={() => setFiltersOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-[calc(100dvh-136px)] overflow-y-auto px-5 py-8">{FilterBody}</div>
        <button
          type="button"
          onClick={() => setFiltersOpen(false)}
          className="label-sm absolute inset-x-0 bottom-0 bg-foreground py-5 text-background"
        >
          Ver {filtered.length} productos
        </button>
      </div>
    </div>
  );
}
