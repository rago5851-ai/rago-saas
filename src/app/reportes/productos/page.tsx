"use client"

import { useEffect, useState } from "react"
import { getTopProducts } from "../../../lib/actions/reports"
import { ArrowLeft, Trophy, Package } from "lucide-react"
import Link from "next/link"
import { Button } from "../../../components/ui/button"
import { Skeleton } from "../../../components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"

import { format, subDays } from "date-fns"

export default function ProductosPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState("hoy")
  const [customStart, setCustomStart] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"))
  const [customEnd, setCustomEnd] = useState(format(new Date(), "yyyy-MM-dd"))

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await getTopProducts(range, customStart, customEnd)
        if (res.success && res.data) setData(res.data)
        else setData([])
      } catch (err) {
        console.error(err)
        setData([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [range, customStart, customEnd])

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto w-full">
          <Link href="/reportes">
            <Button variant="ghost" size="icon" className="rounded-2xl bg-gray-50">
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </Button>
          </Link>
          <h1 className="text-lg font-black text-gray-900">Ranking de Ventas</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Filter */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {["hoy", "7d", "mes", "custom"].map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  range === r ? "bg-[#2563eb] text-white shadow-lg shadow-blue-200" : "bg-gray-50 text-gray-400"
                }`}
              >
                {r === "hoy" ? "Hoy" : r === "7d" ? "7 Días" : r === "mes" ? "Mes" : "Personalizado"}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {range === "custom" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="grid grid-cols-2 gap-3 pb-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Inicio</label>
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full h-10 bg-gray-50 border border-transparent rounded-xl px-3 text-xs font-bold focus:bg-white focus:border-blue-200 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Fin</label>
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full h-10 bg-gray-50 border border-transparent rounded-xl px-3 text-xs font-bold focus:bg-white focus:border-blue-200 outline-none" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="font-black text-gray-900 flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Ranking por Ingresos
          </h3>

          <div className="min-h-[200px] flex flex-col justify-center">
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
              </div>
            ) : data.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                  <Package className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-gray-400 font-bold text-sm">
                  {range === "hoy" ? "Sin ventas el día de hoy" : "Sin ventas registradas"}
                </p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {data.map((item, idx) => (
                  <div key={item.name} className="flex flex-col gap-1.5 group">
                    <div className="flex items-center justify-between gap-3">
                       <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={`text-[10px] font-black shrink-0 w-4 ${idx === 0 ? "text-amber-500" : "text-gray-300"}`}>
                            #{idx + 1}
                          </span>
                          <p className="font-bold text-gray-800 text-sm truncate uppercase tracking-tight">{item.name}</p>
                       </div>
                       <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                             <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-0.5">{item.count} und</p>
                             <p className="font-black text-[#2563eb] text-sm leading-none">${Number(item.revenue || 0).toLocaleString()}</p>
                          </div>
                          <div className="relative w-1.5 h-8 bg-gray-50 rounded-full overflow-hidden shrink-0">
                             <motion.div 
                               initial={{ height: 0 }}
                               animate={{ height: `${(Number(item.revenue) / (Number(data[0]?.revenue) || 1)) * 100}%` }}
                               className="w-full bg-[#2563eb] absolute bottom-0 left-0"
                             />
                          </div>
                       </div>
                    </div>
                    
                    <div className="w-full bg-gray-50 h-1 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(Number(item.revenue) / (Number(data[0]?.revenue) || 1)) * 100}%` }}
                        className="h-full bg-[#2563eb]"
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
