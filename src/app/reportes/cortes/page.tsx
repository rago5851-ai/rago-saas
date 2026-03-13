"use client"

import { useEffect, useState } from "react"
import { getCashCutsHistory } from "@/lib/actions/reports"
import { ArrowLeft, ClipboardList, ChevronDown, Banknote } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function CortesPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCutId, setExpandedCutId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await getCashCutsHistory()
      if (res.success) setData(res.data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto w-full">
          <Link href="/reportes">
            <Button variant="ghost" size="icon" className="rounded-2xl bg-gray-50">
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </Button>
          </Link>
          <h1 className="text-lg font-black text-gray-900">Historial de Cortes</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
            </div>
          ) : data.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                <ClipboardList className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-400 font-bold text-sm">No hay cortes registrados</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {data.map(cut => {
                const isExact = Math.abs(cut.difference) < 0.01;
                const isPositive = cut.difference > 0;
                const isExpanded = expandedCutId === cut.id;
                
                return (
                  <div key={cut.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button 
                      onClick={() => setExpandedCutId(isExpanded ? null : cut.id)} 
                      className="w-full p-4 flex items-center gap-4 text-left hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="bg-blue-50 px-3 py-2 rounded-xl shrink-0 min-w-[65px] flex flex-col items-center">
                        <span className="text-[8px] font-black text-blue-600 uppercase">
                          {format(new Date(cut.createdAt), "MMM", { locale: es })}
                        </span>
                        <span className="text-lg font-black text-blue-700 leading-none">
                          {format(new Date(cut.createdAt), "dd")}
                        </span>
                      </div>
                      <div className="flex-1 truncate">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{cut.userName}</p>
                        <p className="font-bold text-gray-900 text-sm truncate">{format(new Date(cut.createdAt), "HH:mm")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${isExact ? "bg-emerald-50 text-emerald-600" : isPositive ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
                          {isExact ? "Ok" : isPositive ? `+$${Number(cut.difference).toFixed(2)}` : `-$${Math.abs(Number(cut.difference)).toFixed(2)}`}
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-5 border-t border-gray-50 pt-4 bg-gray-50/30 space-y-4"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Monto Esperado</span>
                                <span className="text-sm font-bold text-gray-700">${Number(cut.expectedEfectivo || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Recuento Manual</span>
                                <span className="text-sm font-bold text-gray-900">${Number(cut.manualCount || 0).toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Diferencia</span>
                                <span className={`text-sm font-black ${isExact ? "text-emerald-600" : isPositive ? "text-amber-600" : "text-red-500"}`}>
                                  {isPositive ? "+" : ""}${Number(cut.difference || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex flex-col bg-[#2563eb]/5 p-2 rounded-xl border border-blue-100">
                                <span className="text-[8px] font-black text-[#2563eb] uppercase tracking-widest">Retiro Real</span>
                                <span className="text-lg font-black text-[#2563eb]">${Number(cut.withdrawAmount || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 text-gray-500 uppercase">
                              <Banknote className="h-4 w-4 text-indigo-400" />
                              Fondo Restante
                            </div>
                            <span className="text-indigo-600 font-black text-sm">${Number(cut.cashRetained || 0).toFixed(2)}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
