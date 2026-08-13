import { products } from "./catalog";

export type OrderStatus =
  | "PENDIENTE"
  | "PAGADO"
  | "PREPARANDO"
  | "ENVIADO"
  | "ENTREGADO"
  | "CANCELADO";

export type Order = {
  id: string;
  customer: string;
  email: string;
  date: string;
  items: { slug: string; name: string; qty: number; price: number }[];
  total: number;
  status: OrderStatus;
  city: string;
  payment: string;
};

const pick = (slug: string, qty: number) => {
  const p = products.find((x) => x.slug === slug)!;
  return { slug: p.slug, name: p.name, qty, price: p.price };
};

export const orders: Order[] = [
  {
    id: "NW-2841",
    customer: "Malena Ríos",
    email: "malena.rios@mail.com",
    date: "2026-08-09",
    items: [pick("rinonera-cruzada-01", 1), pick("llavero-13", 2)],
    total: 108200,
    status: "PENDIENTE",
    city: "Palermo, CABA",
    payment: "Tarjeta de crédito · 3 cuotas",
  },
  {
    id: "NW-2840",
    customer: "Tomás Iribarne",
    email: "t.iribarne@mail.com",
    date: "2026-08-09",
    items: [pick("mochila-diaria-10", 1)],
    total: 134000,
    status: "PAGADO",
    city: "Rosario, Santa Fe",
    payment: "Transferencia",
  },
  {
    id: "NW-2839",
    customer: "Julieta Vergara",
    email: "ju.vergara@mail.com",
    date: "2026-08-08",
    items: [pick("bolso-estructura-04", 1), pick("porta-tarjetas-08", 1)],
    total: 170900,
    status: "PREPARANDO",
    city: "Córdoba Capital",
    payment: "Tarjeta de débito",
  },
  {
    id: "NW-2838",
    customer: "Ignacio Ferrer",
    email: "nacho.ferrer@mail.com",
    date: "2026-08-07",
    items: [pick("cartera-sobre-07", 2)],
    total: 93000,
    status: "ENVIADO",
    city: "La Plata, BA",
    payment: "Tarjeta de crédito · 6 cuotas",
  },
  {
    id: "NW-2837",
    customer: "Camila Otero",
    email: "camila.otero@mail.com",
    date: "2026-08-06",
    items: [pick("bolso-hombro-05", 1), pick("correa-intercambiable-14", 1)],
    total: 151400,
    status: "ENTREGADO",
    city: "Mendoza",
    payment: "Transferencia",
  },
  {
    id: "NW-2836",
    customer: "Bruno Aguirre",
    email: "bruno.ag@mail.com",
    date: "2026-08-05",
    items: [pick("mochila-compacta-12", 1)],
    total: 89900,
    status: "CANCELADO",
    city: "Bariloche, RN",
    payment: "Tarjeta de crédito",
  },
  {
    id: "NW-2835",
    customer: "Sofía Lenn",
    email: "sofia.lenn@mail.com",
    date: "2026-08-05",
    items: [pick("rinonera-tecnica-02", 1), pick("estuche-15", 1)],
    total: 89800,
    status: "ENTREGADO",
    city: "Belgrano, CABA",
    payment: "Mercado Pago",
  },
  {
    id: "NW-2834",
    customer: "Andrés Quiroga",
    email: "a.quiroga@mail.com",
    date: "2026-08-04",
    items: [pick("bandolera-16", 1)],
    total: 87400,
    status: "ENTREGADO",
    city: "Salta",
    payment: "Transferencia",
  },
];

export type Customer = {
  id: string;
  name: string;
  email: string;
  orders: number;
  spent: number;
  last: string;
  city: string;
  since: string;
  segment: "VIP" | "Recurrente" | "Nuevo";
};

export const customers: Customer[] = [
  {
    id: "c1",
    name: "Camila Otero",
    email: "camila.otero@mail.com",
    orders: 9,
    spent: 842300,
    last: "2026-08-06",
    city: "Mendoza",
    since: "2024-03-12",
    segment: "VIP",
  },
  {
    id: "c2",
    name: "Malena Ríos",
    email: "malena.rios@mail.com",
    orders: 6,
    spent: 512900,
    last: "2026-08-09",
    city: "CABA",
    since: "2024-11-02",
    segment: "VIP",
  },
  {
    id: "c3",
    name: "Tomás Iribarne",
    email: "t.iribarne@mail.com",
    orders: 4,
    spent: 388400,
    last: "2026-08-09",
    city: "Rosario",
    since: "2025-05-21",
    segment: "Recurrente",
  },
  {
    id: "c4",
    name: "Julieta Vergara",
    email: "ju.vergara@mail.com",
    orders: 3,
    spent: 274600,
    last: "2026-08-08",
    city: "Córdoba",
    since: "2025-09-08",
    segment: "Recurrente",
  },
  {
    id: "c5",
    name: "Ignacio Ferrer",
    email: "nacho.ferrer@mail.com",
    orders: 2,
    spent: 139500,
    last: "2026-08-07",
    city: "La Plata",
    since: "2026-01-19",
    segment: "Recurrente",
  },
  {
    id: "c6",
    name: "Bruno Aguirre",
    email: "bruno.ag@mail.com",
    orders: 1,
    spent: 89900,
    last: "2026-08-05",
    city: "Bariloche",
    since: "2026-07-30",
    segment: "Nuevo",
  },
];

export const salesSeries = [
  { d: "Lun", ventas: 148000, pedidos: 12, clientes: 9 },
  { d: "Mar", ventas: 192400, pedidos: 17, clientes: 12 },
  { d: "Mié", ventas: 164800, pedidos: 14, clientes: 8 },
  { d: "Jue", ventas: 238600, pedidos: 22, clientes: 15 },
  { d: "Vie", ventas: 286400, pedidos: 28, clientes: 19 },
  { d: "Sáb", ventas: 174300, pedidos: 19, clientes: 11 },
  { d: "Dom", ventas: 80000, pedidos: 16, clientes: 7 },
];

export const categorySales = [
  { name: "Riñoneras", value: 412000 },
  { name: "Bolsos", value: 368500 },
  { name: "Mochilas", value: 261000 },
  { name: "Carteras", value: 158400 },
  { name: "Accesorios", value: 84600 },
];

export const topProducts = [
  { name: "Riñonera Cruzada 01", units: 84, revenue: 658560 },
  { name: "Mochila Diaria 10", units: 41, revenue: 549400 },
  { name: "Bolso Estructura 04", units: 32, revenue: 454400 },
  { name: "Porta Tarjetas 08", units: 76, revenue: 219640 },
  { name: "Cartera Sobre 07", units: 48, revenue: 223200 },
];

export type Promo = {
  code: string;
  type: "Porcentaje" | "Monto fijo" | "Envío gratis";
  value: string;
  uses: number;
  limit: number;
  from: string;
  to: string;
  active: boolean;
};

export const promos: Promo[] = [
  {
    code: "NAWEA10",
    type: "Porcentaje",
    value: "10%",
    uses: 214,
    limit: 500,
    from: "2026-07-01",
    to: "2026-09-30",
    active: true,
  },
  {
    code: "PRIMERA-COMPRA",
    type: "Monto fijo",
    value: "$8.000",
    uses: 96,
    limit: 300,
    from: "2026-01-01",
    to: "2026-12-31",
    active: true,
  },
  {
    code: "ENVIO0",
    type: "Envío gratis",
    value: "—",
    uses: 431,
    limit: 1000,
    from: "2026-08-01",
    to: "2026-08-31",
    active: true,
  },
  {
    code: "INVIERNO25",
    type: "Porcentaje",
    value: "25%",
    uses: 512,
    limit: 512,
    from: "2026-06-01",
    to: "2026-07-15",
    active: false,
  },
];
