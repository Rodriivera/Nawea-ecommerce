"use client";

import Link from "next/link";
import { Instagram, Facebook } from "lucide-react";
import { categories } from "@/data/catalog";
import { ScrollReveal } from "@/components/shop/ScrollReveal";

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.011 1.985c-5.52 0-9.999 4.479-9.999 10 0 1.764.461 3.486 1.336 5.006L2 22l5.127-1.344c1.472.802 3.136 1.226 4.884 1.226 5.522 0 10.002-4.479 10.002-10 0-5.521-4.48-10-10.002-10zm5.82 14.184c-.244.685-1.42 1.31-2.001 1.394-.504.075-1.144.106-1.846-.118-.425-.136-.971-.317-1.67-.62-2.937-1.268-4.854-4.234-5.001-4.429-.146-.195-1.196-1.59-1.196-3.033 0-1.443.757-2.152 1.026-2.445.27-.293.585-.366.781-.366.195 0 .39.002.561.01.177.009.421-.067.66.505.244.585.83 2.023.903 2.17.073.146.122.341.024.536-.098.195-.146.317-.293.488-.146.171-.307.382-.439.512-.146.146-.298.305-.128.597.17.292.756 1.246 1.624 2.019 1.117.994 2.059 1.302 2.352 1.448.293.146.463.122.634-.073.171-.195.732-.854.927-1.146.195-.293.39-.244.658-.146.268.098 1.707.805 2.001.951.293.146.488.22.561.341.073.122.073.707-.171 1.392z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border bg-foreground text-background">
      <div className="edge py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <ScrollReveal variant="slide-left" delay={0} duration={1000}>
            <p className="display text-[clamp(3rem,9vw,7rem)] leading-[0.8] text-accent">NAWEA</p>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-background/60">
              Desde 2021 produciendo y diseñando en San Nicolás de los Arroyos, Buenos Aires, Argentina.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://www.instagram.com/_nawea/?hl=es"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center border border-background text-background transition-all duration-300 hover:border-accent hover:bg-accent hover:text-foreground hover:-translate-y-0.5 rounded-full"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/naweabackpack"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center border border-background text-background transition-all duration-300 hover:border-accent hover:bg-accent hover:text-foreground hover:-translate-y-0.5 rounded-full"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-10 w-10 items-center justify-center border border-background text-background transition-all duration-300 hover:border-accent hover:bg-accent hover:text-foreground hover:-translate-y-0.5 rounded-full"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={120} duration={1000}>
            <p className="label-xs text-background/40">Categorías</p>
            <ul className="mt-5 space-y-3">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/categoria/${c.slug}`}
                    className="link-underline text-sm cursor-pointer transition-all duration-200 hover:text-accent"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={240} duration={1000}>
            <p className="label-xs text-background/40">Ayuda</p>
            <ul className="mt-5 space-y-3 text-sm text-background/80 flex flex-col gap-1">
              <li>
                <Link href="/envios" className="link-underline cursor-pointer transition-all duration-200 hover:text-accent">
                  Envíos a todo el país
                </Link>
              </li>
              <li>
                <Link href="/cambios" className="link-underline cursor-pointer transition-all duration-200 hover:text-accent">
                  Cambios y devoluciones
                </Link>
              </li>
              <li>
                <Link href="/cuidados" className="link-underline cursor-pointer transition-all duration-200 hover:text-accent">
                  Guía de cuidados
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="link-underline cursor-pointer transition-all duration-200 hover:text-accent">
                  Contacto
                </Link>
              </li>
            </ul>
          </ScrollReveal>
        </div>

        <ScrollReveal variant="blur-in" delay={150} duration={1000} className="mt-16 flex flex-col gap-3 border-t border-background/15 pt-6 text-[0.7rem] uppercase tracking-[0.14em] text-background/40 md:flex-row md:justify-between">
          <span>© 2026 NAWEA</span>
          <span>San Nicolás de los Arroyos — Buenos Aires — Argentina</span>
        </ScrollReveal>
      </div>
    </footer>
  );
}


