"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useShop } from "@/store/shop";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/shop/ScrollReveal";
import { LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/data/catalog";
import { categories as localCategories } from "@/data/catalog";

export function Header({ overlay = false }: { overlay?: boolean }) {
  const { count, setCartOpen, setSearchOpen, menuOpen, setMenuOpen, favorites, profile } = useShop();
  const isAdmin = profile?.role === "admin";
  const [scrolled, setScrolled] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(localCategories);
  const pathname = usePathname();

  const supabase = createClient();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setCatsOpen(false);
  }, [pathname, setMenuOpen]);

  // Carga dinámica de categorías desde la base de datos
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, slug, name, index, intro, image_url, sort_order")
          .order("sort_order", { ascending: true });

        if (!error && data && data.length > 0) {
          setCategories(
            data.map((c: any) => ({
              slug: c.slug,
              name: c.name,
              index: c.index ?? "",
              intro: c.intro ?? "",
              image: c.image_url ?? "/placeholder.jpg",
            })),
          );
        }
      } catch {
        // Fallback silencioso a datos locales
      }
    };

    loadCategories();
  }, []);

  const solid = scrolled || !overlay;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 w-full overflow-hidden transition-[background-color,color,border-color] duration-500 ease-nawea",
          solid
            ? "border-b border-border bg-background/90 text-foreground backdrop-blur-md"
            : "border-b border-transparent bg-transparent text-foreground",
        )}
        onMouseLeave={() => setCatsOpen(false)}
      >
        <div className="edge flex h-16 items-center justify-between gap-4 md:h-[72px]">
          <ScrollReveal variant="fade-down" delay={100} duration={800} className="flex flex-1 items-center justify-start gap-8">
            <button
              type="button"
              aria-label="Buscar"
              className="lg:hidden text-foreground hover:text-accent transition-colors cursor-pointer"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </button>
            <nav className="hidden items-center gap-7 lg:flex">
              <Link href="/catalogo" className="label-sm link-underline flex items-center">
                Catálogo
              </Link>
              <button
                type="button"
                className="label-sm link-underline cursor-pointer flex items-center"
                onMouseEnter={() => setCatsOpen(true)}
                onClick={() => setCatsOpen((v) => !v)}
              >
                Categorías
              </button>
              <button
                type="button"
                className="label-sm link-underline cursor-pointer flex items-center"
                onClick={() => setSearchOpen(true)}
              >
                Buscar
              </button>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="label-xs flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-background hover:bg-accent transition-colors font-bold"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Admin
                </Link>
              )}
            </nav>
          </ScrollReveal>

          <ScrollReveal variant="fade-down" delay={0} duration={800} className="flex shrink-0 items-center justify-center text-center">
            <Link
              href="/"
              className="display text-[1.35rem] leading-none tracking-[-0.06em] md:text-[1.6rem] hover:text-accent transition-all duration-200"
            >
              NAWEA
            </Link>
          </ScrollReveal>

          <ScrollReveal variant="fade-down" delay={100} duration={800} className="flex flex-1 items-center justify-end gap-5">
            <Link href="/cuenta" className="label-sm hidden link-underline lg:inline-block">
              Cuenta
            </Link>
            <Link
              href="/cuenta?tab=favoritos"
              className="label-sm hidden link-underline relative lg:inline-block"
            >
              FAVORITOS
              {favorites.length > 0 && (
                <span className="absolute -right-2 -top-1.5 text-[10px] tabular-nums text-accent">
                  {favorites.length}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="label-sm link-underline hidden items-center gap-2 cursor-pointer lg:inline-flex"
              aria-label="Abrir carrito"
            >
              <span>Carrito</span>
              {count > 0 && (
                <span className="absolute -right-2 -top-1.5 text-[10px] tabular-nums text-accent">
                  {count}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative lg:hidden text-foreground hover:text-accent transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Abrir carrito"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-2 -top-1.5 text-[10px] tabular-nums text-accent font-semibold">
                  {count}
                </span>
              )}
            </button>
            <button
              type="button"
              aria-label="Menú"
              className="lg:hidden text-foreground hover:text-accent transition-colors cursor-pointer"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </ScrollReveal>
        </div>

        {/* mega panel de categorías — columnas dinámicas según cantidad */}
        <div
          className={cn(
            "hidden overflow-hidden border-t border-border bg-background transition-[max-height,opacity] duration-500 ease-nawea lg:block",
            catsOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div
            className="edge py-8"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(categories.length, 6)}, minmax(0, 1fr))`,
              gap: "1rem",
            }}
          >
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/categoria/${c.slug}`}
                className="group block"
              >
                <div className="aspect-[4/3] overflow-hidden bg-cream">
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-nawea group-hover:scale-105"
                  />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="label-sm">{c.name}</span>
                  <span className="label-xs  text-accent">{c.index}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* menú mobile fullscreen */}
      <div
        className={cn(
          "fixed inset-0 z-[70] bg-background overflow-y-auto transition-[opacity,visibility] duration-400 ease-nawea lg:hidden",
          menuOpen ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <div className="edge flex h-16 items-center justify-end">
          
          <button className="cursor-pointer" type="button" aria-label="Cerrar" onClick={() => setMenuOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="edge mt-6 flex flex-col">
          <Link href="/catalogo" className="display-md border-t border-border py-5 hover:text-accent transition-colors duration-200 cursor-pointer">
            CATÁLOGO
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="display-md flex items-baseline justify-between border-t border-border py-5 hover:text-accent transition-colors duration-200 cursor-pointer"
            >
              {c.name}
              <span className="label-xs text-muted-foreground">{c.index}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setSearchOpen(true);
            }}
            className="display-md border-y border-border py-5 text-left hover:text-accent transition-colors duration-200 cursor-pointer"
          >
            Buscar
          </button>
        </nav>
        <div className="edge mt-8 flex gap-6  items-center"> 
          
          <Link href="/cuenta" className="label-sm link-underline">
            Mi NAWEA
          </Link>
          <Link href="/cuenta?tab=favoritos" className="label-sm link-underline">
            Favoritos
          </Link>
          {isAdmin && (
            <Link href="/admin" className="label-xs flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-background font-bold">
              <LayoutDashboard className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
