"use client"

import { useEffect, useState } from "react"
import { maintenanceCleanup } from "../../lib/actions/reports"
import { ArrowLeft, TrendingUp, Trophy, ClipboardList, ChevronRight, DollarSign } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

const reportCards = [
  { href: "/reportes/ventas", label: "Ventas e Ingresos", desc: "Gráficas de dinero diario", Icon: TrendingUp, color: "emerald" },
  { href: "/reportes/productos", label: "Ranking de Ventas", desc: "Lo más vendido hoy", Icon: Trophy, color: "amber" },
  { href: "/reportes/cortes", label: "Cortes de Caja", desc: "Historial de auditoría", Icon: ClipboardList, color: "blue" },
  { href: "/reportes/utilidades", label: "Utilidades", desc: "Ventas, gastos y utilidad del mes", Icon: DollarSign, color: "teal" },
] as const

const colorMap = {
  emerald: { bg: "bg-emerald-500/10", icon: "text-emerald-600", border: "hover:border-emerald-200", group: "group-hover:bg-emerald-50" },
  amber: { bg: "bg-amber-500/10", icon: "text-amber-600", border: "hover:border-amber-200", group: "group-hover:bg-amber-50" },
  blue: { bg: "bg-blue-500/10", icon: "text-blue-600", border: "hover:border-blue-200", group: "group-hover:bg-blue-50" },
  teal: { bg: "bg-teal-500/10", icon: "text-teal-600", border: "hover:border-teal-200", group: "group-hover:bg-teal-50" },
}

export default function ReportesPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    maintenanceCleanup()
    setLoading(false)
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-slate-400 font-medium">Cargando...</div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-4 lg:px-8 lg:py-5 shadow-sm">
        <div className="flex items-center gap-4 max-w-5xl mx-auto">
          <Link href="/" className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 hover:bg-slate-200 transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Reportes</h1>
            <p className="text-xs text-slate-500 mt-0.5">Auditoría y análisis</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-5 pb-24 lg:p-8 lg:pb-8 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Selecciona un reporte</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {reportCards.map(({ href, label, desc, Icon, color }, i) => {
              const c = colorMap[color]
              return (
                <Link key={href} href={href}
                  className={`group block p-5 lg:p-6 rounded-2xl bg-white border-2 border-slate-200/80 ${c.border} transition-all hover:shadow-lg hover:-translate-y-0.5`}
                >
                  <div className={`inline-flex p-3 rounded-xl mb-4 ${c.bg}`}>
                    <Icon className={`h-6 w-6 lg:h-7 lg:w-7 ${c.icon}`} strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">{label}</h3>
                  <p className="text-sm text-slate-500 mb-4">{desc}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">
                    Ver reporte
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              )
            })}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
