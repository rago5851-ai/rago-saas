"use client"

import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import type { Product } from "./types"

type CartItem = { product: Product; qty: number }

type Props = {
  cartItems: CartItem[]
  totalFinal: number
  hasIncompleteStock: boolean
  onUpdateQty: (productId: string, delta: number) => void
  onClearCart: () => void
  onCheckout: () => void
  variant: "sidebar" | "inline" | "minimal"
}

function formatStock(p: Product) {
  return p.unit === "pz"
    ? `${Number(p.stockLiters).toFixed(0)} unid.`
    : `${p.stockLiters.toFixed(1)} L`
}

export function VentasCartPanel({
  cartItems,
  totalFinal,
  hasIncompleteStock,
  onUpdateQty,
  onClearCart,
  onCheckout,
  variant,
}: Props) {
  const isEmpty = cartItems.length === 0

  if (variant === "minimal") {
    return null
  }

  const content = (
    <>
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <ShoppingCart className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Venta actual</h2>
            <p className="text-[10px] text-slate-300">
              {cartItems.length > 0 ? `${cartItems.reduce((s, i) => s + i.qty, 0)} producto(s)` : "Sin productos"}
            </p>
          </div>
        </div>
        {!isEmpty && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>
      <div className="p-4 space-y-4">
        {isEmpty ? (
          <div className="py-10 text-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
            <div className="inline-flex h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 items-center justify-center mb-3">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <p className="text-slate-600 font-medium">Carrito vacío</p>
            <p className="text-slate-400 text-xs mt-0.5">Busca y agrega productos para cobrar</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
              {cartItems.map((i) => (
                <motion.div
                  key={i.product.id}
                  layout
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-all ${
                    !i.product.id.startsWith("manual-") && i.qty > i.product.stockLiters
                      ? "bg-red-50/80 border-red-200"
                      : "bg-slate-50/80 border-slate-100"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 text-sm truncate">{i.product.name}</p>
                    <p className="text-xs text-slate-500">
                      ${i.product.salePrice.toFixed(2)}{i.product.unit === "pz" ? "" : "/L"} × {i.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(i.product.id, -1)}
                      className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                      aria-label="Disminuir cantidad"
                    >
                      {i.qty <= 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                    </button>
                    <span className="w-9 text-center font-bold text-slate-800 tabular-nums text-sm">{i.qty}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(i.product.id, 1)}
                      disabled={!i.product.id.startsWith("manual-") && i.qty >= i.product.stockLiters}
                      className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-slate-800 w-14 text-right tabular-nums">
                    ${(i.qty * i.product.salePrice).toFixed(2)}
                  </span>
                </motion.div>
              ))}
              </AnimatePresence>
            </div>
            <div className="pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-slate-600">Total a cobrar</span>
                <span className="text-2xl font-bold text-slate-900 tabular-nums">${totalFinal.toFixed(2)}</span>
              </div>
              {hasIncompleteStock && (
                <p className="text-xs font-semibold text-amber-600 mb-2">Revisar stock</p>
              )}
              <Button
                onClick={onCheckout}
                disabled={hasIncompleteStock}
                className="w-full h-12 font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 disabled:bg-slate-300 disabled:shadow-none transition-all"
                aria-label="Cobrar"
              >
                Cobrar
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  )

  const wrapperClass =
    variant === "sidebar"
      ? "bg-white rounded-2xl shadow-lg border border-slate-200/80 overflow-hidden ring-1 ring-black/[0.02]"
      : "bg-white rounded-2xl shadow-md border border-slate-200/80 overflow-hidden"

  return <div className={wrapperClass}>{content}</div>
}
