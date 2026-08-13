"use client";

import Link from "next/link";
import { Sparkles, Droplets, Sun, ShieldAlert, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/shop/SiteLayout";
import { ScrollReveal } from "@/components/shop/ScrollReveal";

export default function CuidadosPage() {
  return (
    <SiteLayout>
      {/* Header de la página */}
      <section className="edge pb-10 pt-16 md:pt-24">
        <ScrollReveal variant="slide-left" delay={100} duration={850}>
          <span className="label-xs text-accent font-bold">Mantenimiento & Durabilidad</span>
        </ScrollReveal>
        <ScrollReveal variant="fade-up" delay={200} duration={1000}>
          <h1 className="display-xl mt-3">Guía de cuidados</h1>
        </ScrollReveal>
        <ScrollReveal variant="fade-up" delay={300} duration={900}>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Nuestras piezas están diseñadas para acompañarte todos los días. Te compartimos consejos clave de limpieza y conservación para mantener la textura, color y estructura original.
          </p>
        </ScrollReveal>
      </section>

      {/* Cuidados por Material */}
      <section className="edge py-12">
        <ScrollReveal variant="slide-left" delay={100} duration={800}>
          <h2 className="display-md">Recomendaciones por material</h2>
        </ScrollReveal>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <ScrollReveal variant="fade-up" delay={150} duration={850} className="border border-border bg-card p-6 md:p-8 rounded-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-foreground">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="display text-xl mt-6 font-bold">Cuero Sintético & PU Premium</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-4">
              <li>Limpiar suavemente con un paño de microfibra apenas humedecido en agua tibia.</li>
              <li>No aplicar alcohol, solventes ni quitamanchas agresivos.</li>
              <li>Para recuperar brillo, se puede usar crema acondicionadora incolora para superficies sintéticas.</li>
            </ul>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={250} duration={850} className="border border-border bg-card p-6 md:p-8 rounded-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-foreground">
              <Droplets className="h-6 w-6" />
            </div>
            <h3 className="display text-xl mt-6 font-bold">Cordura & Textiles Impermeables</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-4">
              <li>Remover suciedad superficial con cepillo de cerdas blandas o esponja suave.</li>
              <li>Lavar manchas puntuales con agua fría y jabón neutro.</li>
              <li>No lavar en lavarropas ni centrfugar para preservar el revestimiento interno.</li>
            </ul>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={350} duration={850} className="border border-border bg-card p-6 md:p-8 rounded-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-foreground">
              <Sun className="h-6 w-6" />
            </div>
            <h3 className="display text-xl mt-6 font-bold">Herrajes & Zippers de Metal</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-4">
              <li>Mantener cierres y hebillas secos para evitar pérdida de acabado o corrosión.</li>
              <li>Si los cierres se traban, aplicar suavemente cera de abeja o mina de lápiz sobre los dientes.</li>
              <li>Evitar contacto directo con perfumes, aerosoles o líquidos corrosivos.</li>
            </ul>
          </ScrollReveal>
        </div>
      </section>

      {/* Almacenamiento & Buenas Prácticas */}
      <section className="edge py-12">
        <ScrollReveal variant="slide-left" delay={100} duration={800}>
          <h2 className="display-md">Consejos de almacenamiento</h2>
        </ScrollReveal>

        <div className="mt-8 max-w-4xl grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "Guardado en funda o espacio ventilado",
              desc: "Almacená tus bolsos y riñoneras en lugares secos, alejados de la humedad y la luz solar directa prolongada para prevenir decoloración.",
            },
            {
              title: "Preservación de la forma original",
              desc: "Cuando no uses tu pieza por tiempo prolongado, rellenala con papel suave para conservar el volumen estructural sin deformar costuras.",
            },
            {
              title: "Evitar sobrecarga excesiva",
              desc: "Nuestras costuras son reforzadas, pero evitar cargas desmedidas prolonga sensiblemente la vida útil de los cierres y correas regulables.",
            },
            {
              title: "Secado natural a la sombra",
              desc: "Si tu pieza se moja por lluvia, dejala secar a temperatura ambiente en sombra. Nunca apliques secadores de pelo ni fuentes de calor intenso.",
            },
          ].map((item, i) => (
            <ScrollReveal key={i} variant="fade-up" delay={i * 100} duration={750} className="border border-border bg-card p-6 rounded-2xl">
              <h4 className="font-bold text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-accent shrink-0" />
                {item.title}
              </h4>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* CTA a Colección */}
      <section className="edge py-16">
        <ScrollReveal variant="zoom-in" delay={150} duration={900} className="bg-cream p-8 md:p-12 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="display-md text-2xl sm:text-3xl">Conocé la confección de nuestras piezas</h3>
            <p className="mt-2 text-sm text-muted-foreground">Descubrí todos los detalles técnicos y características de la colección actual.</p>
          </div>
          <Link
            href="/catalogo"
            className="label-sm bg-foreground text-background px-8 py-4 rounded-full hover:bg-accent cursor-pointer transition-colors font-bold shrink-0 flex items-center gap-2"
          >
            Ver Piezas <ArrowRight className="h-4 w-4" />
          </Link>
        </ScrollReveal>
      </section>
    </SiteLayout>
  );
}
