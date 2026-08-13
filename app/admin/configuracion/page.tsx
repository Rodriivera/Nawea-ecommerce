"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin/AdminUI";
import { createClient } from "@/lib/supabase/client";
import { saveSettingsAction } from "@/lib/admin-actions";

export default function AdminSettingsPage() {
  const [estandar, setEstandar] = useState(7900);
  const [express, setExpress] = useState(12900);
  const [freeThreshold, setFreeThreshold] = useState(120000);
  const [ttlMinutes, setTtlMinutes] = useState(20);

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from("settings").select("*");

    if (data) {
      const shippingRow = data.find((s) => s.key === "shipping");
      if (shippingRow?.value) {
        setEstandar(shippingRow.value.estandar ?? 7900);
        setExpress(shippingRow.value.express ?? 12900);
        setFreeThreshold(shippingRow.value.free_threshold ?? 120000);
      }

      const ttlRow = data.find((s) => s.key === "reservation_ttl");
      if (ttlRow?.value) {
        setTtlMinutes(ttlRow.value.reservation_ttl_minutes ?? 20);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        await saveSettingsAction("shipping", {
          estandar,
          express,
          retiro: 0,
          free_threshold: freeThreshold,
        });

        await saveSettingsAction("reservation_ttl", {
          reservation_ttl_minutes: ttlMinutes,
        });

        setSuccess(true);
        toast.success("Configuración actualizada con éxito");
        await loadSettings();
        setTimeout(() => setSuccess(false), 3000);
      } catch (err: any) {
        setError(err.message || "Error al guardar la configuración");
        toast.error("Error al guardar configuración", { description: err.message });
      }
    });
  };

  return (
    <AdminPage title="Configuración" subtitle="Tarifas de envío, umbrales y expiración de reservas">
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-400">
          Configuración actualizada con éxito.
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Cargando configuración...</div>
      ) : (
        <form onSubmit={handleSaveSettings} className="max-w-2xl border border-border bg-card p-6 md:p-8 rounded-2xl">
          <p className="display-md text-xl">Envíos & Reservas</p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <label className="label-xs text-muted-foreground block mb-2">Envío Estándar ($)</label>
              <input
                type="number"
                value={estandar}
                onChange={(e) => setEstandar(Number(e.target.value))}
                required
                className="w-full border-b border-input bg-transparent py-2.5 text-sm outline-none focus:border-foreground"
              />
            </div>

            <div>
              <label className="label-xs text-muted-foreground block mb-2">Envío Express ($)</label>
              <input
                type="number"
                value={express}
                onChange={(e) => setExpress(Number(e.target.value))}
                required
                className="w-full border-b border-input bg-transparent py-2.5 text-sm outline-none focus:border-foreground"
              />
            </div>

            <div>
              <label className="label-xs text-muted-foreground block mb-2">Umbral Envío Gratis ($)</label>
              <input
                type="number"
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(Number(e.target.value))}
                required
                className="w-full border-b border-input bg-transparent py-2.5 text-sm outline-none focus:border-foreground"
              />
            </div>

            <div>
              <label className="label-xs text-muted-foreground block mb-2">TTL Reserva (minutos)</label>
              <input
                type="number"
                value={ttlMinutes}
                onChange={(e) => setTtlMinutes(Number(e.target.value))}
                required
                className="w-full border-b border-input bg-transparent py-2.5 text-sm outline-none focus:border-foreground"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="label-sm mt-10 cursor-pointer rounded-full bg-foreground px-8 py-4 text-background transition-colors hover:bg-accent disabled:opacity-50"
          >
            {isPending ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      )}
    </AdminPage>
  );
}
