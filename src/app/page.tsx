"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { getFormulas } from "@/lib/actions/formulas"
import { getWorkOrders } from "@/lib/actions/production"
import { getRawMaterials } from "@/lib/actions/inventory"
import { getProducts } from "@/lib/actions/products"
import { getDashboardStats } from "@/lib/actions/sales"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, TrendingUp, Calculator, Factory, Users, BarChart3, LogOut, Activity, Package } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { logoutAction } from "@/lib/actions/auth"
import { getClients } from "@/lib/actions/clients"

const cardConfig = [
  { href: "/historial", label: "Ventas", Icon: TrendingUp, color: "emerald", key: "ventas" },
  { href: "/productos", label: "Productos", Icon: Package, color: "teal", key: "productos" },
  { href: "/fabricacion", label: "Fabricación", Icon: Factory, color: "blue", key: "fabricacion" },
  { href: "/caja", label: "Caja Actual", Icon: Calculator, color: "amber", key: "caja" },
  { href: "/clientes", label: "Clientes", Icon: Users, color: "violet", key: "clientes" },
] as const

const colorStyles = {
  emerald: {
    bg: "bg-white hover:border-emerald-200 border-slate-200/80",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    valueColor: "text-emerald-600",
  },
  blue: {
    bg: "bg-white hover:border-blue-200 border-slate-200/80",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
    valueColor: "text-blue-600",
  },
  amber: {
    bg: "bg-white hover:border-amber-200 border-slate-200/80",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
    valueColor: "text-amber-600",
  },
  violet: {
    bg: "bg-white hover:border-violet-200 border-slate-200/80",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600",
    valueColor: "text-violet-600",
  },
  teal: {
    bg: "bg-white hover:border-teal-200 border-slate-200/80",
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-600",
    valueColor: "text-teal-600",
  },
}

export default function DashboardPage() {
  const [formulas, setFormulas] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [stats, setStats] = useState<{ todayTotal: number; todayCount: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const todayISO = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Merida' })
      const [formulasRes, ordersRes, inventoryRes, productsRes, statsRes, clientsRes] = await Promise.all([
        getFormulas(),
        getWorkOrders(),
        getRawMaterials(),
        getProducts(),
        getDashboardStats(todayISO),
        getClients()
      ])
      if (formulasRes.data) setFormulas(formulasRes.data)
      if (ordersRes.data) setOrders(ordersRes.data)
      if (inventoryRes.data) setInventory(inventoryRes.data)
      if (productsRes.success && productsRes.data) setProducts(productsRes.data as any[])
      if (statsRes.success && statsRes.data) setStats(statsRes.data)
      if (clientsRes.success && clientsRes.data) setClients(clientsRes.data)
      setLoading(false)
    }
    loadData()
    const onFocus = () => loadData()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [])

  const finishedOrders = orders.filter((o: any) => o.status === 'FINISHED').length

  const handleLogout = async () => {
    await logoutAction()
  }

  const getCardValue = (key: string) => {
    if (key === "ventas") return `$${stats?.todayTotal?.toFixed(2) ?? "0.00"}`
    if (key === "productos") return String(products.length)
    if (key === "fabricacion") return String(finishedOrders)
    if (key === "caja") return null
    if (key === "clientes") return String(clients.length)
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header — limpio y moderno para escritorio */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 lg:px-8 lg:py-4 shadow-sm">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-slate-800 tracking-tight">Panel de control</h1>
              <p className="text-xs text-slate-500 mt-0.5">Resumen del día</p>
            </div>
            <div className="hidden lg:flex items-center gap-4 pl-8 border-l border-slate-200">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">${stats?.todayTotal?.toFixed(2) ?? "0.00"}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-100">
                <Factory className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-bold text-blue-700">{finishedOrders} lotes</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 lg:hidden">
            <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
              <Activity className="h-4 w-4 text-slate-600" />
            </div>
            <button onClick={handleLogout} className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-5 pb-24 lg:p-8 lg:pb-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-[140px] lg:h-[160px] rounded-2xl" />
              ))}
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}
              className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
                {cardConfig.map(({ href, label, Icon, color, key }) => {
                  const styles = colorStyles[color]
                  const value = getCardValue(key)
                  return (
                    <Link key={href} href={href}
                      className={`block rounded-2xl border-2 p-5 lg:p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${styles.bg}`}>
                      <div className={`inline-flex p-2.5 rounded-xl mb-4 ${styles.iconBg}`}>
                        <Icon className={`h-6 w-6 ${styles.iconColor}`} strokeWidth={2} />
                      </div>
                      {value !== null && <div className={`text-2xl lg:text-3xl font-black ${styles.valueColor} mb-0.5`}>{value}</div>}
                      <div className="text-sm font-semibold text-slate-600">{label}</div>
                    </Link>
                  )
                })}
              </div>
              <Link href="/reportes"
                className="block rounded-2xl border-2 border-slate-200/80 bg-gradient-to-r from-slate-50 to-white p-6 lg:p-8 hover:border-blue-200 hover:shadow-lg transition-all group">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/10">
                      <BarChart3 className="h-8 w-8 text-blue-600" strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Reportes y análisis</h2>
                      <p className="text-sm text-slate-500 mt-0.5">Ventas, productos y cortes de caja</p>
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
