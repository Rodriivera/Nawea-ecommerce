"use client";

import Link from "next/link";
import { RefreshCw, ShieldCheck, Tag, MessageCircle, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/shop/SiteLayout";
import { ScrollReveal } from "@/components/shop/ScrollReveal";

export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.011 1.985c-5.52 0-9.999 4.479-9.999 10 0 1.764.461 3.486 1.336 5.006L2 22l5.127-1.344c1.472.802 3.136 1.226 4.884 1.226 5.522 0 10.002-4.479 10.002-10 0-5.521-4.48-10-10.002-10zm5.82 14.184c-.244.685-1.42 1.31-2.001 1.394-.504.075-1.144.106-1.846-.118-.425-.136-.971-.317-1.67-.62-2.937-1.268-4.854-4.234-5.001-4.429-.146-.195-1.196-1.59-1.196-3.033 0-1.443.757-2.152 1.026-2.445.27-.293.585-.366.781-.366.195 0 .39.002.561.01.177.009.421-.067.66.505.244.585.83 2.023.903 2.17.073.146.122.341.024.536-.098.195-.146.317-.293.488-.146.171-.307.382-.439.512-.146.146-.298.305-.128.597.17.292.756 1.246 1.624 2.019 1.117.994 2.059 1.302 2.352 1.448.293.146.463.122.634-.073.171-.195.732-.854.927-1.146.195-.293.39-.244.658-.146.268.098 1.707.805 2.001.951.293.146.488.22.561.341.073.122.073.707-.171 1.392z" />
    </svg>
  );
}

export default function CambiosPage() {
  return (
    <SiteLayout>
      {/* Header de la página */}
      <section className="edge pb-10 pt-16 md:pt-24">
        <ScrollReveal variant="slide-left" delay={100} duration={850}>
          <span className="label-xs text-accent font-bold">Garantía & Satisfacción</span>
        </ScrollReveal>
        <ScrollReveal variant="fade-up" delay={200} duration={1000}>
          <h1 className="display-xl mt-3">Cambios y devoluciones</h1>
        </ScrollReveal>
        <ScrollReveal variant="fade-up" delay={300} duration={900}>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Queremos que te enamores de tu pieza NAWEA. Si necesitás cambiar de modelo, color o realizar una devolución, disponés de 30 días con una gestión transparente y rápida.
          </p>
        </ScrollReveal>
      </section>

      {/* Políticas Principales */}
      <section className="edge py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <ScrollReveal variant="fade-up" delay={150} duration={850} className="border border-border bg-card p-6 md:p-8 rounded-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-foreground">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h3 className="display text-xl mt-6 font-bold">30 Días de Plazo</h3>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Podés realizar el cambio de tu pieza dentro de los 30 días corridos a partir del día en que la recibiste.
            </p>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={250} duration={850} className="border border-border bg-card p-6 md:p-8 rounded-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-foreground">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="display text-xl mt-6 font-bold">Garantía por Defecto</h3>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Si el producto presenta alguna falla de fabricación o costura, el cambio o reparación es 100% sin cargo.
            </p>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={350} duration={850} className="border border-border bg-card p-6 md:p-8 rounded-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-foreground">
              <Tag className="h-6 w-6" />
            </div>
            <h3 className="display text-xl mt-6 font-bold">Estado de la Pieza</h3>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              El producto debe conservarse sin uso, en perfectas condiciones y con sus etiquetas y empaque original.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Paso a Paso */}
      <section className="edge py-12">
        <ScrollReveal variant="slide-left" delay={100} duration={800}>
          <h2 className="display-md">¿Cómo solicitar un cambio?</h2>
        </ScrollReveal>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Contactanos con tu número de orden",
              desc: "Escribinos por WhatsApp o mail indicando tu número de pedido (ej. NW-2842) y el modelo que querés cambiar o devolver.",
            },
            {
              step: "02",
              title: "Coordinación del despacho",
              desc: "Te facilitamos la etiqueta de correo o reservamos tu turno de retiro/cambio presencial en nuestro showroom.",
            },
            {
              step: "03",
              title: "Envío del nuevo producto",
              desc: "Una vez inspeccionada la pieza recibida, despachamos tu nuevo modelo seleccionado o emitimos tu nota de crédito.",
            },
          ].map((item, i) => (
            <ScrollReveal key={i} variant="fade-up" delay={i * 150} duration={800} className="border border-border bg-card p-6 rounded-2xl relative overflow-hidden">
              <span className="display text-5xl opacity-15 font-bold absolute top-4 right-4 text-foreground">{item.step}</span>
              <h4 className="font-bold text-base mt-2 pr-12">{item.title}</h4>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Acción rápida por WhatsApp */}
      <section className="edge py-16">
        <ScrollReveal variant="zoom-in" delay={150} duration={900} className="bg-foreground text-background p-8 md:p-12 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span className="label-xs text-accent">Atención Inmediata</span>
            <h3 className="display-md text-2xl sm:text-3xl mt-2 text-background">¿Querés iniciar un cambio ahora?</h3>
            <p className="mt-2 text-sm text-background/70">Comunicate directamente con nuestro equipo de soporte para darte asistencia personalizada.</p>
          </div>
          <a
            href="https://wa.me/?text=Hola%20NAWEA,%20quiero%20realizar%20un%20cambio%20de%20mi%20pedido"
            target="_blank"
            rel="noopener noreferrer"
            className="label-sm bg-accent text-foreground px-8 py-4 rounded-full hover:bg-white cursor-pointer transition-colors font-bold shrink-0 flex items-center gap-2"
          >
            <WhatsAppIcon className="h-5 w-5" /> Hablar por WhatsApp
          </a>
        </ScrollReveal>
      </section>
    </SiteLayout>
  );
}
