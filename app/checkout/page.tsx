"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Check } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useShop } from "@/store/shop";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/shop/ScrollReveal";
import { createClient } from "@/lib/supabase/client";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, lineProduct, subtotal, shipping, total, user, profile, setCartOpen } = useShop();

  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<"guest" | "user">("guest");
  const [step, setStep] = useState(1);

  // Form State
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [shippingMethod, setShippingMethod] = useState<"estandar" | "express" | "retiro">("estandar");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"MERCADO_PAGO" | "TRANSFER">("MERCADO_PAGO");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prellenar si hay usuario autenticado
  useEffect(() => {
    if (user) {
      setMode("user");
      setEmail(user.email ?? "");
      if (profile) {
        setName(profile.name ?? "");
        setPhone(profile.phone ?? "");
        setCity(profile.city ?? "");
        const addr = profile.address as { street?: string } | null;
        setStreet(addr?.street ?? "");
      }
    }
  }, [user, profile]);

  const handleCheckoutSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email || !name) {
      setError("Por favor completá tu email y nombre en el paso de contacto.");
      setStep(1);
      return;
    }

    if (cart.length === 0) {
      setError("El carrito está vacío.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Mapear slugs a IDs de producto de Supabase DB
      const slugs = Array.from(new Set(cart.map((l) => l.slug)));
      const { data: dbProducts, error: prodErr } = await supabase
        .from("products")
        .select("id, slug")
        .in("slug", slugs);

      if (prodErr || !dbProducts || dbProducts.length === 0) {
        throw new Error("No pudimos validar los productos del carrito con el servidor.");
      }

      const prodMap = new Map(dbProducts.map((p) => [p.slug, p.id]));

      const items = cart.map((line) => {
        const prodId = prodMap.get(line.slug);
        if (!prodId) throw new Error(`Producto ${line.slug} no disponible`);
        return {
          product_id: prodId,
          color: line.color || null,
          size: line.size || null,
          qty: line.qty,
        };
      });

      // 2. Enviar solicitud de Checkout a la API de backend
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          contact: { email, name, phone },
          shipping: {
            method: shippingMethod,
            address: { street, city, zip },
          },
          promo: appliedPromo,
          payment_method: paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Ocurrió un inconveniente al procesar la reserva.");
      }

      const { order_id, access_token } = data;

      // Limpiar carrito local
      try {
        localStorage.removeItem("nawea.shop.v1");
      } catch {
        /* ignore */
      }

      // 3. Procesar según método de pago elegido
      if (paymentMethod === "MERCADO_PAGO") {
        const prefRes = await fetch("/api/mercadopago/preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id, access_token }),
        });
        const prefData = await prefRes.json();

        if (prefRes.ok && prefData.init_point) {
          window.location.href = prefData.init_point;
          return;
        }

        // Fallback si la preferencia devuelve Sandbox o URL alternativa
        if (prefData.sandbox_init_point) {
          window.location.href = prefData.sandbox_init_point;
          return;
        }

        // Si no hay init_point activo de MP (modo dev sin token real), vamos a /success
        router.push(`/success?id=${order_id}&token=${access_token}`);
      } else {
        // Transferencia bancaria -> redirigir a /success con datos de alias
        router.push(`/success?id=${order_id}&token=${access_token}`);
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado al procesar el pedido.");
      setSubmitting(false);
    }
  };

  const calculateShippingCost = (method: string, currentSubtotal: number) => {
    if (method === "retiro") return 0;
    if (method === "express") return 12900;
    return currentSubtotal >= 120000 ? 0 : 7900;
  };

  const currentShippingCost = calculateShippingCost(shippingMethod, subtotal);
  const checkoutTotal = subtotal + currentShippingCost;

  return (
    <div className="min-h-dvh bg-background">
      <ScrollReveal variant="fade-down" delay={0} duration={800} className="edge flex h-16 items-center justify-between border-b border-border">
        <Link href="/" className="display text-[1.35rem]">
          NAWEA
        </Link>
        <span className="label-xs flex items-center gap-2 text-muted-foreground">
          <Lock className="h-3.5 w-3.5 text-accent" /> Checkout seguro
        </span>
      </ScrollReveal>

      <div className="mx-auto grid max-w-6xl gap-14 px-5 py-12 md:px-10 lg:grid-cols-[1.3fr_1fr] lg:gap-20 lg:py-20">
        {/* Formulario */}
        <div>
          <ScrollReveal variant="fade-up" delay={150} duration={850}>
            <h1 className="display-lg">Checkout</h1>
          </ScrollReveal>

          {error && (
            <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
              {error}
            </div>
          )}

          <ScrollReveal variant="fade-up" delay={200} duration={850} className="mt-8">
            <div className="flex items-center gap-6 border-b border-border pb-4">
              {[
                { step: 1, name: "Contacto" },
                { step: 2, name: "Envío" },
                { step: 3, name: "Pago" },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setStep(s.step)}
                  className={cn(
                    "label-xs transition-colors cursor-pointer hover:text-foreground",
                    step === s.step ? "text-foreground font-semibold" : "text-muted-foreground",
                  )}
                >
                  <span className="text-accent">0{s.step}</span> {s.name}
                </button>
              ))}
              {!user && (
                <Link
                  href="/auth/login?redirect=/checkout"
                  className="label-xs ml-auto cursor-pointer text-accent hover:underline"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>

            {/* PASO 1: CONTACTO */}
            {step === 1 && (
              <div className="mt-8 space-y-6">
                <div>
                  <span className="label-xs text-muted-foreground">Email de contacto</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="mt-2 w-full border-b border-input bg-transparent py-3 text-sm outline-none focus:border-foreground"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <span className="label-xs text-muted-foreground">Nombre completo</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="María Pérez"
                      required
                      className="mt-2 w-full border-b border-input bg-transparent py-3 text-sm outline-none focus:border-foreground"
                    />
                  </div>

                  <div>
                    <span className="label-xs text-muted-foreground">Teléfono</span>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+54 9 11 0000 0000"
                      className="mt-2 w-full border-b border-input bg-transparent py-3 text-sm outline-none focus:border-foreground"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="label-sm mt-8 w-full cursor-pointer rounded-full bg-foreground py-4 text-background transition-colors hover:bg-accent"
                >
                  Continuar a datos de envío →
                </button>
              </div>
            )}

            {/* PASO 2: ENVÍO */}
            {step === 2 && (
              <div className="mt-8 space-y-6">
                <div>
                  <span className="label-xs text-muted-foreground">Dirección de calle y altura</span>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Av. Córdoba 1234, 4B"
                    className="mt-2 w-full border-b border-input bg-transparent py-3 text-sm outline-none focus:border-foreground"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <span className="label-xs text-muted-foreground">Ciudad</span>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="CABA"
                      className="mt-2 w-full border-b border-input bg-transparent py-3 text-sm outline-none focus:border-foreground"
                    />
                  </div>

                  <div>
                    <span className="label-xs text-muted-foreground">Código Postal</span>
                    <input
                      type="text"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      placeholder="C1414"
                      className="mt-2 w-full border-b border-input bg-transparent py-3 text-sm outline-none focus:border-foreground"
                    />
                  </div>
                </div>

                <div className="grid gap-3 pt-4">
                  {[
                    {
                      id: "estandar",
                      title: "Envío estándar a domicilio",
                      desc: "3 a 5 días hábiles a todo el país",
                      cost: subtotal >= 120000 ? "Gratis" : money(7900),
                    },
                    {
                      id: "express",
                      title: "Envío express prioritario",
                      desc: "Despacho en 24 h",
                      cost: money(12900),
                    },
                    {
                      id: "retiro",
                      title: "Retiro sin cargo",
                      desc: "San Nicolás / Villa Crespo",
                      cost: "Gratis",
                    },
                  ].map((m) => (
                    <label
                      key={m.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between border px-5 py-4 transition-colors rounded-3xl",
                        shippingMethod === m.id
                          ? "border-foreground bg-cream/40"
                          : "border-border hover:border-foreground",
                      )}
                    >
                      <span className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="shipMethod"
                          checked={shippingMethod === m.id}
                          onChange={() => setShippingMethod(m.id as any)}
                        />
                        <span>
                          <span className="block text-sm font-medium">{m.title}</span>
                          <span className="label-xs text-muted-foreground">{m.desc}</span>
                        </span>
                      </span>
                      <span className="text-sm tabular-nums font-semibold">{m.cost}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="label-xs rounded-full border border-border px-6 py-4 transition-colors hover:border-foreground cursor-pointer"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="label-sm flex-1 cursor-pointer rounded-full bg-foreground py-4 text-background transition-colors hover:bg-accent"
                  >
                    Continuar al pago →
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: PAGO */}
            {step === 3 && (
              <div className="mt-8 space-y-6">
                <div className="grid gap-3">
                  <label
                    className={cn(
                      "flex cursor-pointer items-center justify-between border px-6 py-5 transition-colors rounded-3xl",
                      paymentMethod === "MERCADO_PAGO"
                        ? "border-foreground bg-cream/40"
                        : "border-border hover:border-foreground",
                    )}
                  >
                    <span className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === "MERCADO_PAGO"}
                        onChange={() => setPaymentMethod("MERCADO_PAGO")}
                      />
                      <span>
                        <span className="block text-sm font-medium">Mercado Pago</span>
                        <span className="label-xs text-muted-foreground">
                          Tarjetas de crédito/débito, cuotas o saldo en Mercado Pago.
                        </span>
                      </span>
                    </span>
                  </label>

                  <label
                    className={cn(
                      "flex cursor-pointer items-center justify-between border px-6 py-5 transition-colors rounded-3xl",
                      paymentMethod === "TRANSFER"
                        ? "border-foreground bg-cream/40"
                        : "border-border hover:border-foreground",
                    )}
                  >
                    <span className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === "TRANSFER"}
                        onChange={() => setPaymentMethod("TRANSFER")}
                      />
                      <span>
                        <span className="block text-sm font-medium">Transferencia Bancaria</span>
                        <span className="label-xs text-muted-foreground">
                          Obtené los datos de CBU / Alias al confirmar el pedido.
                        </span>
                      </span>
                    </span>
                  </label>
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="label-xs rounded-full border border-border px-6 py-4 transition-colors hover:border-foreground cursor-pointer"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleCheckoutSubmit()}
                    className="label-sm flex-1 cursor-pointer rounded-full bg-foreground py-4 text-background transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    {submitting ? "Procesando pedido..." : `Finalizar Pedido · ${money(checkoutTotal)}`}
                  </button>
                </div>
              </div>
            )}
          </ScrollReveal>
        </div>

        {/* Resumen del Carrito */}
        <aside className="lg:sticky lg:top-12 lg:self-start">
          <ScrollReveal variant="slide-right" delay={300} duration={950} className="bg-cream p-6 md:p-8 rounded-3xl border border-border">
            <p className="label-xs text-muted-foreground">Tu pedido</p>
            {cart.length === 0 ? (
              <div className="py-10">
                <p className="display-md">Carrito vacío</p>
                <Link href="/catalogo" className="label-xs mt-4 inline-block border-b border-foreground">
                  Elegir piezas
                </Link>
              </div>
            ) : (
              <>
                <ul className="mt-6 space-y-5">
                  {cart.map((l) => {
                    const p = lineProduct(l);
                    if (!p) return null;
                    return (
                      <li key={l.key} className="flex gap-4">
                        <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-background rounded-lg">
                          <img
                            src={p.image}
                            alt={p.name}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center bg-foreground text-[10px] text-background rounded-full font-bold">
                            {l.qty}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          <p className="label-xs mt-1 text-muted-foreground">
                            {l.color} · {l.size}
                          </p>
                        </div>
                        <span className="text-sm tabular-nums font-semibold">{money(p.price * l.qty)}</span>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-8 flex gap-2 border-t border-border pt-6">
                  <input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Código de cupón (ej. NAWEA10)"
                    className="w-full border-b border-input bg-transparent py-2 text-xs outline-none focus:border-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!promoCode.trim()) {
                        toast.error("Ingresá un código de cupón");
                      } else {
                        const clean = promoCode.trim().toUpperCase();
                        setAppliedPromo(clean);
                        toast.success(`Cupón ${clean} aplicado con éxito`);
                      }
                    }}
                    className="label-xs shrink-0 cursor-pointer text-accent hover:underline font-bold"
                  >
                    {appliedPromo === promoCode.trim().toUpperCase() && promoCode.trim() ? "Aplicado ✓" : "Aplicar"}
                  </button>
                </div>

                <dl className="mt-6 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="tabular-nums">{money(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Envío</dt>
                    <dd className="tabular-nums">
                      {currentShippingCost === 0 ? "Gratis" : money(currentShippingCost)}
                    </dd>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-border pt-3 text-base">
                    <dt className="label-sm">Total</dt>
                    <dd className="tabular-nums font-bold">{money(checkoutTotal)}</dd>
                  </div>
                </dl>
              </>
            )}
          </ScrollReveal>
        </aside>
      </div>
    </div>
  );
}
