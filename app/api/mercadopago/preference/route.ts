import { NextResponse } from "next/server";
import { z } from "zod";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";

const preferenceSchema = z.object({
  order_id: z.string().uuid("ID de orden inválido"),
  access_token: z.string().uuid("Token de acceso inválido"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = preferenceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: result.error.flatten() },
        { status: 400 },
      );
    }

    const { order_id, access_token } = result.data;
    const adminSupabase = createAdminClient();

    // Obtener la orden y validar token de acceso
    const { data: order, error: orderError } = await adminSupabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", order_id)
      .eq("access_token", access_token)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Orden no encontrada o token inválido" },
        { status: 404 },
      );
    }

    if (order.order_status !== "PENDING" || order.payment_status !== "PENDING") {
      return NextResponse.json(
        { error: "La orden no se encuentra en estado pendiente de pago" },
        { status: 400 },
      );
    }

    if (order.reservation_expires_at && new Date(order.reservation_expires_at) < new Date()) {
      return NextResponse.json(
        { error: "La reserva de esta orden ha expirado" },
        { status: 400 },
      );
    }

    const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "TEST-ACCESS-TOKEN";
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

    const mpClient = new MercadoPagoConfig({ accessToken: mpAccessToken });
    const preference = new Preference(mpClient);

    const items = (order.order_items || []).map((item: any) => ({
      id: item.product_id,
      title: `${item.name}${item.color ? ` (${item.color})` : ""}${item.size ? ` [${item.size}]` : ""}`,
      quantity: item.qty,
      unit_price: Number(item.unit_price),
      currency_id: "ARS",
    }));

    if (order.shipping_cost > 0) {
      items.push({
        id: "shipping",
        title: `Envío ${order.shipping_method}`,
        quantity: 1,
        unit_price: Number(order.shipping_cost),
        currency_id: "ARS",
      });
    }

    const mpResponse = await preference.create({
      body: {
        items,
        external_reference: order.number,
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        back_urls: {
          success: `${appUrl}/success?id=${order.id}&token=${order.access_token}`,
          pending: `${appUrl}/success?id=${order.id}&token=${order.access_token}`,
          failure: `${appUrl}/success?id=${order.id}&token=${order.access_token}`,
        },
        auto_return: "approved",
      },
    });

    // Guardar preference_id en la orden
    if (mpResponse.id) {
      await adminSupabase
        .from("orders")
        .update({ preference_id: mpResponse.id })
        .eq("id", order.id);
    }

    return NextResponse.json({
      success: true,
      preference_id: mpResponse.id,
      init_point: mpResponse.init_point,
      sandbox_init_point: mpResponse.sandbox_init_point,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al generar la preferencia de Mercado Pago" },
      { status: 500 },
    );
  }
}
