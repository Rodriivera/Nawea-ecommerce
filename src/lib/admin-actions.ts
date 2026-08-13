"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Validador interno de rol de administrador.
 * Realiza una consulta fresca a la DB (no confía solo en cookies/claims).
 */
async function verifyAdminRole() {
  const user = await getUser();
  if (!user) {
    throw new Error("No autenticado");
  }

  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("Acceso denegado: se requieren permisos de administrador");
  }

  return { user, adminId: user.id, adminSupabase };
}

// ==========================================
// 1. PRODUCTOS
// ==========================================
export async function saveProductAction(productData: any) {
  const { adminId, adminSupabase } = await verifyAdminRole();

  const { data, error } = await adminSupabase.rpc("save_product", {
    p_product: productData,
    p_admin_id: adminId,
  });

  if (error) {
    throw new Error(error.message || "Error al guardar el producto");
  }

  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
  revalidatePath("/");
  return { success: true, result: data };
}

export async function deleteProductAction(productId: string) {
  const { adminId, adminSupabase } = await verifyAdminRole();

  const { data, error } = await adminSupabase.rpc("delete_product", {
    p_product_id: productId,
    p_admin_id: adminId,
  });

  if (error) {
    throw new Error(error.message || "Error al eliminar el producto");
  }

  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
  revalidatePath("/");
  return { success: true, result: data };
}

// ==========================================
// 2. INVENTARIO
// ==========================================
export async function adjustStockAction(
  productId: string,
  quantity: number,
  type: "IN" | "RETURN" | "ADJUST",
  reason: string = "Ajuste de inventario desde panel admin",
) {
  const { adminId, adminSupabase } = await verifyAdminRole();

  const { data, error } = await adminSupabase.rpc("adjust_stock", {
    p_product_id: productId,
    p_quantity: quantity,
    p_type: type,
    p_reason: reason,
    p_admin_id: adminId,
  });

  if (error) {
    throw new Error(error.message || "Error al ajustar el inventario");
  }

  revalidatePath("/admin/inventario");
  revalidatePath("/admin/productos");
  return { success: true, result: data };
}

// ==========================================
// 3. PEDIDOS
// ==========================================
export async function updateOrderStatusAction(orderId: string, status: string) {
  const { adminId, adminSupabase } = await verifyAdminRole();

  const { data, error } = await adminSupabase.rpc("update_order_status", {
    p_order_id: orderId,
    p_status: status,
    p_admin_id: adminId,
  });

  if (error) {
    throw new Error(error.message || "Error al actualizar el estado del pedido");
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/cuenta");
  return { success: true, result: data };
}

export async function confirmManualPaymentAction(orderId: string) {
  const { adminId, adminSupabase } = await verifyAdminRole();

  const { data, error } = await adminSupabase.rpc("confirm_payment", {
    p_order_id: orderId,
    p_payment_id: null,
    p_confirmed_by: adminId,
  });

  if (error) {
    throw new Error(error.message || "Error al confirmar el pago manual");
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/cuenta");
  return { success: true, result: data };
}

// ==========================================
// 4. CLIENTES Y ROLES
// ==========================================
export async function setUserRoleAction(targetUserId: string, role: "customer" | "admin") {
  const { adminId, adminSupabase } = await verifyAdminRole();

  const { data, error } = await adminSupabase.rpc("set_user_role", {
    p_user_id: targetUserId,
    p_role: role,
    p_admin_id: adminId,
  });

  if (error) {
    throw new Error(error.message || "Error al cambiar el rol del usuario");
  }

  revalidatePath("/admin/clientes");
  return { success: true, result: data };
}

// ==========================================
// 5. PROMOCIONES
// ==========================================
export async function savePromoAction(promoData: any) {
  const { adminId, adminSupabase } = await verifyAdminRole();

  const { data, error } = await adminSupabase.rpc("save_promo", {
    p_promo: promoData,
    p_admin_id: adminId,
  });

  if (error) {
    throw new Error(error.message || "Error al guardar la promoción");
  }

  revalidatePath("/admin/promociones");
  return { success: true, result: data };
}

export async function deletePromoAction(code: string) {
  const { adminId, adminSupabase } = await verifyAdminRole();

  const { data, error } = await adminSupabase.rpc("delete_promo", {
    p_code: code,
    p_admin_id: adminId,
  });

  if (error) {
    throw new Error(error.message || "Error al eliminar la promoción");
  }

  revalidatePath("/admin/promociones");
  return { success: true, result: data };
}

// ==========================================
// 6. CONFIGURACIÓN
// ==========================================
export async function saveSettingsAction(key: string, value: any) {
  const { adminId, adminSupabase } = await verifyAdminRole();

  const { data, error } = await adminSupabase.rpc("save_settings", {
    p_key: key,
    p_value: value,
    p_admin_id: adminId,
  });

  if (error) {
    throw new Error(error.message || "Error al guardar la configuración");
  }

  revalidatePath("/admin/configuracion");
  return { success: true, result: data };
}

// ==========================================
// 7. CATEGORÍAS
// ==========================================
export async function saveCategoryAction(categoryData: any) {
  const { adminId, adminSupabase } = await verifyAdminRole();

  const { data, error } = await adminSupabase.rpc("save_category", {
    p_category: categoryData,
    p_admin_id: adminId,
  });

  if (error) {
    throw new Error(error.message || "Error al guardar la categoría");
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/catalogo");
  revalidatePath("/");
  return { success: true, result: data };
}

export async function deleteCategoryAction(categoryId: string) {
  const { adminId, adminSupabase } = await verifyAdminRole();

  const { data, error } = await adminSupabase.rpc("delete_category", {
    p_category_id: categoryId,
    p_admin_id: adminId,
  });

  if (error) {
    throw new Error(error.message || "Error al eliminar la categoría");
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/catalogo");
  revalidatePath("/");
  return { success: true, result: data };
}
