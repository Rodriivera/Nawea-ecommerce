"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Tags,
  Users,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { to: "/admin/productos", label: "Productos", icon: Package },
  { to: "/admin/categorias", label: "Categorías", icon: Tags },
  { to: "/admin/inventario", label: "Inventario", icon: Boxes },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/promociones", label: "Promociones", icon: Percent },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cerrar el menú mobile al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const activeNavItem = nav.find((item) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to),
  );

  return (
    <div className="flex min-h-dvh bg-background">
      {/* SIDEBAR DESKTOP — Fija en pantalla en pantallas grandes */}
      <aside className="fixed top-0 left-0 hidden h-dvh w-[240px] shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex z-40 border-r border-sidebar-border shadow-xs">
        <div className="px-6 py-7 shrink-0 flex items-center justify-between">
          <div>
            <p className="display text-xl leading-none font-bold">NAWEA</p>
            <p className="label-xs mt-1.5 text-sidebar-primary font-semibold">Panel Admin</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                href={item.to}
                className={cn(
                  "label-xs flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-xs"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-sidebar-border px-6 py-4">
          <Link
            href="/"
            className="label-xs text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors flex items-center gap-2 font-medium"
          >
            ← Ir a la tienda <ExternalLink className="h-3 w-3 inline" />
          </Link>
        </div>
      </aside>

      {/* CABECERA Y NAVEGACIÓN MOBILE RESPONSIVE (< lg) */}
      <div className="min-w-0 flex-1 lg:ml-[240px]">
        
        {/* Barra superior de navegación mobile */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3.5 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-border text-foreground hover:bg-cream transition-colors cursor-pointer"
              aria-label="Abrir menú de administración"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div>
              <span className="label-xs text-accent font-bold uppercase tracking-wider text-[10px]">NAWEA Admin</span>
              <h2 className="text-sm font-bold leading-tight">{activeNavItem?.label || "Panel"}</h2>
            </div>
          </div>

          <Link
            href="/"
            className="label-xs px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
          >
            Tienda <ChevronRight className="h-3 w-3" />
          </Link>
        </header>

        {/* MENÚ LATERAL DESPLEGABLE MOBILE (DRAWER EN OVERLAY) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Fondo oscuro con desenfoque */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Panel de navegación lateral */}
            <aside className="fixed inset-y-0 left-0 w-[280px] max-w-[85vw] bg-sidebar text-sidebar-foreground p-6 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200 z-50">
              <div className="flex items-center justify-between border-b border-sidebar-border pb-5 mb-4">
                <div>
                  <p className="display text-2xl font-bold">NAWEA</p>
                  <p className="label-xs mt-1 text-sidebar-primary">Panel de Administración</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full border border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto space-y-1 pr-1">
                {nav.map((item) => {
                  const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                  return (
                    <Link
                      key={item.to}
                      href={item.to}
                      className={cn(
                        "label-xs flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors text-sm font-semibold",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {active && <ChevronRight className="h-4 w-4 text-sidebar-primary" />}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-sidebar-border pt-4 mt-4">
                <Link
                  href="/"
                  className="label-xs w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-sidebar-border text-sidebar-foreground/80 font-bold hover:bg-sidebar-accent transition-colors"
                >
                  Ver Tienda Pública
                </Link>
              </div>
            </aside>
          </div>
        )}

        

        {/* Contenido de la página de administración */}
        <main className="w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
