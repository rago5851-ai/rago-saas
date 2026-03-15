"use client"

import { useState } from "react"
import { Search, Plus, Minus, Package2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"
import type { Product } from "./types"

type Props = {
  search: string
  onSearchChange: (v: string) => void
  filtered: Product[]
  loading: boolean
  isInCart: (productId: string) => boolean
  onAddToCart: (p: Product, qty: number) => void
}

function formatStock(p: Product) {
  return p.unit === "pz"
    ? `${Number(p.stockLiters).toFixed(0)} unid.`
    : `${p.stockLiters.toFixed(1)} L`
}

function clampQty(p: Product, value: number): number {
  const max = p.unit === "pz" ? Math.floor(p.stockLiters) : p.stockLiters
  return Math.max(1, Math.min(value, max))
}

export function VentasSearchArea({
  search,
  onSearchChange,
  filtered,
  loading,
  isInCart,
  onAddToCart,
}: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const setQty = (productId: string, product: Product, deltaOrValue: number | "set", value?: number) => {
    setQuantities((prev) => {
      const current = prev[productId] ?? 1
      const next =
        deltaOrValue === "set" && value !== undefined
          ? value
          : current + (deltaOrValue as number)
      return { ...prev, [productId]: clampQty(product, next) }
    })
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {search.trim() === "" ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-slate-400 text-sm py-2 px-1"
          >
            Escribe en la barra de arriba para buscar
          </motion.p>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-2"
          >
            <h2 className="text-xs font-bold text-slate-500 px-1 flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              Resultados
            </h2>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-slate-200/80 text-center shadow-sm">
                <Package2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-medium">Sin coincidencias</p>
                <p className="text-slate-400 text-sm mt-0.5">Prueba con otro nombre o código de barra</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((p, index) => {
                  const qty = quantities[p.id] ?? 1
                  const maxQty = p.unit === "pz" ? Math.floor(p.stockLiters) : p.stockLiters
                  const noStock = maxQty <= 0
                  return (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-white rounded-xl border border-slate-200/80 p-3.5 pl-4 flex flex-wrap items-center justify-between gap-3 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 text-sm truncate">{p.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-sm font-bold text-blue-600">
                            ${p.salePrice.toFixed(2)}{p.unit === "pz" ? "" : "/L"}
                          </span>
                          <span className="text-xs text-slate-400">{formatStock(p)} disp.</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/80">
                          <button
                            type="button"
                            onClick={() => setQty(p.id, p, -1)}
                            disabled={qty <= 1 || noStock}
                            className="h-9 w-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none rounded-l-xl transition-colors"
                            aria-label="Menos"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-[2rem] text-center text-sm font-bold text-slate-800 tabular-nums">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(p.id, p, 1)}
                            disabled={qty >= maxQty || noStock}
                            className="h-9 w-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none rounded-r-xl transition-colors"
                            aria-label="Más"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onAddToCart(p, qty)
                            setQuantities((prev) => ({ ...prev, [p.id]: 1 }))
                          }}
                          disabled={noStock}
                          className="h-9 px-4 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-semibold shadow-md shadow-blue-500/25 flex items-center gap-1.5 shrink-0 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none transition-all active:scale-95"
                          aria-label={`Agregar ${qty} de ${p.name} al carrito`}
                        >
                          <Plus className="h-4 w-4" />
                          Agregar
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
