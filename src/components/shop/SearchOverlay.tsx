"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { categories, products as localProducts, type Product, type CategorySlug } from "@/data/catalog";
import { useShop } from "@/store/shop";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const SUGGESTIONS = ["Riñonera", "Mochila", "Bolso", "Cartera", "Porta tarjetas"];

export function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useShop();
  const [q, setQ] = useState("");
  const [dbResults, setDbResults] = useState<Product[] | null>(null);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (searchOpen) window.setTimeout(() => inputRef.current?.focus(), 260);
    else {
      setQ("");
      setDbResults(null);
    }
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearchOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  const term = q.trim();

  // Debounced search a Supabase DB
  useEffect(() => {
    if (!term) {
      setDbResults(null);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select(`
            *,
            categories(slug),
            product_colors(name, hex),
            product_sizes(name),
            product_images(url, position)
          `)
          .eq("status", "Activo")
          .or(`name.ilike.%${term}%,code.ilike.%${term}%,description.ilike.%${term}%`)
          .limit(6);

        if (!error && data && data.length > 0) {
          const mapped: Product[] = data.map((row: any) => {
            const imgs = (row.product_images ?? []).sort((a: any, b: any) => a.position - b.position);
            return {
              id: row.id,
              code: row.code,
              slug: row.slug,
              name: row.name,
              category: (row.categories?.slug ?? "accesorios") as CategorySlug,
              price: row.price,
              compareAt: row.compare_at ?? undefined,
              badge: row.badge ?? undefined,
              colors: Array.isArray(row.product_colors) && row.product_colors.length > 0 ? row.product_colors : [{ name: "Único", hex: "#000000" }],
              sizes: Array.isArray(row.product_sizes) && row.product_sizes.length > 0 ? row.product_sizes.map((s: any) => s.name) : ["Único"],
              image: imgs[0]?.url ?? "/placeholder.jpg",
              altImage: imgs[1]?.url ?? imgs[0]?.url ?? "/placeholder.jpg",
              description: row.description ?? "",
              features: Array.isArray(row.features) ? row.features : [],
              materials: row.materials ?? "",
              dimensions: row.dimensions ?? "",
              care: row.care ?? "",
              sku: row.sku,
              stock: Math.max(0, row.stock - (row.reserved ?? 0)),
              minStock: row.min_stock ?? 1,
              sold: row.sold ?? 0,
              createdAt: row.created_at ?? "",
              status: row.status ?? "Activo",
            };
          });
          setDbResults(mapped);
        } else {
          // Fallback a filtrado local
          const localHits = localProducts
            .filter((p) =>
              [p.name, p.code, p.category, p.description, ...p.colors.map((c) => c.name)]
                .join(" ")
                .toLowerCase()
                .includes(term.toLowerCase()),
            )
            .slice(0, 6);
          setDbResults(localHits);
        }
      } catch {
        const localHits = localProducts
          .filter((p) =>
            [p.name, p.code, p.category, p.description, ...p.colors.map((c) => c.name)]
              .join(" ")
              .toLowerCase()
              .includes(term.toLowerCase()),
          )
          .slice(0, 6);
        setDbResults(localHits);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [term, supabase]);

  const results = dbResults ?? [];

  const catHits = useMemo(
    () => (term ? categories.filter((c) => c.name.toLowerCase().includes(term.toLowerCase())) : []),
    [term],
  );

  return (
    <div
      className={cn(
        "fixed inset-0 z-[95] bg-background transition-[opacity,visibility] duration-400 ease-nawea",
        searchOpen ? "visible opacity-100" : "invisible opacity-0",
      )}
    >
      <div className="flex h-dvh flex-col overflow-y-auto">
        <div className="edge flex h-16 shrink-0 items-center justify-end md:h-[72px]">
          <button
            type="button"
            aria-label="Cerrar búsqueda"
            onClick={() => setSearchOpen(false)}
            className="label-xs flex items-center gap-2 cursor-pointer"
          >
            Cerrar <X className="h-4 w-4" />
          </button>
        </div>

        <div className="edge pb-24 pt-6 md:pt-16">
          <h2 className="display-lg max-w-[14ch]">¿Qué estás buscando?</h2>

          <div className="mt-10 border-b border-foreground pb-4">
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Escribí acá…"
              className="w-full bg-transparent text-2xl tracking-tight outline-none placeholder:text-muted-foreground md:text-4xl"
            />
          </div>

          {!term && (
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="label-xs mr-2 text-muted-foreground">Sugerencias</span>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setQ(s)}
                  className="label-xs border border-border px-3 py-2 transition-colors hover:border-foreground rounded-full cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {term && (
            <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_2fr]">
              <div>
                <p className="label-xs text-muted-foreground">
                  Categorías relacionadas
                </p>
                <ul className="mt-4 space-y-2">
                  {(catHits.length ? catHits : categories).slice(0, 5).map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/categoria/${c.slug}`}
                        onClick={() => setSearchOpen(false)}
                        className="display-md block py-1 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="label-xs text-muted-foreground">
                  {searching ? "Buscando..." : `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`}
                </p>
                {!searching && results.length === 0 ? (
                  <p className="mt-6 text-sm text-muted-foreground">
                    No encontramos piezas para “{q}”. Probá con otra palabra.
                  </p>
                ) : (
                  <ul className="mt-4">
                    {results.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/producto/${p.slug}`}
                          onClick={() => setSearchOpen(false)}
                          className="group flex items-center gap-5 border-b border-border py-4"
                        >
                          <div className="h-20 w-16 shrink-0 overflow-hidden bg-cream">
                            <img
                              src={p.image}
                              alt={p.name}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-700 ease-nawea group-hover:scale-105"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="label-xs text-muted-foreground">{p.code}</p>
                            <p className="truncate text-base tracking-tight">{p.name}</p>
                          </div>
                          <span className="shrink-0 text-sm tabular-nums">{money(p.price)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
