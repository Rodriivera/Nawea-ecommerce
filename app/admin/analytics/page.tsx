"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminPage, RangeSelector, Stat } from "@/components/admin/AdminUI";
import { ScrollReveal } from "@/components/shop/ScrollReveal";
import { categorySales, salesSeries, topProducts } from "@/data/admin";
import { money } from "@/lib/format";

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState("30 días");

  return (
    <AdminPage
      title="Analytics"
      subtitle={`Rendimiento de la tienda · ${range}`}
      actions={<RangeSelector value={range} onChange={setRange} />}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Ventas" value="$1.284.500" delta="+18.4%" />
        <Stat label="Pedidos" value="128" delta="+9.2%" />
        <Stat label="Conversión" value="3,4%" delta="+0.6 pts" />
        <Stat label="Ticket promedio" value="$42.800" delta="+2.6%" />
        <Stat label="Clientes nuevos" value="94" delta="+11.3%" />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ScrollReveal variant="slide-left" delay={200} duration={900} className="border border-border bg-card p-5">
          <p className="label-xs text-muted-foreground">Evolución de ventas</p>
          <div className="mt-6 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesSeries}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={60} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Line
                  type="monotone"
                  dataKey="ventas"
                  stroke="var(--color-foreground)"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="slide-right" delay={300} duration={900} className="border border-border bg-card p-5">
          <p className="label-xs text-muted-foreground">Categorías más vendidas</p>
          <div className="mt-6 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySales} layout="vertical">
                <CartesianGrid stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={90}
                />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey="value" fill="var(--color-foreground)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal variant="fade-up" delay={250} duration={900} className="mt-4 border border-border bg-card p-5">
        <p className="label-xs text-muted-foreground">Productos más vendidos</p>
        <ul className="mt-5">
          {topProducts.map((p) => (
            <li
              key={p.name}
              className="flex items-center justify-between border-b border-border py-3 text-sm last:border-0"
            >
              <span>{p.name}</span>
              <span className="flex gap-8 tabular-nums">
                <span className="text-muted-foreground">{p.units} u.</span>
                <span>{money(p.revenue)}</span>
              </span>
            </li>
          ))}
        </ul>
      </ScrollReveal>
    </AdminPage>
  );
}

