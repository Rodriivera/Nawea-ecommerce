import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    const user = await getUser();
    const adminSupabase = createAdminClient();

    const { data: order, error } = await adminSupabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Verificar autorización: token de acceso o usuario dueño de la orden
    const isOwner = user && order.customer_id === user.id;
    const hasValidToken = token && order.access_token === token;

    if (!isOwner && !hasValidToken) {
      return NextResponse.json(
        { error: "Acceso no autorizado a esta orden" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        number: order.number,
        email: order.email,
        name: order.name,
        phone: order.phone,
        total: order.total,
        subtotal: order.subtotal,
        discount: order.discount,
        shipping_cost: order.shipping_cost,
        shipping_method: order.shipping_method,
        shipping_address: order.shipping_address,
        order_status: order.order_status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        reservation_expires_at: order.reservation_expires_at,
        created_at: order.created_at,
        items: order.order_items || [],
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al obtener la orden" },
      { status: 500 },
    );
  }
}
