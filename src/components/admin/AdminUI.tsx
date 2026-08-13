import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/shop/ScrollReveal";

export function AdminPage({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10 max-w-full overflow-hidden">
      <ScrollReveal variant="fade-down" delay={0} duration={750}>
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="display-md text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </header>
      </ScrollReveal>
      <div className="pt-6 sm:pt-8 w-full max-w-full">{children}</div>
    </div>
  );
}

export function RangeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ranges = ["Hoy", "7 días", "30 días", "3 meses", "1 año"];
  return (
    <div className="flex flex-wrap gap-1 border border-border p-1 rounded-xl bg-card">
      {ranges.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            "label-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs transition-colors cursor-pointer font-semibold",
            value === r ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

export function Stat({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
}) {
  const positive = delta?.startsWith("+");
  return (
    <div className="border border-border bg-card p-4 sm:p-5 rounded-2xl shadow-xs">
      <p className="label-xs text-muted-foreground font-semibold">{label}</p>
      <p className="display mt-2 sm:mt-4 text-xl sm:text-2xl lg:text-3xl font-bold tabular-nums">{value}</p>
      <div className="mt-2.5 flex flex-wrap items-baseline gap-2 text-xs">
        {delta && (
          <span className={cn("label-xs font-bold", positive ? "text-emerald-500" : "text-red-400")}>
            {delta}
          </span>
        )}
        {hint && <span className="label-xs text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const statusLabels: Record<string, string> = {
    PENDING: "Pendiente",
    PENDIENTE: "Pendiente",
    CONFIRMED: "Confirmado",
    CONFIRMADO: "Confirmado",
    PAGADO: "Confirmado",
    PREPARING: "En preparación",
    PREPARANDO: "En preparación",
    SHIPPED: "Enviado",
    ENVIADO: "Enviado",
    DELIVERED: "Entregado",
    ENTREGADO: "Entregado",
    CANCELLED: "Cancelado",
    CANCELADO: "Cancelado",
    Activo: "Activo",
    Borrador: "Borrador",
    Archivado: "Archivado",
  };

  const tone: Record<string, string> = {
    PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-400 font-bold",
    PENDIENTE: "border-amber-500/30 bg-amber-500/10 text-amber-400 font-bold",
    CONFIRMED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold",
    CONFIRMADO: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold",
    PAGADO: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold",
    PREPARING: "border-accent bg-accent/10 text-accent font-bold",
    PREPARANDO: "border-accent bg-accent/10 text-accent font-bold",
    SHIPPED: "bg-foreground text-background border-foreground font-bold",
    ENVIADO: "bg-foreground text-background border-foreground font-bold",
    DELIVERED: "bg-foreground text-background border-foreground font-bold",
    ENTREGADO: "bg-foreground text-background border-foreground font-bold",
    CANCELLED: "border-red-500/30 bg-red-500/10 text-red-400 font-bold line-through",
    CANCELADO: "border-red-500/30 bg-red-500/10 text-red-400 font-bold line-through",
    Activo: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold",
    Borrador: "border-border text-muted-foreground font-bold",
    Archivado: "border-border text-muted-foreground font-bold",
  };

  const label = statusLabels[status] ?? status;

  return (
    <span className={cn("label-xs inline-block border px-2.5 py-1 rounded-full text-xs", tone[status] ?? "border-border")}>
      {label}
    </span>
  );
}
