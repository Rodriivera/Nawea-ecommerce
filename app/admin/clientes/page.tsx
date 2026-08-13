"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { Search, X, CheckCircle, ShieldAlert, User } from "lucide-react";
import { AdminPage, Stat } from "@/components/admin/AdminUI";
import { shortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { setUserRoleAction } from "@/lib/admin-actions";

type ProfileRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  address: any;
  city: string | null;
  segment: string;
  role: "customer" | "admin";
  created_at: string;
};

export default function AdminCustomersPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sel, setSel] = useState<ProfileRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  const loadProfiles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setProfiles(data as ProfileRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleToggleRole = (userRow: ProfileRow) => {
    setError(null);
    const targetRole = userRow.role === "admin" ? "customer" : "admin";

    startTransition(async () => {
      try {
        await setUserRoleAction(userRow.id, targetRole);
        toast.success(`Rol de "${userRow.name || userRow.email}" actualizado`, {
          description: `Nuevo rol: ${targetRole.toUpperCase()}`,
        });
        await loadProfiles();
        if (sel && sel.id === userRow.id) {
          setSel((prev) => (prev ? { ...prev, role: targetRole } : null));
        }
      } catch (err: any) {
        setError(err.message || "Error al modificar el rol del usuario");
        toast.error("Error al modificar rol", { description: err.message });
      }
    });
  };

  const filteredProfiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return profiles;
    return profiles.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(query)) ||
        p.email.toLowerCase().includes(query) ||
        (p.phone && p.phone.toLowerCase().includes(query)) ||
        (p.city && p.city.toLowerCase().includes(query)),
    );
  }, [profiles, searchQuery]);

  const adminCount = profiles.filter((p) => p.role === "admin").length;

  return (
    <AdminPage title="Clientes & Usuarios" subtitle={`${profiles.length} usuarios registrados en la plataforma`}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total Registrados" value={String(profiles.length)} />
        <Stat label="Administradores" value={String(adminCount)} />
        <Stat label="Clientes" value={String(profiles.length - adminCount)} />
      </div>

      {/* Buscador de Usuarios */}
      <div className="mt-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, email, teléfono o ciudad..."
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

      {error && (
        <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Cargando usuarios...</div>
      ) : (
        <div className="mt-6">
          {/* TABLA COMPLETA DE USUARIOS */}
          <div className="max-h-[600px] overflow-y-auto overflow-x-auto border border-border bg-card rounded-2xl shadow-sm">
            <table className="w-full min-w-[640px] text-sm border-collapse">
              <thead className="sticky top-0 bg-card z-10 border-b border-border shadow-xs">
                <tr>
                  {["Nombre", "Email", "Teléfono", "Ciudad", "Rol", "Registro", "Acción"].map((h) => (
                    <th key={h} className="label-xs px-4 py-3.5 text-left text-muted-foreground bg-card">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map((c) => {
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSel(c)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-cream/70 transition-colors"
                    >
                      <td className="px-4 py-4 font-semibold">
                        {c.name || "Sin nombre"}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{c.email}</td>
                      <td className="px-4 py-4 text-muted-foreground">{c.phone || "—"}</td>
                      <td className="px-4 py-4 text-muted-foreground">{c.city || "—"}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`label-xs rounded-full px-3 py-1 font-bold ${
                            c.role === "admin"
                              ? "bg-foreground text-background"
                              : "border border-border text-muted-foreground"
                          }`}
                        >
                          {c.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground text-xs">{shortDate(c.created_at)}</td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSel(c);
                          }}
                          className="label-xs text-foreground underline underline-offset-4 hover:text-accent font-semibold cursor-pointer"
                        >
                          Ver ficha
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL FICHA DE USUARIO */}
      {sel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background font-bold text-lg">
                  {(sel.name || sel.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="label-xs text-accent">Ficha de Usuario</span>
                  <h3 className="display text-xl sm:text-2xl mt-0.5 font-bold">{sel.name || "Sin nombre"}</h3>
                  <p className="text-xs text-muted-foreground">{sel.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSel(null)}
                className="p-2 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Datos detallados */}
            <div className="space-y-4 text-sm">
              <div className="grid gap-3">
                {[
                  ["ID Usuario", sel.id],
                  ["Email", sel.email],
                  ["Teléfono", sel.phone || "—"],
                  ["Ciudad", sel.city || "—"],
                  ["Dirección", typeof sel.address === "string" ? sel.address : sel.address?.street || "—"],
                  ["Segmento", sel.segment || "General"],
                  ["Rol Actual", sel.role.toUpperCase()],
                  ["Fecha de Registro", shortDate(sel.created_at)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-border/60 pb-2 text-xs">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-semibold text-right max-w-[240px] truncate">{v}</dd>
                  </div>
                ))}
              </div>

              {/* Gestión de Privilegios */}
              <div className="border border-border bg-cream/40 p-4 rounded-2xl space-y-3 mt-6">
                <p className="label-xs text-foreground font-bold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-accent" /> Gestión de Rol & Privilegios
                </p>
                <p className="text-xs text-muted-foreground">
                  El rol actual de este usuario es <strong className="text-foreground">{sel.role}</strong>.
                  {sel.role === "admin"
                    ? " Los administradores tienen acceso completo al panel de control y gestión."
                    : " Los clientes solo pueden acceder a su cuenta pública y catálogo."}
                </p>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleToggleRole(sel)}
                  className={`label-xs w-full cursor-pointer rounded-full py-3.5 font-bold transition-colors disabled:opacity-50 mt-2 ${
                    sel.role === "admin"
                      ? "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      : "bg-foreground text-background hover:bg-accent"
                  }`}
                >
                  {isPending
                    ? "Actualizando..."
                    : sel.role === "admin"
                    ? "Demover a Rol Customer (Cliente)"
                    : "Promover a Rol Admin (Administrador)"}
                </button>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setSel(null)}
                className="label-xs border border-border px-6 py-3 rounded-full hover:border-foreground cursor-pointer font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPage>
  );
}

