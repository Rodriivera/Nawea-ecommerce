"use client";

import { useState, useEffect } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminPage, RangeSelector, Stat, StatusPill } from "@/components/admin/AdminUI";
import { ScrollReveal } from "@/components/shop/ScrollReveal";
import { money, shortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

type OrderRow = {
  id: string;
  number: string;
  name: string;
  email: string;
  total: number;
  order_status: string;
  created_at: string;
};

type TopProduct = {
  name: string;
  units: number;
  revenue: number;
};

export default function DashboardPage() {
  const [range, setRange] = useState("7 días");
  const [loading, setLoading] = useState(true);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [salesSeries, setSalesSeries] = useState<{ d: string; ventas: number; pedidos: number }[]>([]);

  const supabase = createClient();

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      const { data: ordersData } = await supabase
        .from("orders")
        .select("id, number, name, email, total, order_status, created_at, order_items(name, qty, unit_price)")
        .order("created_at", { ascending: false });

      const { count: profCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      setCustomerCount(profCount || 0);

      if (ordersData) {
        const validOrders = ordersData.filter((o) => o.order_status !== "CANCELLED");
        const rev = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        setTotalRevenue(rev);
        setOrderCount(validOrders.length);
        setRecentOrders(ordersData.slice(0, 5) as unknown as OrderRow[]);

        // Calcular más vendidos
        const prodStats = new Map<string, { units: number; revenue: number }>();
        for (const o of validOrders) {
          const items = (o.order_items as any[]) || [];
          for (const item of items) {
            const cur = prodStats.get(item.name) || { units: 0, revenue: 0 };
            prodStats.set(item.name, {
              units: cur.units + item.qty,
              revenue: cur.revenue + item.qty * item.unit_price,
            });
          }
        }

        const topList: TopProduct[] = Array.from(prodStats.entries())
          .map(([name, stat]) => ({ name, units: stat.units, revenue: stat.revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setTopProducts(topList);

        // Agrupar serie de ventas por días
        const daysMap = new Map<string, { ventas: number; pedidos: number }>();
        for (const o of validOrders.slice(0, 30)) {
          const dateKey = shortDate(o.created_at);
          const cur = daysMap.get(dateKey) || { ventas: 0, pedidos: 0 };
          daysMap.set(dateKey, { ventas: cur.ventas + o.total, pedidos: cur.pedidos + 1 });
        }

        const series = Array.from(daysMap.entries())
          .map(([d, stat]) => ({ d, ventas: stat.ventas, pedidos: stat.pedidos }))
          .reverse();

        setSalesSeries(series);
      }

      setLoading(false);
    };

    loadDashboard();
  }, [range]);

  const avgTicket = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

  return (
    <AdminPage
      title="Dashboard"
      subtitle={`Resumen en tiempo real · ${range}`}
      actions={<RangeSelector value={range} onChange={setRange} />}
    >
      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Cargando métricas...</div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Facturación total" value={money(totalRevenue)} delta="+18.4%" hint="Órdenes confirmadas" />
            <Stat label="Total Pedidos" value={String(orderCount)} delta="+9.2%" />
            <Stat label="Clientes registrados" value={String(customerCount)} delta="+4.1%" />
            <Stat label="Ticket promedio" value={money(avgTicket)} delta="+2.6%" />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[2fr_1fr]">
            <ScrollReveal variant="slide-left" delay={200} duration={900} className="border border-border bg-card p-5 rounded-2xl">
              <p className="label-xs text-muted-foreground">Evolución de Ventas</p>
              <div className="mt-6 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesSeries}>
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} width={60} />
                    <Tooltip formatter={(v: number) => money(v)} />
                    <Area
                      type="monotone"
                      dataKey="ventas"
                      stroke="var(--color-foreground)"
                      fill="url(#g)"
                      strokeWidth={1.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="slide-right" delay={300} duration={900} className="border border-border bg-card p-5 rounded-2xl">
              <p className="label-xs text-muted-foreground">Pedidos por día</p>
              <div className="mt-6 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesSeries}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="pedidos" fill="var(--color-foreground)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ScrollReveal>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <ScrollReveal variant="slide-left" delay={250} duration={900} className="border border-border bg-card p-5 rounded-2xl">
              <p className="label-xs text-muted-foreground">Productos más vendidos</p>
              <ul className="mt-5">
                {topProducts.length === 0 ? (
                  <p className="py-4 text-xs text-muted-foreground">Aún no hay ventas registradas</p>
                ) : (
                  topProducts.map((p) => (
                    <li key={p.name} className="flex items-center justify-between border-b border-border py-3 text-sm last:border-0">
                      <span className="font-medium">{p.name}</span>
                      <span className="flex items-center gap-6 tabular-nums text-muted-foreground">
                        <span>{p.units} u.</span>
                        <span className="text-foreground font-semibold">{money(p.revenue)}</span>
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </ScrollReveal>

            <ScrollReveal variant="slide-right" delay={350} duration={900} className="border border-border bg-card p-5 rounded-2xl">
              <p className="label-xs text-muted-foreground">Últimos pedidos</p>
              <ul className="mt-5">
                {recentOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between border-b border-border py-3 text-sm last:border-0">
                    <span className="flex items-center gap-4">
                      <span className="tabular-nums font-semibold">{o.number}</span>
                      <span className="text-muted-foreground">{o.name}</span>
                    </span>
                    <span className="flex items-center gap-4">
                      <span className="label-xs text-muted-foreground">{shortDate(o.created_at)}</span>
                      <StatusPill status={o.order_status} />
                    </span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>
        </>
      )}
    </AdminPage>
  );
}

