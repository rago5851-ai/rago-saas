"use client"

import { useEffect, useState, useMemo } from "react"
import { getSalesHistory } from "@/lib/actions/sales"
import { ArrowLeft, CalendarDays, Receipt, CheckCircle2, Banknote, CreditCard, ArrowRightLeft } from "lucide-react"
import Link from "next/link"

const METHOD_ICON: Record<string, any> = {
  EFECTIVO: Banknote,
  TARJETA: CreditCard,
  TRANSFERENCIA: ArrowRightLeft,
}
const METHOD_COLOR: Record<string, string> = {
  EFECTIVO: "bg-emerald-100 text-emerald-700",
  TARJETA: "bg-blue-100 text-blue-700",
  TRANSFERENCIA: "bg-purple-100 text-purple-700",
}

export default function HistorialPage() {
  const todayISO = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Merida' }) // Hoy en Merida
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-4 shadow-sm flex items-center gap-3">
        <Link href="/" className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Historial de Ventas</h1>
          <p className="text-xs text-gray-500">Total del día: <span className="font-bold text-emerald-600">${dayTotal.toFixed(2)}</span></p>
        </div>
        <CalendarDays className="h-5 w-5 text-gray-400 shrink-0" />
      </header>

      {/* Date picker */}
      <div className="px-4 pt-4">
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="w-full h-12 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:outline-none px-4 text-base font-bold text-gray-800 bg-white"
        />
      </div>

      <main className="flex-1 p-4 pb-24 space-y-3">
        {loading ? (
          <div className="text-center text-gray-400 font-medium pt-10">Cargando ventas...</div>
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-white rounded-2xl border border-dashed mt-4">
            <Receipt className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-sm font-medium">Sin ventas para esta fecha.</p>
          </div>
        ) : (
          sales.map((sale: any, idx: number) => {
            const MethodIcon = METHOD_ICON[sale.paymentMethod] || Receipt
            const methodColor = METHOD_COLOR[sale.paymentMethod] || "bg-gray-100 text-gray-600"
            const time = sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Merida" }) : "—"
            const hasChange = sale.paymentMethod === "EFECTIVO" && sale.change > 0

            return (
              <div key={sale.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Sale header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${methodColor}`}>
                      <MethodIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Venta #{sales.length - idx}</p>
                      <p className="text-xs text-gray-400">{time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-gray-900">${sale.total?.toFixed(2)}</p>
                    <div className="flex gap-1 justify-end mt-0.5">
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Pagada
                      </span>
                      {hasChange && (
                        <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">
                          Cambio: ${sale.change?.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="px-4 py-2 space-y-1">
                  {(sale.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs text-gray-500">
                      <span className="truncate mr-2">{item.name}</span>
                      <span className="shrink-0">{item.quantity} L × ${item.pricePerLiter?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </main>
    </div>
  )
}
