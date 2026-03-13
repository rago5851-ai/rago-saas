"use client"

import { useEffect, useState } from "react"
import { getSalesReport } from "../../../lib/actions/reports"
import { ArrowLeft, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Button } from "../../../components/ui/button"
import { Skeleton } from "../../../components/ui/skeleton"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"

const AreaChart = dynamic(() => import("../../../components/charts/AreaChart"), { ssr: false })

import { format, subDays, parseISO } from "date-fns"

export default function VentasPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState("hoy")
  const [customStart, setCustomStart] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"))
  const [customEnd, setCustomEnd] = useState(format(new Date(), "yyyy-MM-dd"))

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await getSalesReport(range, customStart, customEnd)
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

  const totalPeriodo = (data || []).reduce((acc, curr) => acc + (Number(curr.total) || 0), 0)

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto w-full">
          <Link href="/reportes">
            <Button variant="ghost" size="icon" className="rounded-2xl bg-gray-50">
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </Button>
          </Link>
          <h1 className="text-lg font-black text-gray-900">Reporte de Ventas</h1>
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

        {/* Chart Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Ingresos
            </h3>
            <div className="text-right">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total Periodo</p>
              <p className="text-xl font-black text-[#2563eb]">
                ${totalPeriodo.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="min-h-[200px] flex flex-col justify-center">
            {loading ? (
              <div className="space-y-3">
                <p className="text-center text-xs font-bold text-gray-300 animate-pulse">Cargando datos...</p>
                <Skeleton className="h-40 w-full rounded-2xl" />
              </div>
            ) : data.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-300 font-bold border-2 border-dashed border-gray-50 rounded-2xl text-center px-4">
                No hay ventas registradas en este periodo
              </div>
            ) : (
              <AreaChart items={data} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
