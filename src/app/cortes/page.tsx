"use client"

import { useEffect, useState } from "react"
import { getCashCutsHistory } from "@/lib/actions/reports"
import { ArrowLeft, History, User, Banknote, Calendar, ChevronDown, CheckCircle2, AlertCircle, TrendingDown } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function CortesHistoryPage() {
  const [cuts, setCuts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await getCashCutsHistory()
      if (res.success && res.data) setCuts(res.data)
      setLoading(false)
    }
    load()
  }, [])

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  // Helper for skeleton loader
  const SkeletonCard = () => (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 animate-pulse">
      <div className="h-10 w-24 bg-gray-100 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 bg-gray-100 rounded" />
        <div className="h-4 w-32 bg-gray-100 rounded" />
      </div>
      <div className="h-6 w-20 bg-gray-100 rounded-full" />
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-4 shadow-sm flex items-center gap-3">
        <Link href="/reportes" className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Historial de Cortes</h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Auditoría de Caja</p>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-3 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
            </motion.div>
          ) : cuts.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <History className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-bold">No hay cortes registrados</p>
            </div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {cuts.map(cut => {
                const date = new Date(cut.createdAt)
                const isExact = Math.abs(cut.difference) < 0.01
                const isPositive = cut.difference > 0

                return (
                  <motion.div 
                    layout
                    key={cut.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <button 
                      onClick={() => toggleExpand(cut.id)}
                      className="w-full p-4 flex items-center gap-4 text-left group"
                    >
                      {/* Lado Izquierdo: Fecha */}
                      <div className="flex flex-col items-center justify-center bg-blue-50 px-3 py-2 rounded-xl shrink-0 min-w-[70px]">
                        <span className="text-[10px] font-black text-blue-600 uppercase mb-0.5">{format(date, "MMM", { locale: es })}</span>
                        <span className="text-xl font-black text-blue-700 leading-none">{format(date, "dd")}</span>
                        <span className="text-[8px] font-bold text-blue-500 mt-1">{format(date, "HH:mm")}</span>
                      </div>

                      {/* Centro: Usuario */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-gray-400 mb-0.5">
                          <User className="h-3 w-3" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Realizado por</span>
                        </div>
                        <h3 className="font-bold text-gray-900 truncate uppercase text-sm">{cut.userName}</h3>
                      </div>

                      {/* Lado Derecho: Badge */}
                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 ${
                          isExact ? "bg-emerald-50 text-emerald-600" : 
                          isPositive ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                        }`}>
                          {isExact ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          {isExact ? "Sin diferencia" : isPositive ? `$${cut.difference.toFixed(2)} Sobrante` : `$${Math.abs(cut.difference).toFixed(2)} Faltante`}
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedId === cut.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-5 border-t border-gray-50 pt-4 bg-gray-50/30"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total Esperado</span>
                                <span className="text-sm font-bold text-gray-700">${cut.expectedEfectivo?.toFixed(2)}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Recuento Manual</span>
                                <span className="text-sm font-bold text-gray-900">${cut.manualCount?.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Diferencia</span>
                                <span className={`text-sm font-black ${isExact ? "text-emerald-600" : isPositive ? "text-amber-600" : "text-red-500"}`}>
                                  {isPositive ? "+" : ""}${cut.difference?.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex flex-col bg-[#2563eb]/5 p-2 rounded-xl border border-blue-100">
                                <span className="text-[8px] font-black text-[#2563eb] uppercase tracking-widest">Cantidad Retirada</span>
                                <span className="text-lg font-black text-[#2563eb]">${cut.withdrawAmount?.toFixed(2) || "0.00"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase bg-white/50 p-2 rounded-lg">
                            <TrendingDown className="h-3 w-3" />
                            Quedó en caja: <span className="text-indigo-600 font-black">${cut.cashRetained?.toFixed(2) || "0.00"}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
