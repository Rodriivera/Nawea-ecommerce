/**
 * Seed de NAWEA: catálogo, promos, settings, imágenes (Storage),
 * usuario admin y pedidos demo.
 *
 * Requiere las credenciales en .env.local.
 * Ejecutar: npx tsx supabase/seed.ts
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  categoriesData,
  productsData,
  IMAGE_FILES,
  type ImageKey,
} from "../src/data/catalog-data";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const BUCKET = "product-images";

async function ensureBucket() {
  const { data: buckets } = await admin.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await admin.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (error) throw error;
    console.log(`Bucket "${BUCKET}" creado`);
  }
}

async function uploadImage(key: ImageKey): Promise<string> {
  const file = path.join(process.cwd(), IMAGE_FILES[key]);
  const buffer = fs.readFileSync(file);
  const objectPath = `products/${key}.jpg`;
  const { error } = await admin.storage.from(BUCKET).upload(objectPath, buffer, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw error;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

async function seedCatalog() {
  const urls: Record<ImageKey, string> = {} as never;
  for (const key of Object.keys(IMAGE_FILES) as ImageKey[]) {
    urls[key] = await uploadImage(key);
  }

  const { error: delCats } = await admin.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delCats) throw delCats;

  for (const [i, c] of categoriesData.entries()) {
    await admin.from("categories").insert({
      slug: c.slug,
      name: c.name,
      index: c.index,
      intro: c.intro,
      image_url: urls[c.image],
      sort_order: i,
    });
  }
  console.log(`Categorías: ${categoriesData.length}`);

  const { data: catRows } = await admin.from("categories").select("id, slug");
  const catId = (slug: string) => catRows!.find((c) => c.slug === slug)!.id;

  for (const p of productsData) {
    const { data: prod, error } = await admin
      .from("products")
      .insert({
        code: p.code,
        slug: p.slug,
        name: p.name,
        category_id: catId(p.category),
        price: p.price,
        compare_at: p.compareAt ?? null,
        badge: p.badge ?? null,
        description: p.description,
        features: p.features,
        materials: p.materials,
        dimensions: p.dimensions,
        care: p.care,
        sku: p.sku,
        stock: p.stock,
        reserved: 0,
        min_stock: p.minStock,
        sold: p.sold,
        status: p.status,
      })
      .select()
      .single();
    if (error) throw error;

    await admin.from("product_colors").insert(
      p.colors.map((c) => ({ product_id: prod.id, name: c.name, hex: c.hex })),
    );
    await admin.from("product_sizes").insert(
      p.sizes.map((s) => ({ product_id: prod.id, name: s })),
    );
    await admin.from("product_images").insert([
      { product_id: prod.id, url: urls[p.image], alt: p.name, position: 0 },
      { product_id: prod.id, url: urls[p.altImage], alt: p.name, position: 1 },
    ]);
  }
  console.log(`Productos: ${productsData.length}`);
}

async function seedPromos() {
  const { error } = await admin.from("promos").insert([
    {
      code: "NAWEA10",
      type: "PERCENTAGE",
      value: 10,
      minimum_amount: 0,
      max_discount: null,
      starts_at: "2026-07-01T00:00:00Z",
      expires_at: "2026-09-30T23:59:59Z",
      usage_limit: 500,
      uses: 214,
      active: true,
    },
    {
      code: "PRIMERA-COMPRA",
      type: "FIXED",
      value: 8000,
      minimum_amount: 0,
      max_discount: null,
      starts_at: "2026-01-01T00:00:00Z",
      expires_at: "2026-12-31T23:59:59Z",
      usage_limit: 300,
      uses: 96,
      active: true,
    },
    {
      code: "ENVIO0",
      type: "FREE_SHIPPING",
      value: 0,
      minimum_amount: 0,
      max_discount: null,
      starts_at: "2026-08-01T00:00:00Z",
      expires_at: "2026-08-31T23:59:59Z",
      usage_limit: 1000,
      uses: 431,
      active: true,
    },
    {
      code: "INVIERNO25",
      type: "PERCENTAGE",
      value: 25,
      minimum_amount: 0,
      max_discount: null,
      starts_at: "2026-06-01T00:00:00Z",
      expires_at: "2026-07-15T23:59:59Z",
      usage_limit: 512,
      uses: 512,
      active: false,
    },
  ]);
  if (error) throw error;
  console.log("Promos: 4");
}

async function seedSettings() {
  await admin.from("settings").upsert([
    {
      key: "shipping",
      value: { estandar: 7900, express: 12900, retiro: 0, free_threshold: 120000 },
    },
    { key: "reservation_ttl", value: { reservation_ttl_minutes: 20 } },
  ]);
  console.log("Settings: shipping + reservation_ttl (20 min)");
}

async function seedAdminUser() {
  const email = "admin@nawea.com";
  const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = existing?.users.find((u) => u.email === email);
  if (found) {
    console.log(`Admin ya existe: ${email}`);
    return;
  }
  const password = crypto.randomUUID().slice(0, 12) + "!Aa1";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;

  const { error: roleErr } = await admin.rpc("set_user_role", {
    p_user_id: data.user.id,
    p_role: "admin",
    p_admin_id: null,
  });
  if (roleErr) throw roleErr;

  console.log(`Admin creado: ${email} / ${password}  (cambiá esta contraseña)`);
}

type DemoOrder = {
  id: string;
  customer: string;
  email: string;
  date: string;
  items: { slug: string; qty: number }[];
  total: number;
  order_status: string;
  payment_status: string;
  payment_method: string;
  city: string;
};

const demoOrders: DemoOrder[] = [
  { id: "NW-2841", customer: "Malena Ríos", email: "malena.rios@mail.com", date: "2026-08-09", items: [{ slug: "rinonera-cruzada-01", qty: 1 }, { slug: "llavero-13", qty: 2 }], total: 108200, order_status: "PENDING", payment_status: "PENDING", payment_method: "MERCADO_PAGO", city: "Palermo, CABA" },
  { id: "NW-2840", customer: "Tomás Iribarne", email: "t.iribarne@mail.com", date: "2026-08-09", items: [{ slug: "mochila-diaria-10", qty: 1 }], total: 134000, order_status: "CONFIRMED", payment_status: "APPROVED", payment_method: "TRANSFER", city: "Rosario, Santa Fe" },
  { id: "NW-2839", customer: "Julieta Vergara", email: "ju.vergara@mail.com", date: "2026-08-08", items: [{ slug: "bolso-estructura-04", qty: 1 }, { slug: "porta-tarjetas-08", qty: 1 }], total: 170900, order_status: "PREPARING", payment_status: "APPROVED", payment_method: "MERCADO_PAGO", city: "Córdoba Capital" },
  { id: "NW-2838", customer: "Ignacio Ferrer", email: "nacho.ferrer@mail.com", date: "2026-08-07", items: [{ slug: "cartera-sobre-07", qty: 2 }], total: 93000, order_status: "SHIPPED", payment_status: "APPROVED", payment_method: "MERCADO_PAGO", city: "La Plata, BA" },
  { id: "NW-2837", customer: "Camila Otero", email: "camila.otero@mail.com", date: "2026-08-06", items: [{ slug: "bolso-hombro-05", qty: 1 }, { slug: "correa-intercambiable-14", qty: 1 }], total: 151400, order_status: "DELIVERED", payment_status: "APPROVED", payment_method: "TRANSFER", city: "Mendoza" },
  { id: "NW-2836", customer: "Bruno Aguirre", email: "bruno.ag@mail.com", date: "2026-08-05", items: [{ slug: "mochila-compacta-12", qty: 1 }], total: 89900, order_status: "CANCELLED", payment_status: "REJECTED", payment_method: "MERCADO_PAGO", city: "Bariloche, RN" },
  { id: "NW-2835", customer: "Sofía Lenn", email: "sofia.lenn@mail.com", date: "2026-08-05", items: [{ slug: "rinonera-tecnica-02", qty: 1 }, { slug: "estuche-15", qty: 1 }], total: 89800, order_status: "DELIVERED", payment_status: "APPROVED", payment_method: "MERCADO_PAGO", city: "Belgrano, CABA" },
  { id: "NW-2834", customer: "Andrés Quiroga", email: "a.quiroga@mail.com", date: "2026-08-04", items: [{ slug: "bandolera-16", qty: 1 }], total: 87400, order_status: "DELIVERED", payment_status: "APPROVED", payment_method: "TRANSFER", city: "Salta" },
];

async function seedDemoOrders() {
  const { data: prods } = await admin.from("products").select("id, slug, price, name");
  const prod = (slug: string) => prods!.find((p) => p.slug === slug)!;

  for (const o of demoOrders) {
    const subtotal = o.items.reduce((s, i) => s + prod(i.slug).price * i.qty, 0);
    const { data: order, error } = await admin
      .from("orders")
      .insert({
        number: o.id,
        customer_id: null,
        email: o.email,
        name: o.customer,
        shipping_address: { city: o.city },
        shipping_method: "estandar",
        shipping_cost: subtotal >= 120000 ? 0 : 7900,
        subtotal,
        discount: 0,
        total: subtotal + (subtotal >= 120000 ? 0 : 7900),
        order_status: o.order_status,
        payment_status: o.payment_status,
        payment_method: o.payment_method,
        payment_confirmed_at:
          o.payment_status === "APPROVED" ? `${o.date}T12:00:00Z` : null,
        reservation_expires_at: null,
        created_at: `${o.date}T10:00:00Z`,
      })
      .select()
      .single();
    if (error) throw error;

    await admin.from("order_items").insert(
      o.items.map((i) => ({
        order_id: order.id,
        product_id: prod(i.slug).id,
        name: prod(i.slug).name,
        color: null,
        size: null,
        qty: i.qty,
        unit_price: prod(i.slug).price,
        subtotal: prod(i.slug).price * i.qty,
      })),
    );
  }
  console.log(`Pedidos demo: ${demoOrders.length}`);
}

async function main() {
  await ensureBucket();
  await seedCatalog();
  await seedPromos();
  await seedSettings();
  await seedDemoOrders();
  await seedAdminUser();
  console.log("Seed completado");
}

main().catch((e) => {
  console.error("Seed falló:", e);
  process.exit(1);
});
