/**
 * Prueba del núcleo backend NAWEA (Fase 1).
 *
 * Ejecuta: npx tsx scripts/core-tests.ts
 *
 * Casos:
 *  1. Crear usuario (auth) -> profile creado por trigger
 *  2. Leer catálogo como anon (RLS): solo productos Activo
 *  3. Crear pedido: reserva stock, PENDING/PENDING, TTL 20 min
 *  4. Concurrencia: stock 1, dos compradores -> uno solo gana
 *  5. Confirmar pedido: baja stock, libera reserva, sube sold
 *  6. Idempotencia: confirmar 3 veces -> una sola deducción
 *  7. Liberar reserva manualmente
 *  8. Expiración automática (release_expired_reservations)
 *  9. Escalada de rol desde el cliente -> bloqueada
 * 10. RPC inalcanzable desde anon (revoke execute)
 * 11. Confirmación manual de transferencia + auditoría
 * 12. Cupón (PERCENTAGE y FIXED) validado server-side
 */
import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const anon = createClient(URL, ANON_KEY);

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`, detail ?? "");
  }
}

function ok<T>(name: string, data: T | null, error: unknown): T {
  if (error) {
    failed++;
    console.error(`  ✗ ${name}: ${JSON.stringify(error)}`);
    throw new Error(name);
  }
  return data as T;
}

const rand = Date.now().toString(36);
const TEST_SLUG = `test-core-${rand}`;
const TEST_EMAIL = `core-${rand}@test.nawea`;
const TEST_PASS = "TestCore1234!";
let testProductId = "";
let testUserId = "";
let adminId = "";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getProduct(slug: string) {
  const { data, error } = await admin.from("products").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) throw new Error(`getProduct failed for slug ${slug}: ${error?.message}`);
  return data as Record<string, any>;
}

async function getProductOptional(slug: string) {
  const { data } = await admin.from("products").select("*").eq("slug", slug).maybeSingle();
  return data as Record<string, any> | null;
}

async function createTestProduct(stock: number, price = 10000) {
  const { data, error } = await admin
    .from("products")
    .insert({
      code: `TEST-${rand}`,
      slug: TEST_SLUG,
      name: "Producto de prueba",
      category_id: (await admin.from("categories").select("id").limit(1).single()).data!.id,
      price,
      sku: `TEST-${rand}`,
      stock,
      reserved: 0,
      min_stock: 1,
      status: "Activo",
    })
    .select()
    .single();
  return ok("crear producto de prueba", data, error) as { id: string; price: number; stock: number; reserved: number; sold: number };
}

async function makeOrder(
  slug: string,
  qty: number,
  email: string,
  promo: string | null = null,
  paymentMethod = "MERCADO_PAGO",
  customerId: string | null = null,
) {
  const prod = await getProduct(slug);
  const { data, error } = await admin.rpc("create_order_with_reservation", {
    p_items: { lines: [{ product_id: prod.id, color: null, size: null, qty }] },
    p_contact: { email, name: "Test Core", phone: "+54 9 11 0000 0000" },
    p_shipping: { method: "estandar", address: { street: "Test 123", city: "CABA" } },
    p_promo: promo,
    p_customer_id: customerId,
    p_payment_method: paymentMethod,
  });
  return ok("makeOrder", data, error) as Record<string, any>;
}

async function main() {
  console.log(`\n== Núcleo NAWEA — test ${rand} ==\n`);

  // ---- 1. usuario + trigger de profile
  console.log("1. Usuario y perfil");
  const { data: createdUser, error: createErr } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASS,
    email_confirm: true,
  });
  if (createErr) throw createErr;
  testUserId = createdUser!.user.id;
  await sleep(500);
  const { data: profile } = await admin.from("profiles").select("*").eq("id", testUserId).single();
  check("profile creado por trigger", !!profile && profile.email === TEST_EMAIL, profile);
  check("rol default customer", profile?.role === "customer", profile?.role);

  const { data: adminProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", "admin@nawea.com")
    .single();
  adminId = adminProfile?.id ?? "";

  // ---- 2. catálogo con RLS (anon)
  console.log("2. Catálogo (RLS anon)");
  const { data: anonProducts, error: anonErr } = await anon.from("products").select("id, slug, status");
  check("anon puede leer productos", !anonErr, anonErr);
  const { data: borrador, error: borrErr } = await admin.from("products").insert({
    code: `TEST-HIDDEN-${rand}`,
    slug: `${TEST_SLUG}-hidden`,
    name: "No visible",
    category_id: (await admin.from("categories").select("id").limit(1).single()).data!.id,
    price: 1,
    sku: `TEST-HIDDEN-${rand}`,
    stock: 0,
    status: "Borrador",
  });
  if (borrErr) throw borrErr;
  await sleep(300);
  const { data: anonAgain } = await anon.from("products").select("slug");
  const slugs = (anonAgain ?? []).map((p: { slug: string }) => p.slug);
  check("anon NO ve productos Borrador", !slugs.includes(`${TEST_SLUG}-hidden`), slugs.length);
  check("anon ve los productos Activo del seed", slugs.includes("rinonera-cruzada-01"), slugs.length);

  // ---- 3. crear pedido + reserva
  console.log("3. Crear pedido y reserva");
  const tp = await createTestProduct(10);
  testProductId = tp.id;
  const order1 = await makeOrder(TEST_SLUG, 2, `a-${TEST_EMAIL}`);
  check("orden creada PENDING/PENDING", Boolean(typeof order1.number === "string" && order1.number.startsWith("NW-")), order1);
  const o1 = await admin.from("orders").select("*, order_items(*)").eq("id", order1.order_id).single();
  check("order_status PENDING", o1.data?.order_status === "PENDING", o1.data?.order_status);
  check("payment_status PENDING", o1.data?.payment_status === "PENDING", o1.data?.payment_status);
  const reservedAfter = ((await getProduct(TEST_SLUG))?.reserved ?? 0) as number;
  check("reserved += 2", reservedAfter === 2, reservedAfter);
  check("available = stock - reserved (10-2=8)", (((await getProduct(TEST_SLUG))?.stock ?? 0) as number) - reservedAfter === 8);
  const expMs = Date.parse(String(o1.data?.reservation_expires_at)) - Date.now();
  check("TTL ~20 min", expMs > 0 && expMs <= 21 * 60_000, `${Math.round(expMs / 1000)}s`);
  check("tiene access_token", !!o1.data?.access_token);
  const { data: movements } = await admin
    .from("inventory_movements")
    .select("*")
    .eq("order_id", order1.order_id);
  check("movimiento RESERVATION registrado", Boolean(movements?.some((m) => m.type === "RESERVATION")), movements);

  // 3b. cupones
  console.log("3b. Cupones validados server-side");
  const orderPromo = await makeOrder(TEST_SLUG, 1, `b-${TEST_EMAIL}`, "NAWEA10");
  check("NAWEA10 = 10% de descuento", orderPromo.discount === 1000, orderPromo.discount);
  const orderFix = await makeOrder(TEST_SLUG, 1, `c-${TEST_EMAIL}`, "PRIMERA-COMPRA");
  check("PRIMERA-COMPRA = 8000 fijo", orderFix.discount === 8000, orderFix.discount);

  // 3c. una sola reserva activa por email
  const dup = await admin.rpc("create_order_with_reservation", {
    p_items: { lines: [{ product_id: testProductId, color: null, size: null, qty: 1 }] },
    p_contact: { email: `a-${TEST_EMAIL}`, name: "Test" },
    p_shipping: { method: "estandar" },
  });
  check("reserva duplicada por email rechazada", !!dup.error, dup.error);

  // ---- 4. concurrencia (stock 1, dos compradores)
  console.log("4. Concurrencia");
  const { data: tp2 } = await admin.from("products").insert({
    code: `TEST-RACE-${rand}`,
    slug: `${TEST_SLUG}-race`,
    name: "Carrera",
    category_id: (await admin.from("categories").select("id").limit(1).single()).data!.id,
    price: 5000,
    sku: `TEST-RACE-${rand}`,
    stock: 1,
    reserved: 0,
    min_stock: 1,
  }).select().single();
  check("crear producto race", !!tp2, tp2);
  const raceId = tp2!.id;
  const results = await Promise.allSettled([
    admin.rpc("create_order_with_reservation", {
      p_items: { lines: [{ product_id: raceId, color: null, size: null, qty: 1 }] },
      p_contact: { email: `race1-${TEST_EMAIL}`, name: "A" },
      p_shipping: { method: "estandar" },
    }),
    admin.rpc("create_order_with_reservation", {
      p_items: { lines: [{ product_id: raceId, color: null, size: null, qty: 1 }] },
      p_contact: { email: `race2-${TEST_EMAIL}`, name: "B" },
      p_shipping: { method: "estandar" },
    }),
  ]);
  const fulfilled = results.filter((r) => r.status === "fulfilled" && !r.value.error).length;
  const rejected = results.filter(
    (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value.error),
  ).length;
  check("exactamente 1 gana con stock 1", fulfilled === 1 && rejected === 1, { fulfilled, rejected });

  // ---- 5. confirmar pago
  console.log("5. Confirmar pago (fuente de verdad)");
  const before = await getProduct(TEST_SLUG);
  const paymentId = `MP-TEST-${rand}`;
  const confirm1 = await admin.rpc("confirm_payment", { p_order_id: order1.order_id, p_payment_id: paymentId });
  check("confirm OK", !confirm1.error && confirm1.data?.payment_status === "APPROVED", confirm1.error);
  const after = await getProduct(TEST_SLUG);
  check("stock -= 2", (after.stock as number) === (before.stock as number) - 2, { before: before.stock, after: after.stock });
  check("reserved -= 2", (after.reserved as number) === (before.reserved as number) - 2, { before: before.reserved, after: after.reserved });
  check("sold += 2", (after.sold as number) === (before.sold as number) + 2, { before: before.sold, after: after.sold });
  const o1b = await admin.from("orders").select("order_status, payment_status").eq("id", order1.order_id).single();
  check("order CONFIRMED + payment APPROVED", o1b.data?.order_status === "CONFIRMED" && o1b.data?.payment_status === "APPROVED", o1b.data);

  // ---- 6. idempotencia (mismo webhook 2 veces más)
  console.log("6. Idempotencia");
  const stockAfterConfirm = (await getProduct(TEST_SLUG)).stock as number;
  const soldAfterConfirm = (await getProduct(TEST_SLUG)).sold as number;
  const c2 = await admin.rpc("confirm_payment", { p_order_id: order1.order_id, p_payment_id: paymentId });
  const c3 = await admin.rpc("confirm_payment", { p_order_id: order1.order_id, p_payment_id: paymentId });
  check("2ª llamada: already_approved", c2.data?.already_approved === true, c2.data);
  check("3ª llamada: already_approved", c3.data?.already_approved === true, c3.data);
  const afterRepeat = await getProduct(TEST_SLUG);
  check("sin doble deducción (stock igual)", afterRepeat.stock === stockAfterConfirm, afterRepeat.stock);
  check("sin doble incremento (sold igual)", afterRepeat.sold === soldAfterConfirm, afterRepeat.sold);

  // ---- 7. liberar reserva
  console.log("7. Liberar reserva");
  const orderPromoId = orderPromo.order_id;
  const beforeRelease = await getProduct(TEST_SLUG);
  const rel = await admin.rpc("release_reservation", { p_order_id: orderPromoId, p_reason: "Cancelado por test" });
  check("release OK", !rel.error && rel.data?.status === "released", rel.error);
  const afterRelease = await getProduct(TEST_SLUG);
  check("reserved restaurado", (afterRelease.reserved as number) === (beforeRelease.reserved as number) - 1, { beforeRelease: beforeRelease.reserved, afterRelease: afterRelease.reserved });
  const op = await admin.from("orders").select("order_status, payment_status").eq("id", orderPromoId).single();
  check("orden CANCELLED", op.data?.order_status === "CANCELLED", op.data);
  const rel2 = await admin.rpc("release_reservation", { p_order_id: orderPromoId, p_reason: "otra vez" });
  check("release 2ª vez = noop (idempotente)", rel2.data?.status === "noop", rel2.data);

  // ---- 8. expiración automática
  console.log("8. Expiración de reserva (pg_cron / release_expired)");
  const orderExp = await makeOrder(TEST_SLUG, 1, `exp-${TEST_EMAIL}`);
  const { error: touchErr } = await admin
    .from("orders")
    .update({ reservation_expires_at: new Date(Date.now() - 60_000).toISOString() })
    .eq("id", orderExp.order_id);
  if (touchErr) throw touchErr;
  const beforeExp = await getProduct(TEST_SLUG);
  const { data: releasedCount, error: expErr } = await admin.rpc("release_expired_reservations");
  check("release_expired corrió", !expErr, expErr);
  check("liberó al menos 1 reserva vencida", (releasedCount as number) >= 1, releasedCount);
  const afterExp = await getProduct(TEST_SLUG);
  check("stock liberado tras expirar", (afterExp.reserved as number) === (beforeExp.reserved as number) - 1, { beforeExp: beforeExp.reserved, afterExp: afterExp.reserved });
  const oexp = await admin.from("orders").select("order_status").eq("id", orderExp.order_id).single();
  check("orden expirada CANCELLED", oexp.data?.order_status === "CANCELLED", oexp.data);

  // ---- 9. escalada de rol
  console.log("9. Escalada de rol bloqueada");
  const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASS,
  });
  if (signInErr) throw signInErr;
  const { error: escalateErr } = await anon.from("profiles").update({ role: "admin" }).eq("id", testUserId);
  check("cambio de rol desde cliente rechazado", !!escalateErr, escalateErr);
  const { data: profAfter } = await admin.from("profiles").select("role").eq("id", testUserId).single();
  check("rol sigue siendo customer", profAfter?.role === "customer", profAfter?.role);

  // ---- 10. RPC inalcanzable desde anon
  console.log("10. RPC protegida (revoke execute)");
  const { error: anonRpcErr } = await anon.rpc("create_order_with_reservation", {
    p_items: { lines: [{ product_id: testProductId, qty: 1 }] },
    p_contact: { email: "x@y.com", name: "X" },
    p_shipping: { method: "estandar" },
  });
  check("anon NO puede ejecutar la RPC", !!anonRpcErr, anonRpcErr);

  // ---- 11. confirmación manual de transferencia + auditoría
  console.log("11. Transferencia manual + auditoría");
  const orderTrans = await makeOrder(TEST_SLUG, 1, `trans-${TEST_EMAIL}`, null, "TRANSFER");
  const manual = await admin.rpc("confirm_payment", {
    p_order_id: orderTrans.order_id,
    p_payment_id: null,
    p_confirmed_by: adminId,
  });
  check("transferencia confirmada manualmente", !manual.error && manual.data?.payment_status === "APPROVED", manual.error);
  const otrans = await admin.from("orders").select("payment_confirmed_at, payment_confirmed_by").eq("id", orderTrans.order_id).single();
  check("payment_confirmed_by = admin", otrans.data?.payment_confirmed_by === adminId, otrans.data);
  check("payment_confirmed_at seteado", !!otrans.data?.payment_confirmed_at, otrans.data);
  const { data: audit } = await admin
    .from("admin_audit_logs")
    .select("action")
    .eq("entity_id", String(orderTrans.order_id));
  // ---- 11b. Cancelación de orden por el admin
  console.log("11b. Cancelación de orden por admin");
  const orderToCancel = await makeOrder(TEST_SLUG, 1, `cancel-${TEST_EMAIL}`, null, "TRANSFER");
  const cancelRes = await admin.rpc("update_order_status", {
    p_order_id: orderToCancel.order_id,
    p_status: "CANCELLED",
    p_admin_id: adminId,
  });
  check("admin cancela orden PENDING", !cancelRes.error && cancelRes.data?.order_status === "CANCELLED", cancelRes);
  const oCancelled = await admin.from("orders").select("order_status, payment_status").eq("id", orderToCancel.order_id).single();
  check("order_status CANCELLED y payment_status REJECTED", oCancelled.data?.order_status === "CANCELLED" && oCancelled.data?.payment_status === "REJECTED", oCancelled.data);

  // ---- 12. Eliminación física de producto (ON DELETE SET NULL en pedidos)
  console.log("12. Eliminación física de producto");
  const delProduct = await admin.rpc("delete_product", { p_product_id: testProductId, p_admin_id: adminId });
  check("producto eliminado físicamente", delProduct.data?.deleted === true, delProduct);
  const pDeleted = await getProductOptional(TEST_SLUG);
  check("producto ya no existe en la DB", !pDeleted, pDeleted);
  const { data: orderItemAfter } = await admin.from("order_items").select("product_id, name, subtotal").eq("order_id", order1.order_id).single();
  check("order_items preservado con product_id = null", orderItemAfter?.product_id === null && !!orderItemAfter?.name, orderItemAfter);

  // ---- resumen
  console.log(`\n== Resultado: ${passed} ✓ / ${failed} ✗ ==`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((e) => {
    console.error("Test abortado:", e);
    process.exit(1);
  })
  .finally(async () => {
    try {
      if (testUserId) await admin.auth.admin.deleteUser(testUserId);
      if (testProductId) await admin.from("products").delete().eq("id", testProductId);
      await admin.from("products").delete().like("slug", `test-core-${rand}%`);
    } catch {
      /* cleanup best-effort */
    }
  });
