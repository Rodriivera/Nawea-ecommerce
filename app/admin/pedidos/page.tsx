"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { Search, Filter, X, CheckCircle, Clock, Truck, Check, AlertCircle } from "lucide-react";
import { AdminPage, StatusPill } from "@/components/admin/AdminUI";
import { money, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { updateOrderStatusAction, confirmManualPaymentAction } from "@/lib/admin-actions";

const FILTERS = ["TODOS", "PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_DISPLAY: Record<string, string> = {
  TODOS: "Todos",
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PREPARING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const PAYMENT_STATUS_DISPLAY: Record<string, string> = {
  PENDING: "Pago pendiente",
  APPROVED: "Pago aprobado",
  REJECTED: "Pago rechazado",
  REFUNDED: "Reembolsado",
};

type OrderRow = {
  id: string;
  number: string;
  customer_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  shipping_address: any;
  shipping_method: string;
  shipping_cost: number;
  subtotal: number;
  discount: number;
  total: number;
  order_status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  order_items: Array<{
    id: string;
    name: string;
    color: string | null;
    size: string | null;
    qty: number;
    unit_price: number;
    subtotal: number;
  }>;
};

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState("TODOS");
  const [paymentFilter, setPaymentFilter] = useState("TODOS");
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  const loadOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as unknown as OrderRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    setActionError(null);
    startTransition(async () => {
      try {
        await updateOrderStatusAction(orderId, newStatus);
        toast.success("Estado del pedido actualizado", { description: `Nuevo estado: ${newStatus}` });
        await loadOrders();
        if (selected && selected.id === orderId) {
          setSelected((prev) => (prev ? { ...prev, order_status: newStatus } : null));
        }
      } catch (err: any) {
        setActionError(err.message || "Error al actualizar estado");
        toast.error("Error al actualizar pedido", { description: err.message });
      }
    });
  };

  const handleConfirmTransfer = (orderId: string) => {
    setActionError(null);
    startTransition(async () => {
      try {
        await confirmManualPaymentAction(orderId);
        toast.success("Pago por transferencia verificado correctamente");
        await loadOrders();
        if (selected && selected.id === orderId) {
          setSelected((prev) =>
            prev ? { ...prev, payment_status: "APPROVED", order_status: "CONFIRMED" } : null,
          );
        }
      } catch (err: any) {
        setActionError(err.message || "Error al confirmar transferencia");
        toast.error("Error al confirmar pago", { description: err.message });
      }
    });
  };

  // Filtrado optimizado de pedidos (Búsqueda + Estado + Método de Pago)
  const list = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = filter === "TODOS" || o.order_status === filter;
      const matchPayment = paymentFilter === "TODOS" || o.payment_method === paymentFilter;

      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        o.number.toLowerCase().includes(query) ||
        o.name.toLowerCase().includes(query) ||
        o.email.toLowerCase().includes(query) ||
        (o.phone && o.phone.toLowerCase().includes(query));

      return matchStatus && matchPayment && matchSearch;
    });
  }, [orders, filter, paymentFilter, searchQuery]);

  return (
    <AdminPage title="Pedidos" subtitle={`${list.length} de ${orders.length} pedidos encontrados`}>
      {actionError && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400">
          {actionError}
        </div>
      )}

      {/* 1. BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por N° de orden, cliente, email o teléfono..."
              className="w-full rounded-full border border-border bg-card pl-11 pr-10 py-2.5 text-sm outline-none focus:border-foreground transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="label-xs rounded-full border border-border bg-card px-4 py-2.5 outline-none focus:border-foreground cursor-pointer"
            >
              <option value="TODOS">Todos los Métodos de Pago</option>
              <option value="MERCADO_PAGO">Mercado Pago</option>
              <option value="TRANSFER">Transferencia</option>
            </select>
          </div>
        </div>

        {/* Pestañas por Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-2xl bg-card border border-border no-scrollbar w-full">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "label-xs px-3.5 py-1.5 sm:px-4 sm:py-2 transition-all rounded-xl shrink-0 cursor-pointer text-xs font-semibold",
                filter === f ? "bg-foreground text-background font-bold shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {STATUS_DISPLAY[f] || f}
            </button>
          ))}
        </div>
      </div>

      {/* 2. TABLA CON SCROLL VERTICAL Y HEADER FIJO (NO DESFASA LA INTERFAZ) */}
      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Cargando pedidos...</div>
      ) : list.length === 0 ? (
        <div className="py-12 text-center border border-border bg-card rounded-2xl text-sm text-muted-foreground">
          No se encontraron pedidos con los filtros aplicados.
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto overflow-x-auto border border-border bg-card rounded-2xl shadow-sm">
          <table className="w-full min-w-[760px] text-sm border-collapse">
            <thead className="sticky top-0 bg-card z-10 border-b border-border shadow-xs">
              <tr>
                {["Pedido", "Cliente", "Fecha", "Método", "Total", "Estado"].map((h) => (
                  <th key={h} className="label-xs px-4 py-3.5 text-left text-muted-foreground bg-card">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((o) => {
                const isSelected = selected?.id === o.id;
                return (
                  <tr
                    key={o.id}
                    onClick={() => setSelected(o)}
                    className={cn(
                      "cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-cream/70",
                      isSelected && "bg-cream/90 font-medium",
                    )}
                  >
                    <td className="px-4 py-4 tabular-nums font-semibold flex items-center gap-2">
                      {o.number}
                      {isSelected && <CheckCircle className="h-3.5 w-3.5 text-foreground inline" />}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-medium">{o.name}</span>
                      <span className="block text-xs text-muted-foreground">{o.email}</span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-xs">{shortDate(o.created_at)}</td>
                    <td className="px-4 py-4 text-xs font-semibold text-muted-foreground">{o.payment_method}</td>
                    <td className="px-4 py-4 tabular-nums font-bold text-foreground">{money(o.total)}</td>
                    <td className="px-4 py-4">
                      <StatusPill status={o.order_status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. MODAL DETALLE DE PEDIDO */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-card border border-border p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl space-y-6">
            
            {/* Header del Modal */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <span className="label-xs text-accent">Edición y Detalle del Pedido</span>
                <h2 className="display-md text-3xl mt-1">{selected.number}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-2 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Datos del Cliente y Envío */}
            <div className="grid gap-6 md:grid-cols-3 bg-cream/40 p-4 rounded-2xl border border-border text-sm">
              <div>
                <p className="label-xs text-muted-foreground">Cliente</p>
                <p className="mt-1 font-semibold">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{selected.email}</p>
                <p className="text-xs text-muted-foreground">{selected.phone || "Sin teléfono"}</p>
              </div>
              <div>
                <p className="label-xs text-muted-foreground">Envío y Pago</p>
                <p className="mt-1 font-medium">{selected.payment_method}</p>
                <p className="text-xs text-muted-foreground">
                  Método: {selected.shipping_method} ({money(selected.shipping_cost)})
                </p>
                <p className="text-xs text-muted-foreground">Fecha: {shortDate(selected.created_at)}</p>
              </div>
              <div>
                <p className="label-xs text-muted-foreground">Estado Actual</p>
                <div className="mt-2 flex items-center gap-2">
                  <StatusPill status={selected.order_status} />
                  <span className="text-xs text-muted-foreground font-semibold">({PAYMENT_STATUS_DISPLAY[selected.payment_status] || selected.payment_status})</span>
                </div>
              </div>
            </div>

            {/* Panel de Controles / Acciones */}
            <div className="border border-border p-4 rounded-2xl bg-card space-y-4">
              <span className="label-xs text-muted-foreground block font-semibold">Acciones del Administrador:</span>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="label-xs text-muted-foreground font-semibold">Cambiar Estado:</span>
                  <select
                    value={selected.order_status}
                    disabled={isPending}
                    onChange={(e) => handleUpdateStatus(selected.id, e.target.value)}
                    className="label-xs rounded-full border border-foreground bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-foreground cursor-pointer disabled:opacity-50 font-bold"
                  >
                    <option value="PENDING">Pendiente de pago</option>
                    <option value="CONFIRMED">Confirmado</option>
                    <option value="PREPARING">En preparación</option>
                    <option value="SHIPPED">Enviado</option>
                    <option value="DELIVERED">Entregado</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>

                {selected.payment_method === "TRANSFER" && selected.payment_status === "PENDING" && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleConfirmTransfer(selected.id)}
                    className="label-xs rounded-full bg-emerald-600 px-5 py-2.5 text-white hover:bg-emerald-700 cursor-pointer disabled:opacity-50 font-semibold transition-colors"
                  >
                    ✓ Confirmar Transferencia Bancaria
                  </button>
                )}

                {selected.order_status !== "CANCELLED" && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      if (confirm(`¿Estás seguro de cancelar la orden ${selected.number}? El stock será restaurado.`)) {
                        handleUpdateStatus(selected.id, "CANCELLED");
                      }
                    }}
                    className="label-xs rounded-full border border-red-500/30 bg-red-500/10 text-red-400 px-5 py-2.5 hover:bg-red-500/20 cursor-pointer disabled:opacity-50 font-semibold transition-colors ml-auto"
                  >
                    Cancelar Pedido
                  </button>
                )}
              </div>
            </div>

            {/* Ítems del Pedido */}
            <div>
              <p className="label-xs text-muted-foreground mb-2">Ítems comprados</p>
              <ul className="divide-y divide-border border-t border-border">
                {selected.order_items?.map((i) => (
                  <li key={i.id} className="py-3 flex justify-between items-center text-sm">
                    <span>
                      <strong className="font-semibold">{i.qty}×</strong> {i.name} {i.color ? `(${i.color})` : ""} {i.size ? `[${i.size}]` : ""}
                    </span>
                    <span className="tabular-nums font-semibold">{money(i.subtotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between text-base font-bold border-t border-border pt-3">
                <span>Total del pedido</span>
                <span className="tabular-nums text-lg">{money(selected.total)}</span>
              </div>
            </div>

            {/* Botón Inferior para Cerrar */}
            <div className="pt-2 flex justify-end border-t border-border">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="label-sm rounded-full bg-foreground px-6 py-3 text-background hover:bg-accent transition-colors cursor-pointer"
              >
                Listo / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
