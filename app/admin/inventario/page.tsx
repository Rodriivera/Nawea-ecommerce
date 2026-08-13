"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { Search, X, Boxes, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import { AdminPage, Stat } from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { adjustStockAction } from "@/lib/admin-actions";

type DbProduct = {
  id: string;
  code: string;
  name: string;
  sku: string;
  stock: number;
  reserved: number;
  min_stock: number;
};

type MovementRow = {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  created_at: string;
  products: { name: string; sku: string } | null;
};

function state(stock: number, min: number) {
  if (stock === 0) return "AGOTADO";
  if (stock <= min) return "STOCK BAJO";
  return "OK";
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Form de ajuste de stock
  const [selectedProduct, setSelectedProduct] = useState<DbProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [type, setType] = useState<"IN" | "RETURN" | "ADJUST">("IN");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  const loadInventory = async () => {
    setLoading(true);

    const { data: prods } = await supabase
      .from("products")
      .select("id, code, name, sku, stock, reserved, min_stock")
      .order("name", { ascending: true });

    if (prods) setProducts(prods as DbProduct[]);

    const { data: movs } = await supabase
      .from("inventory_movements")
      .select("id, type, quantity, reason, created_at, products(name, sku)")
      .order("created_at", { ascending: false })
      .limit(30);

    if (movs) setMovements(movs as unknown as MovementRow[]);

    setLoading(false);
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setError(null);
    startTransition(async () => {
      try {
        const qtyToPass = type === "ADJUST" && quantity < 0 ? quantity : Math.abs(quantity);
        await adjustStockAction(selectedProduct.id, qtyToPass, type, reason || "Ajuste de stock desde panel");
        toast.success(`Stock de "${selectedProduct.name}" actualizado`, {
          description: `Movimiento: ${type} ${qtyToPass > 0 ? `+${qtyToPass}` : qtyToPass} u.`,
        });
        setSelectedProduct(null);
        setReason("");
        setQuantity(1);
        await loadInventory();
      } catch (err: any) {
        setError(err.message || "Error al realizar el ajuste");
        toast.error("Error al ajustar stock", { description: err.message });
      }
    });
  };

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query),
    );
  }, [products, searchQuery]);

  const low = products.filter((p) => p.stock > 0 && p.stock <= p.min_stock);
  const out = products.filter((p) => p.stock === 0);
  const totalUnits = products.reduce((n, p) => n + p.stock, 0);

  return (
    <AdminPage title="Inventario" subtitle="Control de stock y trazabilidad de movimientos">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Unidades en depósito" value={String(totalUnits)} />
        <Stat label="Stock bajo" value={String(low.length)} hint="requieren reposición" />
        <Stat label="Agotados" value={String(out.length)} hint="sin unidades" />
      </div>

      {/* Buscador de Inventario */}
      <div className="mt-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, SKU o código..."
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
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Cargando inventario...</div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[2.2fr_1fr]">
          
          {/* TABLA DE PRODUCTOS CON SCROLL Y HEADER PEGAJOSO */}
          <div className="max-h-[550px] overflow-y-auto overflow-x-auto border border-border bg-card rounded-2xl shadow-sm">
            <table className="w-full min-w-[650px] text-sm border-collapse">
              <thead className="sticky top-0 bg-card z-10 border-b border-border shadow-xs">
                <tr>
                  {["Producto", "SKU", "Stock", "Reservado", "Estado", "Acción"].map((h) => (
                    <th key={h} className="label-xs px-4 py-3.5 text-left text-muted-foreground bg-card">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const s = state(p.stock, p.min_stock);
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-cream/70 transition-colors">
                      <td className="px-4 py-4 font-semibold">{p.name}</td>
                      <td className="px-4 py-4 text-xs font-mono text-muted-foreground">{p.sku}</td>
                      <td className="px-4 py-4 tabular-nums font-semibold">{p.stock}</td>
                      <td className="px-4 py-4 tabular-nums text-muted-foreground">{p.reserved}</td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "label-xs border px-2.5 py-1 rounded-full font-bold",
                            s === "AGOTADO" && "border-red-500/30 bg-red-500/10 text-red-400",
                            s === "STOCK BAJO" && "border-amber-500/30 bg-amber-500/10 text-amber-400",
                            s === "OK" && "border-border text-muted-foreground",
                          )}
                        >
                          {s}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(p)}
                          className="label-xs cursor-pointer rounded-full border border-foreground px-4 py-1.5 text-foreground hover:bg-foreground hover:text-background transition-colors font-medium"
                        >
                          Ajustar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* HISTORIAL DE MOVIMIENTOS SCROLLABLE */}
          <div className="border border-border bg-card p-5 rounded-2xl shadow-sm max-h-[550px] overflow-y-auto">
            <p className="label-xs text-muted-foreground font-bold">Últimos movimientos de stock</p>
            <ul className="mt-4 divide-y divide-border">
              {movements.map((m) => (
                <li key={m.id} className="py-3 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="truncate pr-2">{m.products?.name || "Producto"}</span>
                    <span
                      className={cn(
                        "tabular-nums font-bold shrink-0",
                        m.quantity > 0 ? "text-emerald-500" : "text-red-400",
                      )}
                    >
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity} u.
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-muted-foreground text-[11px]">
                    <span className="truncate pr-2">{m.type} · {m.reason || "Sin motivo"}</span>
                    <span className="shrink-0">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* MODAL DE AJUSTE */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card p-6 md:p-8 border border-border rounded-3xl shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-border pb-3">
              <div>
                <span className="label-xs text-accent">Ajuste de Inventario</span>
                <h2 className="display-md text-xl mt-0.5">{selectedProduct.name}</h2>
                <p className="text-xs text-muted-foreground">Stock actual: {selectedProduct.stock} unidades</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="label-xs text-muted-foreground block mb-1">Tipo de movimiento</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full border-b border-input bg-transparent py-2 text-sm outline-none cursor-pointer focus:border-foreground font-semibold"
                >
                  <option value="IN">IN — Ingreso / Reposición (+)</option>
                  <option value="RETURN">RETURN — Devolución (+)</option>
                  <option value="ADJUST">ADJUST — Ajuste manual (Ingresá pos. o neg.)</option>
                </select>
              </div>

              <div>
                <label className="label-xs text-muted-foreground block mb-1">Cantidad</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                  className="w-full border-b border-input bg-transparent py-2 text-sm outline-none font-bold focus:border-foreground"
                />
              </div>

              <div>
                <label className="label-xs text-muted-foreground block mb-1">Motivo / Observaciones</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Reposición de taller / Recuento físico"
                  required
                  className="w-full border-b border-input bg-transparent py-2 text-sm outline-none focus:border-foreground"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="label-xs flex-1 border border-border py-3 rounded-full hover:border-foreground cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="label-sm flex-1 bg-foreground text-background py-3 rounded-full hover:bg-accent cursor-pointer disabled:opacity-50 font-bold transition-colors"
                >
                  {isPending ? "Guardando..." : "Confirmar Ajuste"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
