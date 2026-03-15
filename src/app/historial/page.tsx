"use client"

import { useEffect, useState, useMemo } from "react"
import { getSalesHistory } from "@/lib/actions/sales"
import { ArrowLeft, CalendarDays, Receipt, CheckCircle2, Banknote, CreditCard, ArrowRightLeft } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

const METHOD_ICON: Record<string, any> = {
  EFECTIVO: Banknote,
  TARJETA: CreditCard,
  TRANSFERENCIA: ArrowRightLeft,
}
const METHOD_STYLE: Record<string, string> = {
  EFECTIVO: "bg-emerald-500/10 text-emerald-600",
  TARJETA: "bg-blue-500/10 text-blue-600",
  TRANSFERENCIA: "bg-purple-500/10 text-purple-600",
}

export default function HistorialPage() {
  const todayISO = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Merida' })
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState(todayISO)

  useEffect(() => {
    setLoading(true)
    getSalesHistory(dateFilter).then(res => {
      if (res.success && res.data) setSales(res.data as any[])
      else setSales([])
      setLoading(false)
    })
  }, [dateFilter])

  const dayTotal = useMemo(() => sales.reduce((s, v) => s + (v.total || 0), 0), [sales])

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-4 lg:px-8 lg:py-5 shadow-sm">
        <div className="flex items-center gap-4 max-w-5xl mx-auto">
          <Link href="/" className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 hover:bg-slate-200 transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Historial de ventas</h1>
            <p className="text-xs text-slate-500 mt-0.5">Total del día: <span className="font-bold text-emerald-600">${dayTotal.toFixed(2)}</span></p>
          </div>
          <CalendarDays className="h-5 w-5 text-slate-400 shrink-0" />
        </div>
      </header>

      <main className="flex-1 p-5 pb-24 lg:p-8 lg:pb-8 max-w-5xl mx-auto w-full">
        <div className="mb-6">
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-full lg:max-w-xs h-12 rounded-xl border-2 border-slate-200 bg-white px-4 text-base font-semibold text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-pulse text-slate-400 font-medium">Cargando ventas...</div>
          </div>
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <Receipt className="h-14 w-14 mb-4 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">Sin ventas para esta fecha.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sales.map((sale: any, idx: number) => {
              const MethodIcon = METHOD_ICON[sale.paymentMethod] || Receipt
              const style = METHOD_STYLE[sale.paymentMethod] || "bg-slate-100 text-slate-600"
              const time = sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Merida" }) : "—"
              const hasChange = sale.paymentMethod === "EFECTIVO" && sale.change > 0

              return (
                <motion.div
                  key={sale.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${style}`}>
                        <MethodIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Venta #{sales.length - idx}</p>
                        <p className="text-sm text-slate-500">{time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-900">${sale.total?.toFixed(2)}</p>
                      <div className="flex gap-2 justify-end mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> Pagada
                        </span>
                        {hasChange && (
                          <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            Cambio: ${sale.change?.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-3 space-y-1 bg-slate-50/50">
                    {(sale.items || []).map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm text-slate-600">
                        <span className="truncate mr-4">{item.name}</span>
                        <span className="shrink-0">{item.quantity} L × ${item.pricePerLiter?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
