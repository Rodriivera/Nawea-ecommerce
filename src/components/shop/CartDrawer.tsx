"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { useShop } from "@/store/shop";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    lineProduct,
    setQty,
    removeLine,
    subtotal,
    shipping,
    total,
    lastAdded,
  } = useShop();

  return (
    <>
      <div
        onClick={() => setCartOpen(false)}
        className={cn(
          "fixed inset-0 z-[80] bg-foreground/25 backdrop-blur-[2px] transition-opacity duration-500 ease-nawea",
          cartOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        aria-hidden={!cartOpen}
        className={cn(
          "fixed right-0 top-0 z-[90] flex h-dvh w-full max-w-[460px] flex-col bg-background transition-transform duration-[550ms] ease-nawea",
          cartOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-baseline gap-3">
            <h2 className="display text-2xl">Carrito</h2>
            <span className="label-xs text-muted-foreground">
              {cart.length} {cart.length === 1 ? "ítem" : "ítems"}
            </span>
          </div>
          <button type="button" aria-label="Cerrar carrito" onClick={() => setCartOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="display-md">Vacío</p>
            <p className="text-sm text-muted-foreground">
              Todavía no elegiste ninguna pieza.
            </p>
            <Link
              href="/catalogo"
              onClick={() => setCartOpen(false)}
              className="label-xs mt-2 border-b border-foreground pb-1"
            >
              Ver la colección
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {cart.map((line) => {
              const p = lineProduct(line);
              if (!p) return null;
              return (
                <div
                  key={line.key}
                  className={cn(
                    "flex gap-4 border-b border-border px-6 py-5 transition-colors duration-700",
                    lastAdded === line.slug && "bg-cream",
                  )}
                >
                  <Link
                    href={`/producto/${p.slug}`}
                    onClick={() => setCartOpen(false)}
                    className="relative block h-28 w-20 shrink-0 overflow-hidden bg-cream"
                  >
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="shrink-0 text-sm tabular-nums">
                          {money(p.price * line.qty)}
                        </p>
                      </div>
                      <p className="label-xs mt-1.5 text-muted-foreground">
                        {line.color} · {line.size}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-border">
                        <button
                          type="button"
                          aria-label="Quitar uno"
                          className="cursor-pointer rounded-l-full p-2 transition-colors hover:bg-cream"
                          onClick={() => setQty(line.key, line.qty - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums">{line.qty}</span>
                        <button
                          type="button"
                          aria-label="Agregar uno"
                          className="cursor-pointer rounded-r-full p-2 transition-colors hover:bg-cream"
                          onClick={() => setQty(line.key, line.qty + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        className="label-xs text-red-500 transition-colors cursor-pointer hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {cart.length > 0 && (
          <div className="border-t border-border px-6 py-6">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Envío</dt>
                <dd className="tabular-nums">{shipping === 0 ? "Gratis" : money(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <dt className="label-sm">Total</dt>
                <dd className="tabular-nums">{money(total)}</dd>
              </div>
            </dl>
            <Link
              href="/checkout"
              onClick={() => setCartOpen(false)}
              className="label-sm mt-6 flex w-full items-center justify-center bg-foreground py-4 text-background transition-colors duration-300 hover:bg-accent rounded-full"
            >
              Finalizar compra
            </Link>
            <p className="label-xs mt-3 text-center text-muted-foreground">
              Envío gratis desde {money(120000)}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

