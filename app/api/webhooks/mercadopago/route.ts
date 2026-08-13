import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";

function verifySignature(request: Request, bodyText: string): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return true; // Si no está configurado el secreto en dev, pasa la verificación

  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");

  if (!signatureHeader || !requestId) return false;

  const parts = signatureHeader.split(",");
  let ts = "";
  let v1 = "";

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key?.trim() === "ts") ts = value?.trim() ?? "";
    if (key?.trim() === "v1") v1 = value?.trim() ?? "";
  }

  if (!ts || !v1) return false;

  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "";

  // Formato manifest oficial de MP
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  return hmac === v1;
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const bodyText = await request.text();
    let body: any = {};

    try {
      if (bodyText) body = JSON.parse(bodyText);
    } catch {
      /* ignore JSON parse error */
    }

    if (!verifySignature(request, bodyText)) {
      console.warn("Firma de webhook Mercado Pago inválida");
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    // Extraer ID de pago del body o query params
    const paymentId =
      body?.data?.id ??
      url.searchParams.get("data.id") ??
      url.searchParams.get("id");

    const type = body?.type ?? body?.action ?? url.searchParams.get("type") ?? url.searchParams.get("topic");

    if (!paymentId || (type && !type.includes("payment"))) {
      // Notificaciones de otros tipos (merchant_order, etc.), respondemos 200
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!mpAccessToken) {
      console.warn("MERCADO_PAGO_ACCESS_TOKEN no configurado en servidor");
      return NextResponse.json({ status: "no_access_token" }, { status: 200 });
    }

    const mpClient = new MercadoPagoConfig({ accessToken: mpAccessToken });
    const paymentClient = new Payment(mpClient);

    const payment = await paymentClient.get({ id: String(paymentId) });
    if (!payment || !payment.external_reference) {
      return NextResponse.json({ status: "payment_not_found" }, { status: 200 });
    }

    const orderNumber = payment.external_reference;
    const adminSupabase = createAdminClient();

    // Obtener la orden de la base de datos
    const { data: order, error: orderError } = await adminSupabase
      .from("orders")
      .select("*")
      .eq("number", orderNumber)
      .single();

    if (orderError || !order) {
      console.error(`Orden no encontrada para external_reference ${orderNumber}`);
      return NextResponse.json({ status: "order_not_found" }, { status: 200 });
    }

    // Verificar monto del pago contra total de la orden
    if (payment.transaction_amount && payment.transaction_amount < order.total) {
      console.error(`Monto pagado (${payment.transaction_amount}) menor al total (${order.total})`);
      return NextResponse.json({ status: "amount_mismatch" }, { status: 200 });
    }

    if (payment.status === "approved") {
      // Confirmación atómica e idempotente por DB
      const { data: confirmRes, error: confirmErr } = await adminSupabase.rpc("confirm_payment", {
        p_order_id: order.id,
        p_payment_id: String(payment.id),
        p_confirmed_by: null,
      });

      if (confirmErr) {
        console.error("Error en confirm_payment RPC:", confirmErr);
      } else {
        console.log(`Orden ${order.number} confirmada exitosamente vía MP webhook:`, confirmRes);
      }
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      // Liberación de reserva atómica e idempotente
      const { data: releaseRes, error: releaseErr } = await adminSupabase.rpc("release_reservation", {
        p_order_id: order.id,
        p_reason: `Pago ${payment.status} en Mercado Pago`,
        p_payment_status: "REJECTED",
      });

      if (releaseErr) {
        console.error("Error en release_reservation RPC:", releaseErr);
      } else {
        console.log(`Reserva de orden ${order.number} liberada por pago rechazado:`, releaseRes);
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err: any) {
    console.error("Error procesando webhook de Mercado Pago:", err);
    // Responder 200 siempre para no trabar reintentos infructuosos de MP
    return NextResponse.json({ status: "error", error: err.message }, { status: 200 });
  }
}
