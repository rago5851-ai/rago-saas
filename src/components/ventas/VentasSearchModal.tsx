"use client"

import { X, Search, Package2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"
import type { Product } from "./types"

type Props = {
  open: boolean
  onClose: () => void
  search: string
  onSearchChange: (v: string) => void
  filtered: Product[]
  loading: boolean
  onAddToCart: (p: Product, qty: number) => void
}

function formatStock(p: Product) {
  return p.unit === "pz"
    ? `${Number(p.stockLiters).toFixed(0)} unid.`
    : `${p.stockLiters.toFixed(1)} L`
}

export function VentasSearchModal({
  open,
  onClose,
  search,
  onSearchChange,
  filtered,
  loading,
  onAddToCart,
}: Props) {
  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0 gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                type="search"
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border-slate-200 text-sm"
                aria-label="Buscar producto"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-4 space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 rounded-2xl border border-slate-200/80 text-center">
                <Package2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-medium">Sin coincidencias</p>
                <p className="text-slate-400 text-sm mt-0.5">Prueba con otro nombre o código de barra</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((p, index) => {
                  const noStock = (p.unit === "pz" ? Math.floor(p.stockLiters) : p.stockLiters) <= 0
                  return (
                    <motion.button
                      key={p.id}
                      type="button"
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => {
                        if (noStock) return
                        onAddToCart(p, 1)
                        onClose()
                      }}
                      disabled={noStock}
                      className="w-full text-left bg-slate-50/80 rounded-xl border border-slate-200/80 p-3.5 pl-4 flex items-center justify-between gap-3 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all disabled:opacity-60 disabled:pointer-events-none active:scale-[0.99]"
                    >
                      <p className="font-bold text-slate-800 text-sm truncate flex-1 min-w-0">{p.name}</p>
                      <span className="text-sm font-bold text-blue-600 shrink-0">
                        ${p.salePrice.toFixed(2)}{p.unit === "pz" ? "" : "/L"}
                      </span>
                      <span className="text-xs text-slate-500 shrink-0 tabular-nums">
                        {formatStock(p)}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
