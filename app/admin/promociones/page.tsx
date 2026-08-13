"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { Plus, X, Edit3, Trash2, Search, CheckCircle, AlertCircle, Tag } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils";
import { money } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { savePromoAction, deletePromoAction } from "@/lib/admin-actions";

type PromoRow = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minimum_amount: number;
  max_discount: number | null;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  uses: number;
  active: boolean;
};

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoRow | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED" | "FREE_SHIPPING">("PERCENTAGE");
  const [value, setValue] = useState<number>(10);
  const [minimumAmount, setMinimumAmount] = useState<number>(0);
  const [maxDiscount, setMaxDiscount] = useState<string>("");
  const [usageLimit, setUsageLimit] = useState<string>("500");
  const [active, setActive] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  const loadPromos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("promos")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setPromos(data as PromoRow[]);
    setLoading(false);
  };

  useEffect(() => {
    loadPromos();
  }, []);

  const openNewForm = () => {
    setEditingPromo(null);
    setCode("");
    setType("PERCENTAGE");
    setValue(10);
    setMinimumAmount(0);
    setMaxDiscount("");
    setUsageLimit("500");
    setActive(true);
    setError(null);
    setShowForm(true);
  };

  const openEditForm = (promo: PromoRow) => {
    setEditingPromo(promo);
    setCode(promo.code);
    setType(promo.type);
    setValue(promo.value);
    setMinimumAmount(promo.minimum_amount || 0);
    setMaxDiscount(promo.max_discount ? String(promo.max_discount) : "");
    setUsageLimit(promo.usage_limit ? String(promo.usage_limit) : "");
    setActive(promo.active);
    setError(null);
    setShowForm(true);
  };

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setError("El código de cupón es requerido.");
      return;
    }

    const payload = {
      ...(editingPromo?.id ? { id: editingPromo.id } : {}),
      code: cleanCode,
      type,
      value: Number(value) || 0,
      minimum_amount: Number(minimumAmount) || 0,
      max_discount: maxDiscount !== "" ? Number(maxDiscount) : null,
      usage_limit: usageLimit !== "" ? Number(usageLimit) : null,
      active,
    };

    startTransition(async () => {
      try {
        try {
          await savePromoAction(payload);
        } catch (serverErr: any) {
          console.warn("savePromoAction falló, usando fallback de cliente Supabase:", serverErr);
          const { error: dbErr } = await supabase
            .from("promos")
            .upsert(payload, { onConflict: "code" });
          if (dbErr) throw new Error(dbErr.message || "Error al guardar la promoción en la base de datos");
        }

        const msg = editingPromo ? `Promoción ${cleanCode} actualizada.` : `Promoción ${cleanCode} creada exitosamente.`;
        setSuccess(msg);
        toast.success(msg);
        setShowForm(false);
        await loadPromos();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        setError(err.message || "Error al guardar la promoción");
        toast.error("Error al guardar promoción", { description: err.message });
      }
    });
  };

  const handleDeletePromo = (promoCode: string) => {
    if (!confirm(`¿Eliminar la promoción ${promoCode}?`)) return;
    setError(null);

    startTransition(async () => {
      try {
        try {
          await deletePromoAction(promoCode);
        } catch (serverErr: any) {
          console.warn("deletePromoAction falló, usando fallback de cliente Supabase:", serverErr);
          const { error: dbErr } = await supabase
            .from("promos")
            .delete()
            .eq("code", promoCode);
          if (dbErr) throw new Error(dbErr.message || "Error al eliminar la promoción");
        }

        const msg = `Promoción ${promoCode} eliminada.`;
        setSuccess(msg);
        toast.success(msg);
        await loadPromos();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        setError(err.message || "Error al eliminar la promoción");
        toast.error("Error al eliminar promoción", { description: err.message });
      }
    });
  };

  const filteredPromos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return promos;
    return promos.filter(
      (p) => p.code.toLowerCase().includes(query) || p.type.toLowerCase().includes(query),
    );
  }, [promos, searchQuery]);

  return (
    <AdminPage
      title="Promociones & Cupones"
      subtitle={`${promos.length} códigos de descuento registrados`}
      actions={
        <button
          type="button"
          onClick={openNewForm}
          className="label-xs bg-foreground text-background px-5 py-3 rounded-full hover:bg-accent cursor-pointer transition-colors font-bold flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Nueva promoción
        </button>
      }
    >
      {error && !showForm && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-400">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Buscador */}
      <div className="mt-2 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código de cupón o tipo..."
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
        <div className="py-12 text-center text-sm text-muted-foreground">Cargando promociones...</div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto overflow-x-auto border border-border bg-card rounded-2xl shadow-sm">
          <table className="w-full min-w-[700px] text-sm border-collapse">
            <thead className="sticky top-0 bg-card z-10 border-b border-border shadow-xs">
              <tr>
                {["Código", "Tipo", "Valor / Beneficio", "Mínimo Compra", "Usos Realizados", "Estado", "Acciones"].map((h) => (
                  <th key={h} className="label-xs px-4 py-3.5 text-left text-muted-foreground bg-card">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPromos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                    No se encontraron promociones.
                  </td>
                </tr>
              ) : (
                filteredPromos.map((p) => (
                  <tr key={p.id || p.code} className="border-b border-border last:border-0 hover:bg-cream/70 transition-colors">
                    <td className="px-4 py-4 font-mono font-bold text-foreground flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-accent shrink-0" />
                      {p.code}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-muted-foreground">
                      {p.type === "PERCENTAGE" ? "Porcentaje" : p.type === "FIXED" ? "Monto Fijo" : "Envío Gratis"}
                    </td>
                    <td className="px-4 py-4 font-bold text-foreground">
                      {p.type === "PERCENTAGE" ? `${p.value}% OFF` : p.type === "FIXED" ? money(p.value) : "Envío Bonificado"}
                    </td>
                    <td className="px-4 py-4 text-xs tabular-nums text-muted-foreground">
                      {p.minimum_amount > 0 ? money(p.minimum_amount) : "Sin mínimo"}
                    </td>
                    <td className="px-4 py-4 tabular-nums text-xs text-muted-foreground font-mono">
                      {p.uses} / {p.usage_limit ?? "∞"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "label-xs border px-2.5 py-1 rounded-full font-bold",
                          p.active
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {p.active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openEditForm(p)}
                          className="label-xs text-muted-foreground hover:text-foreground font-semibold cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePromo(p.code)}
                          className="label-xs text-red-400 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL OVERLAY PARA CREAR / EDITAR PROMOCIÓN */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-card border border-border p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="label-xs text-accent">Gestión de Cupones</span>
                <h2 className="display-md text-2xl mt-1">
                  {editingPromo ? `Editar Cupón "${editingPromo.code}"` : "Nueva Promoción"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setShowForm(false);
                }}
                className="p-2 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error dentro del modal */}
            {error && (
              <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSavePromo} className="space-y-4">
              <div>
                <label className="label-xs text-muted-foreground block mb-1">Código del cupón *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej: NAWEA10, DESCUENTO20"
                  required
                  className="w-full border-b border-input bg-transparent py-2 text-sm outline-none font-mono font-bold focus:border-foreground uppercase"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-xs text-muted-foreground block mb-1">Tipo de beneficio *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full border-b border-input bg-card text-foreground py-2 text-sm outline-none font-semibold focus:border-foreground cursor-pointer"
                  >
                    <option value="PERCENTAGE" className="bg-card text-foreground">Porcentaje (%)</option>
                    <option value="FIXED" className="bg-card text-foreground">Monto Fijo ($)</option>
                    <option value="FREE_SHIPPING" className="bg-card text-foreground">Envío Gratuito</option>
                  </select>
                </div>

                <div>
                  <label className="label-xs text-muted-foreground block mb-1">Valor del beneficio *</label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    required
                    placeholder={type === "PERCENTAGE" ? "Ej: 15 (para 15%)" : "Ej: 5000"}
                    className="w-full border-b border-input bg-transparent py-2 text-sm outline-none font-semibold focus:border-foreground"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-xs text-muted-foreground block mb-1">Compra mínima ($)</label>
                  <input
                    type="number"
                    value={minimumAmount}
                    onChange={(e) => setMinimumAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full border-b border-input bg-transparent py-2 text-sm outline-none focus:border-foreground"
                  />
                </div>

                <div>
                  <label className="label-xs text-muted-foreground block mb-1">Límite de usos</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="Ej: 500 (vacío = sin límite)"
                    className="w-full border-b border-input bg-transparent py-2 text-sm outline-none focus:border-foreground"
                  />
                </div>
              </div>

              {type === "PERCENTAGE" && (
                <div>
                  <label className="label-xs text-muted-foreground block mb-1">Tope máximo de descuento ($)</label>
                  <input
                    type="number"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    placeholder="Opcional: monto máx. a descontar"
                    className="w-full border-b border-input bg-transparent py-2 text-sm outline-none focus:border-foreground"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <input
                  type="checkbox"
                  id="promoActive"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-border accent-foreground cursor-pointer"
                />
                <label htmlFor="promoActive" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                  Promoción Activa y disponible en checkout
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setShowForm(false);
                  }}
                  className="label-xs border border-border px-6 py-3 rounded-full hover:border-foreground cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="label-sm bg-foreground text-background px-8 py-3 rounded-full hover:bg-accent cursor-pointer disabled:opacity-50 font-bold transition-colors"
                >
                  {isPending ? "Guardando..." : editingPromo ? "Guardar Cambios" : "Crear Promoción"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPage>
  );
}

