"use client"

import { useEffect, useState } from "react"
import { getSalesReport, getTopProducts, maintenanceCleanup } from "@/lib/actions/reports"
import { ArrowLeft, Calendar, TrendingUp, Package, ClipboardList, ChevronDown, Filter, Trash2, Star, Trophy } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"
import { format, subDays, startOfMonth, parseISO } from "date-fns"
import { es } from "date-fns/locale"

type RangeType = "hoy" | "7d" | "mes" | "custom"
type ReportType = "ventas" | "productos"

export default function ReportesPage() {
  const [range, setRange] = useState<RangeType>("7d")
  const [reportType, setReportType] = useState<ReportType>("ventas")
  const [customStart, setCustomStart] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"))
  const [customEnd, setCustomEnd] = useState(format(new Date(), "yyyy-MM-dd"))
  
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showRangeMenu, setShowRangeMenu] = useState(false)
  const [cleanupStatus, setCleanupStatus] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    let res
    if (reportType === "ventas") {
      res = await getSalesReport(range, customStart, customEnd)
    } else {
      res = await getTopProducts(range, customStart, customEnd)
    }
    
    if (res.success && res.data) setData(res.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // Trigger maintenance cleanup silently on mount
    maintenanceCleanup()
  }, [range, reportType, customStart, customEnd])

  const handleCleanup = async () => {
    if (confirm("¿Estás seguro de eliminar registros de hace más de 30 días?")) {
      const res = await maintenanceCleanup()
      if (res.success) {
        setCleanupStatus(`Se eliminaron ${res.deletedCount} registros antiguos.`)
        setTimeout(() => setCleanupStatus(null), 5000)
      }
    }
  }

  const rangeLabels = {
    hoy: "Hoy",
    "7d": "Últimos 7 días",
    mes: "Mes Actual",
    custom: "Personalizado"
  }

  // Simple Area Chart Component (SVG)
  const AreaChart = ({ items }: { items: any[] }) => {
    if (items.length === 0) return <div className="h-48 flex items-center justify-center text-gray-400">Sin datos</div>
    
    const max = Math.max(...items.map(i => i.total), 1)
    const padding = 20
    const width = 300
    const height = 150
    const points = items.map((i, idx) => {
      const x = (idx / (items.length > 1 ? items.length - 1 : 1)) * (width - 2 * padding) + padding
      const y = height - (i.total / max) * (height - 2 * padding) - padding
      return `${x},${y}`
    }).join(" ")

    const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`

    return (
      <div className="w-full overflow-hidden bg-white rounded-2xl p-4 border border-gray-100 shadow-inner">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Path de área */}
          <motion.polyline
            fill="url(#areaGradient)"
            points={areaPoints}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          />
          {/* Línea principal */}
          <motion.polyline
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          {/* Puntos destacados */}
          {items.map((i, idx) => {
            const x = (idx / (items.length > 1 ? items.length - 1 : 1)) * (width - 2 * padding) + padding
            const y = height - (i.total / max) * (height - 2 * padding) - padding
            return <circle key={idx} cx={x} cy={y} r="3" fill="white" stroke="#2563eb" strokeWidth="1.5" />
          })}
        </svg>
        <div className="flex justify-between mt-2 px-2 text-[8px] font-bold text-gray-400 uppercase tracking-widest">
          <span>{format(parseISO(items[0].date), "dd MMM", { locale: es })}</span>
          <span>{format(parseISO(items[items.length - 1].date), "dd MMM", { locale: es })}</span>
        </div>
      </div>
    )
  }

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
        <div className="flex gap-2">
           <Link href="/cortes">
             <Button size="icon" variant="outline" className="rounded-xl border-indigo-200 text-indigo-600">
               <ClipboardList className="h-5 w-5" />
             </Button>
           </Link>
           <Button variant="ghost" size="icon" onClick={handleCleanup} className="text-gray-400 hover:text-red-500">
             <Trash2 className="h-5 w-5" />
           </Button>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4 max-w-lg mx-auto w-full">
        {cleanupStatus && (
          <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm font-bold border border-emerald-100">
            {cleanupStatus}
          </div>
        )}

        {/* Report Type Selector */}
        <div className="bg-white p-1 rounded-2xl border border-gray-100 flex gap-1 shadow-sm">
          <button 
            onClick={() => setReportType("ventas")}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${reportType === "ventas" ? "bg-[#2563eb] text-white shadow-md shadow-blue-500/20" : "text-gray-400 hover:bg-gray-50"}`}
          >
            <TrendingUp className="h-4 w-4" />
            Ventas
          </button>
          <button 
            onClick={() => setReportType("productos")}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${reportType === "productos" ? "bg-[#2563eb] text-white shadow-md shadow-blue-500/20" : "text-gray-400 hover:bg-gray-50"}`}
          >
            <Package className="h-4 w-4" />
            Productos
          </button>
        </div>

        {/* Date Range Selector */}
        <div className="relative">
          <button 
            onClick={() => setShowRangeMenu(!showRangeMenu)}
            className="w-full h-12 bg-white border border-gray-100 rounded-xl px-4 flex items-center justify-between shadow-sm group"
          >
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-[#2563eb]" />
              <span className="text-sm font-bold text-gray-700">{rangeLabels[range]}</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showRangeMenu ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showRangeMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl z-40 p-2 space-y-1"
              >
                {(["hoy", "7d", "mes", "custom"] as RangeType[]).map((r) => (
                  <button 
                    key={r}
                    onClick={() => { setRange(r); setShowRangeMenu(false); }}
                    className={`w-full py-3 px-4 rounded-xl text-left text-sm font-bold transition-all ${range === r ? "bg-blue-50 text-[#2563eb]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    {rangeLabels[r]}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Custom Range Inputs */}
        {range === "custom" && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Inicio</label>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} 
                className="w-full h-10 bg-white border border-gray-100 rounded-xl px-3 text-xs font-bold text-gray-700 focus:border-[#2563eb] outline-none" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Fin</label>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} 
                className="w-full h-10 bg-white border border-gray-100 rounded-xl px-3 text-xs font-bold text-gray-700 focus:border-[#2563eb] outline-none" 
              />
            </div>
          </motion.div>
        )}

        {/* Content */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {reportType === "ventas" ? (
                  <>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-gray-900 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-emerald-500" />
                          Ingresos por Día
                        </h3>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total Periodo</p>
                          <p className="text-xl font-black text-[#2563eb]">
                            ${data.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <AreaChart items={data} />
                    </div>
                  </>
                ) : (
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <h3 className="font-black text-gray-900 flex items-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      Top 5 Productos
                    </h3>
                    {data.length === 0 ? (
                      <div className="py-10 text-center text-gray-400 font-medium">No hay ventas registradas en este periodo</div>
                    ) : (
                      <div className="space-y-4">
                        {data.map((item, idx) => (
                          <div key={item.name} className="flex items-center gap-4 group">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-lg ${idx === 0 ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400"}`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                              <div className="w-full bg-gray-50 h-2 rounded-full mt-1 overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(item.count / data[0].count) * 100}%` }}
                                  className="h-full bg-[#2563eb]"
                                />
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-gray-900">{item.count}</p>
                              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Unidades</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
