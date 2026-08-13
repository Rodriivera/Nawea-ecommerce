"use client";

import Link from "next/link";
import { Truck, Zap, Store, HelpCircle, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/shop/SiteLayout";
import { ScrollReveal } from "@/components/shop/ScrollReveal";
import { money } from "@/lib/format";

export default function EnviosPage() {
  return (
    <SiteLayout>
      {/* Header de la página */}
      <section className="edge pb-10 pt-16 md:pt-24">
        <ScrollReveal variant="slide-left" delay={100} duration={850}>
          <span className="label-xs text-accent font-bold">Envíos & Logística</span>
        </ScrollReveal>
        <ScrollReveal variant="fade-up" delay={200} duration={1000}>
          <h1 className="display-xl mt-3">Envíos a todo el país</h1>
        </ScrollReveal>
        <ScrollReveal variant="fade-up" delay={300} duration={900}>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Despachamos nuestras piezas desde Buenos Aires a cada rincón de Argentina. Conocé nuestras modalidades, tiempos de entrega y condiciones de envío bonificado.
          </p>
        </ScrollReveal>
      </section>

      {/* Modalidades de Envío */}
      <section className="edge py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <ScrollReveal variant="fade-up" delay={150} duration={850} className="border border-border bg-card p-6 md:p-8 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-foreground">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="display text-xl mt-6 font-bold">Envío Estándar</h3>
              <p className="label-xs mt-1 text-accent">A todo el país</p>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Entrega a domicilio entre 3 y 5 días hábiles a través de correo privado con seguimiento online punto a punto.
              </p>
            </div>
            <div className="mt-8 border-t border-border pt-4">
              <span className="label-xs text-muted-foreground block">Costo de envío</span>
              <span className="display text-lg mt-1 font-bold">
                Gratis <span className="text-xs font-normal text-muted-foreground">desde {money(120000)}</span>
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={250} duration={850} className="border border-border bg-card p-6 md:p-8 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-foreground">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="display text-xl mt-6 font-bold">Envío Express</h3>
              <p className="label-xs mt-1 text-accent">CABA & GBA</p>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Despacho prioritario en 24 hs hábiles en Ciudad de Buenos Aires y Gran Buenos Aires.
              </p>
            </div>
            <div className="mt-8 border-t border-border pt-4">
              <span className="label-xs text-muted-foreground block">Costo de envío</span>
              <span className="display text-lg mt-1 font-bold">{money(12900)}</span>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={350} duration={850} className="border border-border bg-card p-6 md:p-8 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-foreground">
                <Store className="h-6 w-6" />
              </div>
              <h3 className="display text-xl mt-6 font-bold">Retiro en Showroom</h3>
              <p className="label-xs mt-1 text-accent">Punto Oficial</p>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Retirá sin costo adicional en nuestro espacio de atención en Villa Crespo o San Nicolás de los Arroyos.
              </p>
            </div>
            <div className="mt-8 border-t border-border pt-4">
              <span className="label-xs text-muted-foreground block">Costo de envío</span>
              <span className="display text-lg mt-1 font-bold text-emerald-500">Sin cargo</span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Preguntas frecuentes de Envíos */}
      <section className="edge py-12">
        <ScrollReveal variant="slide-left" delay={100} duration={800}>
          <h2 className="display-md">Preguntas frecuentes</h2>
        </ScrollReveal>

        <div className="mt-8 max-w-3xl space-y-4">
          {[
            {
              q: "¿Cómo recibo el código de seguimiento de mi pedido?",
              a: "Una vez despachado el paquete, te enviamos un correo electrónico y mensaje automático con el código de seguimiento único para consultar el estado del envío en tiempo real.",
            },
            {
              q: "¿Qué sucede si no me encuentro en mi domicilio al momento de la entrega?",
              a: "El correo realiza dos visitas a tu domicilio. Si en la segunda visita no se puede concretar la entrega, el paquete queda guardado en la sucursal más cercana durante 5 días hábiles para que puedas retirarlo.",
            },
            {
              q: "¿Hacen envíos a todo el territorio argentino?",
              a: "Sí, despachamos a todas las provincias de Argentina sin excepción a través de alianzas con operadores logísticos de primer nivel.",
            },
            {
              q: "¿Puedo cambiar la dirección de entrega una vez confirmado el pedido?",
              a: "Si el pedido aún no fue despachado, comunicate de inmediato por WhatsApp con tu número de orden para actualizar la dirección sin inconvenientes.",
            },
          ].map((item, i) => (
            <ScrollReveal key={i} variant="fade-up" delay={i * 100} duration={750} className="border border-border bg-card p-6 rounded-2xl">
              <h4 className="font-bold text-sm sm:text-base flex items-center gap-3">
                <HelpCircle className="h-4 w-4 text-accent shrink-0" />
                {item.q}
              </h4>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed pl-7">
                {item.a}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Call to Action final */}
      <section className="edge py-16">
        <ScrollReveal variant="zoom-in" delay={150} duration={900} className="bg-cream p-8 md:p-12 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="display-md text-2xl sm:text-3xl">¿Listo para elegir tu próxima pieza?</h3>
            <p className="mt-2 text-sm text-muted-foreground">Explorá nuestro catálogo de riñoneras, bolsos y accesorios con envío a domicilio.</p>
          </div>
          <Link
            href="/catalogo"
            className="label-sm bg-foreground text-background px-8 py-4 rounded-full hover:bg-accent cursor-pointer transition-colors font-bold shrink-0 flex items-center gap-2"
          >
            Ver Colección <ArrowRight className="h-4 w-4" />
          </Link>
        </ScrollReveal>
      </section>
    </SiteLayout>
  );
}
