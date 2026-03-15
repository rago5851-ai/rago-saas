"use client"

import { Star, Phone, X, UserPlus } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

type Customer = { id?: string; name?: string; phone?: string; points?: number }

type Props = {
  customerPhone: string
  onCustomerPhoneChange: (v: string) => void
  selectedCustomer: Customer | null
  onClearCustomer: () => void
  searchingCustomer: boolean
}

export function VentasLoyaltyCard({
  customerPhone,
  onCustomerPhoneChange,
  selectedCustomer,
  onClearCustomer,
  searchingCustomer,
}: Props) {
  return (
    <section className="bg-white rounded-2xl shadow-md border border-slate-200/80 overflow-hidden ring-1 ring-black/[0.02]">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 border-b border-amber-100/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-400/20 flex items-center justify-center shrink-0">
            <Star className="h-4 w-4 text-amber-600 fill-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Lealtad Rago</p>
            <p className="text-[10px] text-slate-500">Opcional · Teléfono para puntos</p>
          </div>
        </div>
        {selectedCustomer != null && (
          <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200/80">
            {selectedCustomer.points ?? 0} pts
          </span>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            type="tel"
            placeholder="Teléfono del cliente (10 dígitos)"
            value={customerPhone}
            onChange={(e) => onCustomerPhoneChange(e.target.value)}
            className="pl-11 h-12 rounded-xl border-slate-200/80 bg-slate-50/50 text-sm font-medium placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-400 transition-all"
            aria-label="Teléfono del cliente"
          />
          {searchingCustomer && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
        <AnimatePresence mode="wait">
          {selectedCustomer != null ? (
            <motion.div
              key="customer"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="flex items-center justify-between bg-emerald-50/90 p-3.5 rounded-xl border border-emerald-200/80 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-emerald-900 truncate">{selectedCustomer.name ?? "Cliente"}</p>
                <p className="text-[10px] text-emerald-600 font-semibold">Cliente frecuente</p>
              </div>
              <button
                type="button"
                onClick={onClearCustomer}
                className="h-8 w-8 rounded-lg bg-white/80 border border-emerald-200 flex items-center justify-center text-emerald-500 hover:bg-emerald-100 transition-colors shrink-0"
                aria-label="Quitar cliente"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ) : customerPhone.length >= 10 && !searchingCustomer ? (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50"
            >
              <p className="text-xs font-medium text-slate-500">No registrado</p>
              <Link href="/clientes">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1.5 shrink-0"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Registrar
                </Button>
              </Link>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  )
}
