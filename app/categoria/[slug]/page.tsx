import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/shop/SiteLayout";
import { CatalogView } from "@/components/shop/CatalogView";
import { ScrollReveal } from "@/components/shop/ScrollReveal";
import { fetchCategoriesFromDb, fetchProductsFromDb } from "@/lib/catalog-db";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categories = await fetchCategoriesFromDb();
  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    return { title: "Categoría no encontrada — NAWEA" };
  }
  return {
    title: `${category.name} — NAWEA`,
    description: category.intro.slice(0, 155),
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const categories = await fetchCategoriesFromDb();
  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    notFound();
  }

  const items = await fetchProductsFromDb({ categorySlug: category.slug });

  return (
    <SiteLayout>
      {/* intro editorial */}
      <section className="edge pt-12 md:pt-16">
        <ScrollReveal variant="slide-left" delay={100} duration={800}>
          <nav className="label-xs flex items-center gap-2 text-muted-foreground">
            <Link href="/" className="link-underline">
              Inicio
            </Link>
            <span>/</span>
            <Link href="/catalogo" className="link-underline">
              Categoría
            </Link>
            <span>/</span>
            <span className="text-foreground">{category.name}</span>
          </nav>
        </ScrollReveal>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <ScrollReveal variant="fade-up" delay={250} duration={1000}>
            <span className="label-xs text-accent">{category.index}</span>
            <h1 className="display-xl mt-4">{category.name}</h1>
          </ScrollReveal>
          <ScrollReveal variant="slide-right" delay={400} duration={900} className="lg:pb-4">
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {category.intro}
            </p>
            <p className="label-xs mt-6">{items.length} productos</p>
          </ScrollReveal>
        </div>

        <ScrollReveal variant="zoom-in" delay={200} duration={1000} className="mt-12 aspect-[16/7] w-full overflow-hidden bg-cream md:aspect-[16/5]">
          <img
            src={category.image}
            alt={`Categoría ${category.name}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </ScrollReveal>
      </section>

      <section className="edge pb-24 pt-14">
        <CatalogView items={items} />
      </section>

      <section className="edge">
        <ScrollReveal variant="fade-up" delay={150} duration={850} className="rule flex flex-wrap gap-x-8 gap-y-3 pt-8">
          <span className="label-xs text-muted-foreground">Seguir explorando</span>
          {categories
            .filter((c) => c.slug !== category.slug)
            .map((c) => (
              <Link
                key={c.slug}
                href={`/categoria/${c.slug}`}
                className="label-xs link-underline"
              >
                {c.name}
              </Link>
            ))}
        </ScrollReveal>
      </section>
    </SiteLayout>
  );
}
