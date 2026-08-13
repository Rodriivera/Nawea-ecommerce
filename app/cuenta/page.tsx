"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useCallback } from "react";
import { LogOut } from "lucide-react";
import { SiteLayout } from "@/components/shop/SiteLayout";
import { ProductCard } from "@/components/shop/ProductCard";
import { ScrollReveal } from "@/components/shop/ScrollReveal";
import { products } from "@/data/catalog";
import { money, shortDate } from "@/lib/format";
import { useShop } from "@/store/shop";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Tab = "perfil" | "pedidos" | "favoritos";

const statusTone: Record<string, string> = {
  PENDING: "text-amber-400 font-medium",
  CONFIRMED: "text-foreground font-medium",
  PREPARING: "text-accent font-medium",
  SHIPPED: "text-accent font-medium",
  DELIVERED: "text-foreground font-medium",
  CANCELLED: "text-muted-foreground line-through",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente de pago",
  CONFIRMED: "Confirmado",
  PREPARING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

type OrderItemRow = {
  id: string;
  name: string;
  qty: number;
  unit_price: number;
  subtotal: number;
};

type OrderRow = {
  id: string;
  number: string;
  created_at: string;
  total: number;
  order_status: string;
  payment_status: string;
  order_items: OrderItemRow[];
};

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab: Tab = rawTab === "pedidos" || rawTab === "favoritos" ? rawTab : "perfil";

  const { user, profile, loadingUser, signOut, refreshProfile, favorites, toggleFavorite } = useShop();

  const supabase = createClient();

  // Campos editables del perfil
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Pedidos del usuario
  const [userOrders, setUserOrders] = useState<OrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [profileLoadedId, setProfileLoadedId] = useState<string | null>(null);

  // Cargar estado inicial del perfil solo una vez por ID de usuario
  useEffect(() => {
    if (profile && profile.id !== profileLoadedId) {
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
      setCity(profile.city ?? "");
      const addrObj = profile.address as { street?: string } | null;
      setStreet(addrObj?.street ?? "");
      setProfileLoadedId(profile.id);
    }
  }, [profile, profileLoadedId]);

  // Cargar pedidos desde Supabase
  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoadingOrders(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id, number, created_at, total, order_status, payment_status, order_items(id, name, qty, unit_price, subtotal)")
      .or(`customer_id.eq.${user.id},email.eq.${user.email}`)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUserOrders(data as unknown as OrderRow[]);
    }
    setLoadingOrders(false);
  }, [user, supabase]);

  useEffect(() => {
    if (user && tab === "pedidos") {
      loadOrders();
    }
  }, [user, tab, loadOrders]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const { error } = await supabase
      .from("profiles")
      .update({
        name,
        phone,
        address: { street },
        city,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      setSaveError(error.message);
      toast.error("Error al actualizar perfil", { description: error.message });
    } else {
      setSaveSuccess(true);
      toast.success("Perfil actualizado con éxito");
      await refreshProfile();
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Si está cargando auth o sin sesión
  if (loadingUser) {
    return (
      <SiteLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Cargando perfil...</p>
        </div>
      </SiteLayout>
    );
  }

  if (!user) {
    return (
      <SiteLayout>
        <section className="edge flex min-h-[70vh] flex-col items-center justify-center text-center py-20">
          <ScrollReveal variant="fade-up" delay={100} duration={850}>
            <h1 className="display-xl">Mi Cuenta</h1>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Iniciá sesión o registrate para gestionar tus datos personales, ver tus pedidos y consultar tus piezas guardadas.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/auth/login?redirect=/cuenta"
                className="label-sm rounded-full bg-foreground px-8 py-4 text-background transition-colors hover:bg-accent cursor-pointer"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/auth/register?redirect=/cuenta"
                className="label-sm rounded-full border border-foreground px-8 py-4 text-foreground transition-colors hover:bg-foreground hover:text-background cursor-pointer"
              >
                Crear Cuenta
              </Link>
            </div>
          </ScrollReveal>
        </section>
      </SiteLayout>
    );
  }

  const favProducts = products.filter((p) => favorites.includes(p.slug));

  const tabs: { id: Tab; label: string }[] = [
    { id: "perfil", label: "Perfil" },
    { id: "pedidos", label: "Mis pedidos" },
    { id: "favoritos", label: "Favoritos" },
  ];

  return (
    <SiteLayout>
      <section className="edge pb-6 pt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <ScrollReveal variant="slide-left" delay={100} duration={850}>
              <p className="label-xs text-accent">Cuenta</p>
            </ScrollReveal>
            <ScrollReveal variant="fade-up" delay={250} duration={1000}>
              <h1 className="display-xl mt-2">
                Hola, {profile?.name || user.email}
              </h1>
            </ScrollReveal>
          </div>

          <ScrollReveal variant="slide-right" delay={300} duration={800}>
            <button
              type="button"
              onClick={handleSignOut}
              className="label-xs flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </ScrollReveal>
        </div>
      </section>

      <section className="edge grid gap-12 pb-24 lg:grid-cols-[220px_1fr] lg:gap-16">
        <aside>
          <ScrollReveal variant="slide-left" delay={200} duration={900} className="border-t border-border">
            {tabs.map((t) => (
              <Link
                key={t.id}
                href={`/cuenta?tab=${t.id}`}
                className={cn(
                  "label-xs flex items-center justify-between border-b border-border py-4 transition-colors",
                  tab === t.id ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                <span>→</span>
              </Link>
            ))}
          </ScrollReveal>
        </aside>

        <div>
          {tab === "perfil" && (
            <div className="max-w-xl">
              <ScrollReveal variant="fade-up" delay={150} duration={850}>
                <h2 className="display-md">Datos personales</h2>
              </ScrollReveal>

              {saveSuccess && (
                <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-400">
                  Perfil actualizado con éxito.
                </div>
              )}
              {saveError && (
                <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400">
                  {saveError}
                </div>
              )}

              <form onSubmit={handleSaveProfile}>
                <ScrollReveal variant="fade-up" delay={300} duration={900} className="mt-8 grid gap-6 md:grid-cols-2">
                  <label className="block">
                    <span className="label-xs text-muted-foreground">Nombre completo</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre"
                      className="mt-2 w-full border-b border-input bg-transparent py-3 text-sm outline-none focus:border-foreground"
                    />
                  </label>

                  <label className="block">
                    <span className="label-xs text-muted-foreground">Email (no modificable)</span>
                    <input
                      type="email"
                      value={user.email ?? ""}
                      disabled
                      className="mt-2 w-full border-b border-input/40 bg-transparent py-3 text-sm text-muted-foreground outline-none cursor-not-allowed"
                    />
                  </label>

                  <label className="block">
                    <span className="label-xs text-muted-foreground">Teléfono</span>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+54 9 11 0000 0000"
                      className="mt-2 w-full border-b border-input bg-transparent py-3 text-sm outline-none focus:border-foreground"
                    />
                  </label>

                  <label className="block">
                    <span className="label-xs text-muted-foreground">Ciudad</span>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="CABA, Buenos Aires"
                      className="mt-2 w-full border-b border-input bg-transparent py-3 text-sm outline-none focus:border-foreground"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="label-xs text-muted-foreground">Dirección de envío</span>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Av. Córdoba 1234, 4B"
                      className="mt-2 w-full border-b border-input bg-transparent py-3 text-sm outline-none focus:border-foreground"
                    />
                  </label>
                </ScrollReveal>

                <ScrollReveal variant="slide-left" delay={450} duration={800}>
                  <button
                    type="submit"
                    disabled={saving}
                    className="label-sm mt-10 rounded-full bg-foreground px-8 py-4 text-background transition-colors hover:bg-accent cursor-pointer disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                </ScrollReveal>
              </form>
            </div>
          )}

          {tab === "pedidos" && (
            <div>
              <ScrollReveal variant="fade-up" delay={150} duration={850}>
                <h2 className="display-md">Mis pedidos</h2>
              </ScrollReveal>

              {loadingOrders ? (
                <p className="mt-8 text-sm text-muted-foreground">Cargando pedidos...</p>
              ) : userOrders.length === 0 ? (
                <ScrollReveal variant="fade-up" delay={250} duration={800}>
                  <p className="mt-8 text-sm text-muted-foreground">
                    Aún no realizaste ningún pedido. Explora nuestro catálogo y descubrí tus próximas piezas.
                  </p>
                  <Link
                    href="/catalogo"
                    className="label-xs mt-6 inline-block rounded-full border border-foreground bg-foreground px-8 py-3.5 text-background transition-colors hover:bg-accent"
                  >
                    Ver Catálogo
                  </Link>
                </ScrollReveal>
              ) : (
                <div className="mt-8 border-t border-border">
                  {userOrders.map((o, i) => (
                    <ScrollReveal key={o.id} variant="fade-up" delay={i * 100} duration={750} className="border-b border-border py-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <div className="flex items-baseline gap-5">
                          <span className="display text-xl">{o.number}</span>
                          <span className="label-xs text-muted-foreground">
                            {shortDate(o.created_at)}
                          </span>
                        </div>
                        <span className={cn("label-xs", statusTone[o.order_status] ?? "text-foreground")}>
                          {statusLabel[o.order_status] ?? o.order_status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {o.order_items?.map((item) => `${item.qty}× ${item.name}`).join(" · ") || "Ítems del pedido"}
                      </p>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-sm tabular-nums font-semibold">{money(o.total)}</span>
                        <span className="label-xs text-muted-foreground">
                          Pago: {o.payment_status}
                        </span>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "favoritos" && (
            <div>
              <ScrollReveal variant="fade-up" delay={150} duration={850}>
                <h2 className="display-md">Favoritos</h2>
              </ScrollReveal>
              {favProducts.length === 0 ? (
                <ScrollReveal variant="fade-up" delay={250} duration={800}>
                  <p className="mt-8 max-w-sm text-sm text-muted-foreground">
                    Todavía no guardaste piezas. Tocá el corazón en cualquier producto para
                    encontrarlo acá.
                  </p>
                </ScrollReveal>
              ) : (
                <>
                  <ScrollReveal variant="slide-right" delay={200} duration={800}>
                    <p className="label-xs mt-3 text-muted-foreground">
                      {favProducts.length} piezas guardadas
                    </p>
                  </ScrollReveal>
                  <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
                    {favProducts.map((p, i) => (
                      <ScrollReveal key={p.id} variant="fade-up" delay={i * 100} duration={750}>
                        <ProductCard product={p} />
                        <button
                          type="button"
                          onClick={() => toggleFavorite(p.slug)}
                          className="label-xs mt-2 text-muted-foreground transition-colors hover:text-red-400 cursor-pointer"
                        >
                          Quitar
                        </button>
                      </ScrollReveal>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center">Cargando...</div>}>
      <AccountContent />
    </Suspense>
  );
}
