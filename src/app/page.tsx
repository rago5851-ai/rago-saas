"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { getFormulas } from "@/lib/actions/formulas"
import { getWorkOrders } from "@/lib/actions/production"
import { getRawMaterials } from "@/lib/actions/inventory"
import { getDashboardStats } from "@/lib/actions/sales"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { History, ArrowRight, Activity, TrendingUp, Calculator, FlaskConical, Boxes, Users, BarChart3, LogOut, Factory } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { logoutAction } from "@/lib/actions/auth"
import { getClients } from "@/lib/actions/clients"

export default function DashboardPage() {
  const [formulas, setFormulas] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [stats, setStats] = useState<{ todayTotal: number; todayCount: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const todayISO = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Merida' })
      const [formulasRes, ordersRes, inventoryRes, statsRes, clientsRes] = await Promise.all([
        getFormulas(),
        getWorkOrders(),
        getRawMaterials(),
        getDashboardStats(todayISO),
        getClients()
      ])
      if (formulasRes.data) setFormulas(formulasRes.data)
      if (ordersRes.data) setOrders(ordersRes.data)
      if (inventoryRes.data) setInventory(inventoryRes.data)
      if (statsRes.success && statsRes.data) setStats(statsRes.data)
      if (clientsRes.success && clientsRes.data) setClients(clientsRes.data)
      setLoading(false)
    }
    
    loadData()
    
    // Refresh data when window gets focus (real-time feel)
    const onFocus = () => loadData()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [])

  const finishedOrders = orders.filter((o: any) => o.status === 'FINISHED').length

  const handleLogout = async () => {
    await logoutAction()
  }

  return (
    <div className="flex flex-col h-full bg-white min-h-screen">
      {/* Header — azul principal */}
      <header className="sticky top-0 z-10 bg-blue-600 px-6 pt-12 pb-6 shadow-lg rounded-b-[1.5rem]">
        <div className="flex justify-between items-center max-w-lg mx-auto w-full">
          <div className="text-white">
            <h1 className="text-xl font-extrabold tracking-tight">Rago POS</h1>
            <p className="text-blue-100/90 text-[10px] font-bold uppercase tracking-widest">Panel de Control</p>
          </div>
          <div className="flex gap-2">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-9 w-9 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20"
            >
              <Activity className="h-4 w-4 text-white" />
            </motion.div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleLogout}
              className="h-9 w-9 bg-red-500/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-red-500/30 text-white"
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
          </div>
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
              className="grid grid-cols-2 gap-4"
            >
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-[120px] rounded-2xl" />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="grid grid-cols-2 gap-4"
            >
              {/* Ventas */}
              <Link href="/historial" className="block">
                <Card className="border-none shadow-lg bg-[#2563eb] h-full min-h-[120px] rounded-2xl overflow-hidden relative group">
                  <CardContent className="p-4 flex flex-col items-center text-center relative z-10 h-full">
                    <div className="bg-white/15 p-2 rounded-xl mb-1.5 backdrop-blur-sm group-hover:scale-105 transition-transform border border-white/10">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-lg font-black text-white mb-0.5 tracking-tight">
                      ${stats?.todayTotal?.toFixed(2) ?? "0.00"}
                    </div>
                    <div className="text-[9px] font-bold text-white/90 uppercase tracking-widest leading-tight">Ventas</div>
                  </CardContent>
                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-white/10 rounded-full blur-2xl"></div>
                </Card>
              </Link>

              {/* Fabricación (New Hub) */}
              <Link href="/fabricacion" className="block">
                <Card className="border-none shadow-lg bg-[#2563eb] h-full min-h-[120px] rounded-2xl overflow-hidden relative group">
                  <CardContent className="p-4 flex flex-col items-center text-center relative z-10 h-full">
                    <div className="bg-white/15 p-2 rounded-xl mb-1.5 backdrop-blur-sm group-hover:scale-105 transition-transform border border-white/10">
                      <Factory className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-lg font-black text-white mb-0.5 tracking-tight">{finishedOrders}</div>
                    <div className="text-[9px] font-bold text-white/90 uppercase tracking-widest leading-tight">Fabricación</div>
                  </CardContent>
                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-white/10 rounded-full blur-2xl"></div>
                </Card>
              </Link>

              {/* Caja */}
              <Link href="/caja" className="block">
                <Card className="border-none shadow-lg bg-[#2563eb] h-full min-h-[120px] rounded-2xl overflow-hidden relative group">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center relative z-10 h-full min-h-[120px]">
                    <div className="bg-white/15 p-2 rounded-xl mb-1.5 backdrop-blur-sm group-hover:scale-105 transition-transform border border-white/10">
                      <Calculator className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-[9px] font-bold text-white/90 uppercase tracking-widest leading-tight">Caja Actual</div>
                  </CardContent>
                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-white/10 rounded-full blur-2xl"></div>
                </Card>
              </Link>

              {/* Clientes */}
              <Link href="/clientes" className="block">
                <Card className="border-none shadow-lg bg-[#2563eb] h-full min-h-[120px] rounded-2xl overflow-hidden relative group">
                  <CardContent className="p-4 flex flex-col items-center text-center relative z-10 h-full">
                    <div className="bg-white/15 p-2 rounded-xl mb-1.5 backdrop-blur-sm group-hover:scale-105 transition-transform border border-white/10">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-lg font-black text-white mb-0.5 tracking-tight">{clients.length}</div>
                    <div className="text-[9px] font-bold text-white/90 uppercase tracking-widest leading-tight">Clientes</div>
                  </CardContent>
                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-white/10 rounded-full blur-2xl"></div>
                </Card>
              </Link>

              {/* Reportes */}
              <Link href="/reportes" className="block">
                <Card className="border-none shadow-lg bg-[#2563eb] h-full min-h-[120px] rounded-2xl overflow-hidden relative group">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center relative z-10 h-full min-h-[120px]">
                    <div className="bg-white/15 p-2 rounded-xl mb-1.5 backdrop-blur-sm group-hover:scale-105 transition-transform border border-white/10">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-[9px] font-bold text-white/90 uppercase tracking-widest leading-tight">Reportes</div>
                  </CardContent>
                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-white/10 rounded-full blur-2xl"></div>
                </Card>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
