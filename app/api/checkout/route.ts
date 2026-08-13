import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        color: z.string().nullable().optional(),
        size: z.string().nullable().optional(),
        qty: z.number().int().positive(),
      }),
    )
    .min(1, "El pedido debe tener al menos un ítem"),
  contact: z.object({
    email: z.string().email("Email inválido"),
    name: z.string().min(1, "El nombre es requerido"),
    phone: z.string().optional().default(""),
  }),
  shipping: z.object({
    method: z.enum(["estandar", "express", "retiro"]),
    address: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        zip: z.string().optional(),
      })
      .optional()
      .default({}),
  }),
  promo: z.string().nullable().optional(),
  payment_method: z.enum(["MERCADO_PAGO", "TRANSFER"]).default("MERCADO_PAGO"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Datos de checkout inválidos", details: result.error.flatten() },
        { status: 400 },
      );
    }

    const data = result.data;

    // Detectar usuario autenticado si existe sesión
    const user = await getUser();
    const customerId = user ? user.id : null;

    // Ejecutar RPC atómica con service role
    const adminSupabase = createAdminClient();
    const { data: orderData, error: rpcError } = await adminSupabase.rpc(
      "create_order_with_reservation",
      {
        p_items: { lines: data.items },
        p_contact: data.contact,
        p_shipping: data.shipping,
        p_promo: data.promo ?? null,
        p_customer_id: customerId,
        p_payment_method: data.payment_method,
      },
    );

    if (rpcError) {
      return NextResponse.json(
        { error: rpcError.message || "Error al crear la orden" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      order_id: orderData.order_id,
      number: orderData.number,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      shipping_cost: orderData.shipping_cost,
      total: orderData.total,
      access_token: orderData.access_token,
      reservation_expires_at: orderData.reservation_expires_at,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error interno del servidor" },
      { status: 500 },
    );
  }
}
