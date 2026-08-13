import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { SiteLayout } from "@/components/shop/SiteLayout";
import { ProductCard } from "@/components/shop/ProductCard";
import { Rail } from "@/components/shop/Rail";
import { ScrollReveal, type AnimationVariant } from "@/components/shop/ScrollReveal";
import { IMAGES } from "@/data/catalog";
import { fetchCategoriesFromDb, fetchProductsFromDb } from "@/lib/catalog-db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NAWEA — Colección Artesanal",
  description:
    "Riñoneras, bolsos, carteras, mochilas y accesorios diseñados y producidos artesanalmente desde San Nicolás de los Arroyos, Buenos Aires, Argentina.",
};

function Marquee() {
  const items = [
    "ENVÍO GRATIS DESDE $120.000",
    "PRODUCCIÓN LOCAL",
    "CAMBIOS EN 30 DÍAS",
    "HECHO A MANO",
  ];
  return (
    <div className="overflow-hidden border-y border-border bg-foreground py-3 text-background select-none">
      <div className="animate-marquee flex w-max whitespace-nowrap">
        {[0, 1, 2, 3].map((dup) => (
          <div key={dup} className="flex shrink-0 items-center gap-12 pr-12">
            {items.map((t) => (
              <span key={t} className="label-xs flex items-center gap-12">
                {t}
                <span className="text-accent">✳</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHead({
  index,
  title,
  note,
  to,
}: {
  index: string;
  title: string;
  note?: string;
  to?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-4">
        <span className="label-xs text-accent">{index}</span>
        <h2 className="display-md">{title}</h2>
      </div>
      {note && <p className="mt-3 max-w-md text-sm text-muted-foreground">{note}</p>}
      {to === "shop" && (
        <Link href="/catalogo" className="label-xs link-underline mt-4 inline-flex items-center gap-1">
          Ver todo <ArrowUpRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

export default async function Home() {
  const [categories, allProducts] = await Promise.all([
    fetchCategoriesFromDb(),
    fetchProductsFromDb(),
  ]);

  const bestSellers = [...allProducts].sort((a, b) => b.sold - a.sold).slice(0, 8);
  const newArrivals = [...allProducts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  const categoryRevealConfigs: Array<{ variant: AnimationVariant; delay: number }> = [
    { variant: "slide-left", delay: 0 },
    { variant: "slide-right", delay: 250 },
    { variant: "slide-right", delay: 400 },
    { variant: "slide-left", delay: 250 },
    { variant: "flip-up", delay: 350 },
  ];

  return (
    <SiteLayout overlayHeader>
      {/* ---------- HERO ---------- */}
      <section className="relative min-h-dvh overflow-hidden bg-cream">
        <div className="grain absolute inset-0">
          <video
            src={IMAGES.heroVideo}
            poster={IMAGES.hero}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover object-center md:object-[60%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/25 to-transparent md:from-background/70 md:via-transparent" />
        </div>

        <div className="edge relative flex min-h-dvh flex-col justify-between pb-10 pt-24 md:pt-32">
          <ScrollReveal variant="fade-up" delay={250} duration={1000} className="max-w-[22ch]">
            <h1 className="display-xl mt-0">
              Creado a <span className="text-accent">mano</span>
              <br />
              pensado para<span className="text-accent"> vos</span>
            </h1>
          </ScrollReveal>

          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <ScrollReveal variant="slide-left" delay={400} duration={1000} className="max-w-sm">
              <Link
                href="/catalogo"
                className="label-sm mt-6 inline-flex items-center gap-3 bg-foreground px-8 py-4 text-background transition-colors duration-200 hover:bg-accent rounded-full"
              >
                Ver la colección <ArrowUpRight className="h-4 w-4" />
              </Link>
            </ScrollReveal>

            <ScrollReveal variant="blur-in" delay={400} duration={1000} className="flex items-center gap-3 text-muted-foreground">
              <ArrowDown className="h-4 w-4 animate-bounce" />
              <span className="label-xs">Desplazá</span>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <ScrollReveal variant="blur-in" duration={1000}>
        <Marquee />
      </ScrollReveal>

      {/* ---------- BEST SELLERS ---------- */}
      <section className="edge py-20 md:py-28">
        <Rail
          header={
            <ScrollReveal variant="slide-left" duration={1000}>
              <SectionHead
                index="01"
                title="Más vendidos"
                note="Los productos que más salen."
                to="shop"
              />
            </ScrollReveal>
          }
        >
          {bestSellers.map((p, i) => (
            <ScrollReveal key={p.id} variant="fade-up" delay={i * 100} duration={1000}>
              <ProductCard product={p} index={i} />
            </ScrollReveal>
          ))}
        </Rail>
      </section>

      {/* ---------- CATEGORÍAS (galería asimétrica) ---------- */}
      <section className="edge py-20 md:py-28">
        <ScrollReveal variant="slide-right" duration={1000} className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="display-lg">
            Categorías
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-12 md:gap-4">
          {categories.map((c, i) => {
            const span = [
              "md:col-span-7 md:row-span-2 aspect-[4/5] md:aspect-[16/13]",
              "md:col-span-5 aspect-[4/5] md:aspect-[16/10]",
              "md:col-span-5 aspect-[4/5] md:aspect-[16/9]",
              "md:col-span-4 aspect-[4/5] md:aspect-[3/4]",
              "md:col-span-8 aspect-[4/5] md:aspect-[16/7]",
            ][i] ?? "md:col-span-6 aspect-[4/5]";
            const config = categoryRevealConfigs[i] || { variant: "fade-up", delay: 0 };
            return (
              <ScrollReveal
                key={c.slug}
                variant={config.variant}
                delay={config.delay}
                duration={1000}
                className={span}
              >
                <Link
                  href={`/categoria/${c.slug}`}
                  className="group relative block h-full w-full overflow-hidden bg-cream"
                >
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-[1200ms] ease-nawea group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-foreground/0 transition-colors duration-500 group-hover:bg-foreground/10" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 md:p-6">
                    <span className="display text-[clamp(1.4rem,3.2vw,2.75rem)] text-background mix-blend-difference">
                      {c.name}
                    </span>
                    <span className="label-xs text-background mix-blend-difference">{c.index}</span>
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ---------- NEW ARRIVALS ---------- */}
      <section className="edge py-20 md:py-28">
        <Rail
          slideClass="w-[82%] sm:w-[55%] lg:w-[38%]"
          header={
            <ScrollReveal variant="slide-right" duration={1000}>
              <SectionHead
                index="02"
                title="Nuevos ingresos"
                note="Ingresos de las últimas semanas."
                to="shop"
              />
            </ScrollReveal>
          }
        >
          {newArrivals.map((p, i) => (
            <ScrollReveal key={p.id} variant="fade-up" delay={i * 100} duration={1000}>
              <ProductCard product={p} ratio="tall" />
            </ScrollReveal>
          ))}
        </Rail>
      </section>

      {/* ---------- CIERRE ---------- */}
      <section className="edge pb-8">
        <ScrollReveal variant="zoom-in" delay={100} duration={1000} className="rule pt-10">
          <Link href="/catalogo" className="group block">
            <p className="display text-[clamp(2.5rem,12vw,11rem)] leading-[0.82] transition-colors duration-500 group-hover:text-accent">
              Ver todo →
            </p>
          </Link>
        </ScrollReveal>
      </section>
    </SiteLayout>
  );
}
