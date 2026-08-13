"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Check, Clock, AlertCircle, Copy, CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/shop/SiteLayout";
import { ScrollReveal } from "@/components/shop/ScrollReveal";
import { money, shortDate } from "@/lib/format";

type OrderData = {
  id: string;
  number: string;
  email: string;
  name: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  shipping_method: string;
  shipping_address: any;
  order_status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  items: Array<{
    id: string;
    name: string;
    color: string | null;
    size: string | null;
    qty: number;
    unit_price: number;
    subtotal: number;
  }>;
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const token = searchParams.get("token");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id || !token) {
      setError("Faltan datos de identificación del pedido.");
      setLoading(false);
      return;
    }

    let intervalId: any;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}?token=${token}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setOrder(data.order);
          setError(null);

          // Si el pedido deja de estar PENDING, dejamos de consultar
          if (data.order.order_status !== "PENDING") {
            clearInterval(intervalId);
          }
        } else {
          setError(data.error || "No pudimos cargar la información del pedido.");
        }
      } catch (err: any) {
        setError(err.message || "Error al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    intervalId = setInterval(fetchOrder, 3000);

    return () => clearInterval(intervalId);
  }, [id, token]);

  const copyAlias = () => {
    navigator.clipboard.writeText("NAWEA.OFICIAL.MP");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <SiteLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Verificando estado del pedido...</p>
        </div>
      </SiteLayout>
    );
  }

  if (error || !order) {
    return (
      <SiteLayout>
        <section className="edge flex min-h-[70vh] flex-col items-center justify-center text-center py-20">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <h1 className="display-lg">Error al cargar la orden</h1>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            {error || "No encontramos los detalles de esta compra."}
          </p>
          <Link
            href="/"
            className="label-sm mt-8 rounded-full bg-foreground px-8 py-4 text-background transition-colors hover:bg-accent cursor-pointer"
          >
            Volver a NAWEA
          </Link>
        </section>
      </SiteLayout>
    );
  }

  const isApproved = order.payment_status === "APPROVED" && order.order_status !== "CANCELLED";
  const isRejected = order.payment_status === "REJECTED" || order.order_status === "CANCELLED";
  const isTransfer = order.payment_method === "TRANSFER" && order.payment_status === "PENDING";
  const isPendingMP = order.payment_method === "MERCADO_PAGO" && order.payment_status === "PENDING";

  return (
    <SiteLayout>
      <section className="edge max-w-3xl mx-auto py-16">
        <ScrollReveal variant="zoom-in" delay={100} duration={850} className="text-center">
          {isApproved && (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Check className="h-8 w-8" />
            </div>
          )}

          {isPendingMP && (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Clock className="h-8 w-8 animate-pulse" />
            </div>
          )}

          {isTransfer && (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-background">
              <Check className="h-8 w-8" />
            </div>
          )}

          {isRejected && (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
              <AlertCircle className="h-8 w-8" />
            </div>
          )}

          <p className="label-xs mt-6 text-accent">Orden {order.number}</p>

          <h1 className="display-xl mt-2">
            {isApproved && "¡Gracias por tu compra!"}
            {isPendingMP && "Procesando pago..."}
            {isTransfer && "¡Pedido registrado!"}
            {isRejected && "Pago no completado"}
          </h1>

          <p className="mt-3 text-sm text-muted-foreground">
            {isApproved && `Hemos confirmado tu pago y ya estamos preparando tu paquete.`}
            {isPendingMP && `Estamos aguardando la notificación de confirmación de Mercado Pago.`}
            {isTransfer && `Realizá la transferencia bancaria para que podamos confirmar tu pedido.`}
            {isRejected && `El pago no pudo procesarse o la reserva de stock ha expirado.`}
          </p>
        </ScrollReveal>

        {/* Bloque de Transferencia Bancaria */}
        {isTransfer && (
          <ScrollReveal variant="fade-up" delay={250} duration={850} className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-8">
            <h2 className="display-md text-xl">Datos para la Transferencia</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Tenés 20 minutos de reserva para transferir el monto total de{" "}
              <strong className="text-foreground">{money(order.total)}</strong>.
            </p>

            <div className="mt-6 space-y-4 text-sm border-t border-border pt-4">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="label-xs text-muted-foreground">Alias MP:</span>
                <div className="flex items-center gap-2 font-mono font-semibold">
                  <span>NAWEA.OFICIAL.MP</span>
                  <button
                    type="button"
                    onClick={copyAlias}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Copiar Alias"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="label-xs text-muted-foreground">CBU:</span>
                <span className="font-mono">0000003100012345678901</span>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="label-xs text-muted-foreground">Titular:</span>
                <span>NAWEA S.A.S.</span>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="label-xs text-muted-foreground">Banco / Entidad:</span>
                <span>Mercado Pago</span>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-400">
              💡 Una vez realizada la transferencia, enviá el comprobante adjuntando el número de orden <strong className="underline">{order.number}</strong> a nuestro WhatsApp de atención.
            </div>
          </ScrollReveal>
        )}

        {/* Resumen del pedido */}
        <ScrollReveal variant="fade-up" delay={350} duration={850} className="mt-10 rounded-2xl border border-border p-6 md:p-8">
          <div className="flex justify-between items-baseline border-b border-border pb-4">
            <h2 className="display-md text-lg">Resumen del pedido</h2>
            <span className="label-xs text-muted-foreground">{shortDate(order.created_at)}</span>
          </div>

          <div className="mt-6 divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.id} className="py-4 flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.qty}× {money(item.unit_price)} {item.color ? `· ${item.color}` : ""} {item.size ? `· ${item.size}` : ""}
                  </p>
                </div>
                <span className="tabular-nums font-semibold">{money(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-border pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{money(order.subtotal)}</span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>Envío ({order.shipping_method})</span>
              <span className="tabular-nums">{order.shipping_cost === 0 ? "Gratis" : money(order.shipping_cost)}</span>
            </div>

            <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
              <span>Total</span>
              <span className="tabular-nums">{money(order.total)}</span>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="slide-left" delay={450} duration={800} className="mt-10 text-center">
          <Link
            href="/"
            className="label-sm inline-block rounded-full bg-foreground px-8 py-4 text-background transition-colors hover:bg-accent cursor-pointer"
          >
            Volver a la tienda
          </Link>
        </ScrollReveal>
      </section>
    </SiteLayout>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center">Cargando...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
