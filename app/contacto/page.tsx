"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/shop/SiteLayout";
import { ScrollReveal } from "@/components/shop/ScrollReveal";

export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.011 1.985c-5.52 0-9.999 4.479-9.999 10 0 1.764.461 3.486 1.336 5.006L2 22l5.127-1.344c1.472.802 3.136 1.226 4.884 1.226 5.522 0 10.002-4.479 10.002-10 0-5.521-4.48-10-10.002-10zm5.82 14.184c-.244.685-1.42 1.31-2.001 1.394-.504.075-1.144.106-1.846-.118-.425-.136-.971-.317-1.67-.62-2.937-1.268-4.854-4.234-5.001-4.429-.146-.195-1.196-1.59-1.196-3.033 0-1.443.757-2.152 1.026-2.445.27-.293.585-.366.781-.366.195 0 .39.002.561.01.177.009.421-.067.66.505.244.585.83 2.023.903 2.17.073.146.122.341.024.536-.098.195-.146.317-.293.488-.146.171-.307.382-.439.512-.146.146-.298.305-.128.597.17.292.756 1.246 1.624 2.019 1.117.994 2.059 1.302 2.352 1.448.293.146.463.122.634-.073.171-.195.732-.854.927-1.146.195-.293.39-.244.658-.146.268.098 1.707.805 2.001.951.293.146.488.22.561.341.073.122.073.707-.171 1.392z" />
    </svg>
  );
}

export default function ContactoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Por favor completá los campos obligatorios");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Mensaje enviado con éxito", {
        description: "Te responderemos a la brevedad.",
      });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    }, 800);
  };

  return (
    <SiteLayout>
      {/* Header de la página */}
      <section className="edge pb-10 pt-16 md:pt-24">
        <ScrollReveal variant="slide-left" delay={100} duration={850}>
          <span className="label-xs text-accent font-bold">Comunicación & Atención</span>
        </ScrollReveal>
        <ScrollReveal variant="fade-up" delay={200} duration={1000}>
          <h1 className="display-xl mt-3">Contacto</h1>
        </ScrollReveal>
        <ScrollReveal variant="fade-up" delay={300} duration={900}>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            ¿Tenés alguna consulta sobre un modelo, tu pedido o querés comunicarte con nuestro equipo? Escribinos directamente o enviános un mensaje a través del formulario.
          </p>
        </ScrollReveal>
      </section>

      {/* Secciones de contacto + Formulario */}
      <section className="edge py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          
          {/* Informacion de Contacto Directo */}
          <div className="space-y-6">
            <ScrollReveal variant="slide-left" delay={150} duration={850}>
              <h2 className="display-md text-2xl">Canales directos</h2>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={200} duration={800} className="border border-border bg-card p-6 rounded-2xl flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-foreground">
                <WhatsAppIcon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">WhatsApp Oficial</h4>
                <p className="text-xs text-muted-foreground mt-1">Atención rápida de Lun a Vie de 9 a 18 hs.</p>
                <a
                  href="https://wa.me/?text=Hola%20NAWEA,%20tengo%20una%20consulta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label-xs mt-3 inline-block text-accent font-bold hover:underline"
                >
                  Enviar WhatsApp →
                </a>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={300} duration={800} className="border border-border bg-card p-6 rounded-2xl flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-foreground">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Correo Electrónico</h4>
                <p className="text-xs text-muted-foreground mt-1">Respuesta garantizada en menos de 24 hs hábiles.</p>
                <a href="mailto:hola@nawea.com.ar" className="label-xs mt-3 inline-block text-foreground font-bold hover:underline">
                  hola@nawea.com.ar
                </a>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={400} duration={800} className="border border-border bg-card p-6 rounded-2xl flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-foreground">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Atelier & Origen</h4>
                <p className="text-xs text-muted-foreground mt-1">San Nicolás de los Arroyos, Buenos Aires, Argentina.</p>
              </div>
            </ScrollReveal>
          </div>

          {/* Formulario de Mensaje */}
          <ScrollReveal variant="fade-up" delay={250} duration={900} className="border border-border bg-card p-6 md:p-10 rounded-3xl">
            <h3 className="display-md text-2xl">Envianos un mensaje</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-6">Completá el formulario a continuación y te responderemos a la brevedad.</p>

            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <CheckCircle className="h-7 w-7" />
                </div>
                <h4 className="display text-xl font-bold">¡Mensaje enviado!</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Gracias por escribirnos. Nuestro equipo revisará tu consulta y te responderá por email.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="label-xs mt-4 inline-block border-b border-foreground pb-0.5 cursor-pointer font-bold"
                >
                  Enviar otra consulta
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="label-xs text-muted-foreground block mb-2">Nombre completo *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Malena Ríos"
                      required
                      className="w-full border-b border-input bg-transparent py-2.5 text-sm outline-none focus:border-foreground"
                    />
                  </div>

                  <div>
                    <label className="label-xs text-muted-foreground block mb-2">Correo electrónico *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="w-full border-b border-input bg-transparent py-2.5 text-sm outline-none focus:border-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-xs text-muted-foreground block mb-2">Asunto / Motivo</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Consulta sobre envíos, modelos, etc."
                    className="w-full border-b border-input bg-transparent py-2.5 text-sm outline-none focus:border-foreground"
                  />
                </div>

                <div>
                  <label className="label-xs text-muted-foreground block mb-2">Mensaje *</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribí tu consulta acá..."
                    required
                    className="w-full border border-input rounded-2xl bg-transparent p-4 text-sm outline-none focus:border-foreground"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="label-sm w-full bg-foreground text-background py-4 rounded-full hover:bg-accent cursor-pointer disabled:opacity-50 font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? "Enviando..." : "Enviar Mensaje"} <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </ScrollReveal>
        </div>
      </section>
    </SiteLayout>
  );
}
