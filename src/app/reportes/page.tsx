"use client"

import { useEffect, useState } from "react"
import { getSalesReport, getTopProducts, getCashCutsHistory, maintenanceCleanup } from "../../lib/actions/reports"
import { ArrowLeft, Calendar, TrendingUp, Package, ClipboardList, ChevronDown, Trash2, Trophy, Banknote } from "lucide-react"
import Link from "next/link"
import { Button } from "../../components/ui/button"
import { Skeleton } from "../../components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"
import { format, subDays, startOfMonth, parseISO } from "date-fns"
import { es } from "date-fns/locale"

type RangeType = "hoy" | "7d" | "mes" | "custom"
type ReportType = "ventas" | "productos" | "cortes"

export default function ReportesPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial cleanup check
    maintenanceCleanup()
    setLoading(false)
  }, [])

  if (loading) return <div className="p-10 text-center font-bold text-gray-400">Cargando...</div>

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b px-4 py-4 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Reportes</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Auditoría y Análisis</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6 max-w-lg mx-auto w-full pb-20">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Selecciona un Reporte</h2>
          
          <div className="grid grid-cols-1 gap-3">
            <Link href="/reportes/ventas">
              <button className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-[#2563eb] hover:bg-white transition-all group flex items-center gap-4">
                <div className="bg-emerald-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="font-black text-gray-900">Ventas e Ingresos</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Gráficas de dinero diario</p>
                </div>
              </button>
            </Link>

            <Link href="/reportes/productos">
              <button className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-[#2563eb] hover:bg-white transition-all group flex items-center gap-4">
                <div className="bg-amber-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <Trophy className="h-6 w-6 text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="font-black text-gray-900">Top 6 Productos</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Lo más vendido hoy</p>
                </div>
              </button>
            </Link>

            <Link href="/reportes/cortes">
              <button className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-[#2563eb] hover:bg-white transition-all group flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-black text-gray-900">Cortes de Caja</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Historial de auditoría</p>
                </div>
              </button>
            </Link>
          </div>
        </div>

        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-center gap-4">
          <div className="bg-white p-2 rounded-xl">
             <Banknote className="h-5 w-5 text-[#2563eb]" />
          </div>
          <p className="text-xs font-bold text-blue-700 leading-relaxed">
            Los datos se sincronizan automáticamente con las ventas registradas en el Dashboard.
          </p>
        </div>
      </main>
    </div>
  )
}
