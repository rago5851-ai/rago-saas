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

export default function VentasPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState("hoy")

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await getSalesReport(range)
      if (res.success && res.data) setData(res.data)
      setLoading(false)
    }
    load()
  }, [range])

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
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
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {["hoy", "7d", "mes"].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                range === r ? "bg-[#2563eb] text-white shadow-lg shadow-blue-200" : "bg-gray-50 text-gray-400"
              }`}
            >
              {r === "hoy" ? "Hoy" : r === "7d" ? "7 Días" : "Mes"}
            </button>
          ))}
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
                ${data.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <Skeleton className="h-48 w-full rounded-2xl" />
            ) : data.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-300 font-bold border-2 border-dashed border-gray-50 rounded-2xl">
                Sin datos en este periodo
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AreaChart items={data} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
