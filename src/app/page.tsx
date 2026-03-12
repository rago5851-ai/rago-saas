"use client"

import { useEffect, useState } from "react"
import { getFormulas } from "@/lib/actions/formulas"
import { getWorkOrders } from "@/lib/actions/production"
import { getRawMaterials } from "@/lib/actions/inventory"
import { getDashboardStats } from "@/lib/actions/sales"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { History, ArrowRight, Activity, TrendingUp, Calculator, FlaskConical, Boxes } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

export default function DashboardPage() {
  const [formulas, setFormulas] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [stats, setStats] = useState<{ todayTotal: number; todayCount: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [formulasRes, ordersRes, inventoryRes, statsRes] = await Promise.all([
        getFormulas(),
        getWorkOrders(),
        getRawMaterials(),
        getDashboardStats(),
      ])
      if (formulasRes.data) setFormulas(formulasRes.data)
      if (ordersRes.data) setOrders(ordersRes.data)
      if (inventoryRes.data) setInventory(inventoryRes.data)
      if (statsRes.success && statsRes.data) setStats(statsRes.data)
      setLoading(false)
    }
    
    loadData()
    
    // Refresh data when window gets focus (real-time feel)
    const onFocus = () => loadData()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [])

  const finishedOrders = orders.filter((o: any) => o.status === 'FINISHED').length

  return (
    <div className="flex flex-col h-full bg-white min-h-screen">
      {/* Header — elegant indigo */}
      <header className="sticky top-0 z-10 bg-indigo-600 px-6 pt-12 pb-6 shadow-sm rounded-b-[1.5rem]">
        <div className="flex justify-between items-center max-w-lg mx-auto w-full">
          <div className="text-white">
            <h1 className="text-xl font-extrabold tracking-tight">Rago POS</h1>
            <p className="text-indigo-100/80 text-[10px] font-bold uppercase tracking-widest">Panel de Control</p>
          </div>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-9 w-9 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20"
          >
            <Activity className="h-4 w-4 text-white" />
          </motion.div>
        </div>
      </header>

      <main className="flex-1 p-5 pb-24 space-y-5 mt-6 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-[120px] rounded-2xl" />
                <Skeleton className="h-[120px] rounded-2xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-[120px] rounded-2xl" />
                <Skeleton className="h-[120px] rounded-2xl" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-5"
            >
              {/* Row 1: Fórmulas + Producción */}
              <section className="grid grid-cols-2 gap-4">
                <Link href="/formulas" className="block h-full">
                  <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-[#2563eb] h-full rounded-2xl overflow-hidden relative group">
                    <CardContent className="p-4 flex flex-col items-center text-center relative z-10 h-full">
                      <div className="bg-white/15 p-2.5 rounded-xl mb-2 backdrop-blur-sm group-hover:scale-105 transition-transform border border-white/10">
                        <FlaskConical className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-xl font-black text-white mb-0.5 tracking-tight">{formulas.length}</div>
                      <div className="text-[9px] font-bold text-white/90 uppercase tracking-widest leading-tight">Fórmulas</div>
                    </CardContent>
                    <div className="absolute -top-6 -right-6 w-16 h-16 bg-white/10 rounded-full blur-2xl"></div>
                  </Card>
                </Link>
                <Link href="/production" className="block h-full">
                  <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-[#2563eb] h-full rounded-2xl overflow-hidden relative group">
                    <CardContent className="p-4 flex flex-col items-center text-center relative z-10 h-full">
                      <div className="bg-white/15 p-2.5 rounded-xl mb-2 backdrop-blur-sm group-hover:scale-105 transition-transform border border-white/10">
                        <Boxes className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-xl font-black text-white mb-0.5 tracking-tight">{finishedOrders}</div>
                      <div className="text-[9px] font-bold text-white/90 uppercase tracking-widest leading-tight">Lotes</div>
                    </CardContent>
                    <div className="absolute -top-6 -right-6 w-16 h-16 bg-white/10 rounded-full blur-2xl"></div>
                  </Card>
                </Link>
              </section>

              {/* Row 2: Ventas del Día + Corte de Caja */}
              <section className="grid grid-cols-2 gap-4">
                <Link href="/historial" className="block h-full">
                  <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-[#2563eb] h-full rounded-2xl overflow-hidden relative group">
                    <CardContent className="p-4 flex flex-col items-center text-center relative z-10 h-full">
                      <div className="bg-white/15 p-2.5 rounded-xl mb-2 backdrop-blur-sm group-hover:scale-105 transition-transform border border-white/10">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-xl font-black text-white mb-0.5 tracking-tight">
                        ${stats?.todayTotal?.toFixed(2) ?? "0.00"}
                      </div>
                      <div className="text-[9px] font-bold text-white/90 uppercase tracking-widest leading-tight">Ventas</div>
                      <div className="text-[8px] text-white/70 mt-1 font-bold tracking-wider">{stats?.todayCount ?? 0} OPS</div>
                    </CardContent>
                    <div className="absolute -top-6 -right-6 w-16 h-16 bg-white/10 rounded-full blur-2xl"></div>
                  </Card>
                </Link>
                <Link href="/caja" className="block h-full">
                  <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-[#2563eb] h-full rounded-2xl overflow-hidden relative group">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center relative z-10 h-full min-h-[120px]">
                      <div className="bg-white/15 p-2.5 rounded-xl mb-2 backdrop-blur-sm group-hover:scale-105 transition-transform border border-white/10">
                        <Calculator className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-sm font-black text-white tracking-tight uppercase">Caja</div>
                      <div className="text-[8px] text-white/70 mt-1 uppercase font-black tracking-[0.2em]">Ver actual</div>
                    </CardContent>
                    <div className="absolute -top-6 -right-6 w-16 h-16 bg-white/10 rounded-full blur-2xl"></div>
                  </Card>
                </Link>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
