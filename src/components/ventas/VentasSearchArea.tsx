"use client"

import { Search, Plus, Package2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"
import type { Product } from "./types"

const QUICK_CHIPS = ["Cloro", "Jabón", "Multiusos", "Desinfectante"]

type Props = {
  search: string
  onSearchChange: (v: string) => void
  filtered: Product[]
  loading: boolean
  isInCart: (productId: string) => boolean
  onAddToCart: (p: Product) => void
}

function formatStock(p: Product) {
  return p.unit === "pz"
    ? `${Number(p.stockLiters).toFixed(0)} unid.`
    : `${p.stockLiters.toFixed(1)} L`
}

export function VentasSearchArea({
  search,
  onSearchChange,
  filtered,
  loading,
  isInCart,
  onAddToCart,
}: Props) {
  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {search.trim() === "" ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 lg:p-10 text-center"
          >
            <div className="inline-flex h-14 w-14 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] items-center justify-center mb-4 shadow-sm">
              <Search className="h-7 w-7" />
            </div>
            <p className="text-slate-600 font-semibold">Escribe en la barra para buscar productos</p>
            <p className="text-slate-400 text-sm mt-1">Ej: Cloro, Jabón, Multiusos, Desinfectante</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {QUICK_CHIPS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onSearchChange(label)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
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
                {filtered.map((p, index) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-white rounded-xl border border-slate-200/80 p-3.5 pl-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all"
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
                    <button
                      type="button"
                      onClick={() => onAddToCart(p)}
                      disabled={isInCart(p.id)}
                      className="h-10 w-10 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none transition-all active:scale-95"
                      aria-label={`Agregar ${p.name} al carrito`}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
