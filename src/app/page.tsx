"use client"

import { useEffect, useState } from "react"
import { getFormulas } from "@/lib/actions/formulas"
import { getWorkOrders } from "@/lib/actions/production"
import { getRawMaterials } from "@/lib/actions/inventory"
import { getDashboardStats } from "@/lib/actions/sales"
import { Card, CardContent } from "@/components/ui/card"
import { History, ArrowRight, Activity, TrendingUp, Calculator, FlaskConical, Boxes } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const [formulas, setFormulas] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [stats, setStats] = useState<{ todayTotal: number; todayCount: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
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
  }, [])

  const recentOrders = orders.slice(0, 3)
  const lowStockMaterials = inventory.filter((m: any) => m.stockKg < 5).slice(0, 2)

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-medium">Cargando...</div>
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      {/* Header — no search bar */}
      <header className="sticky top-0 z-10 bg-indigo-700 px-6 pt-12 pb-6 shadow-md rounded-b-[2rem]">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-2xl font-black tracking-tight">Rago POS</h1>
            <p className="text-indigo-200 text-sm font-medium">Sistema de Punto de Venta</p>
          </div>
          <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Activity className="h-5 w-5 text-white" />
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 pb-24 space-y-6 mt-2">


        {/* Row 1: Fórmulas + Producción */}
        <section className="grid grid-cols-2 gap-4">
          <Link href="/formulas" className="block">
            <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-[#4169E1] h-full overflow-hidden relative group">
              <CardContent className="p-6 flex flex-col justify-center items-center text-center mt-2 relative z-10">
                <div className="bg-white/20 p-3 rounded-2xl mb-3 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <FlaskConical className="h-7 w-7 text-white" />
                </div>
                <div className="text-4xl font-black text-white mb-1 drop-shadow-md">{formulas.length}</div>
                <div className="text-[11px] font-black text-white uppercase tracking-widest">Fórmulas<br/>Registradas</div>
              </CardContent>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            </Card>
          </Link>
          <Link href="/production" className="block">
            <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-[#4169E1] h-full overflow-hidden relative group">
              <CardContent className="p-6 flex flex-col justify-center items-center text-center mt-2 relative z-10">
                <div className="bg-white/20 p-3 rounded-2xl mb-3 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <Boxes className="h-7 w-7 text-white" />
                </div>
                <div className="text-4xl font-black text-white mb-1 drop-shadow-md">
                  {orders.filter((o: any) => o.status === 'FINISHED').length}
                </div>
                <div className="text-[11px] font-black text-white uppercase tracking-widest">Lotes<br/>Completados</div>
              </CardContent>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            </Card>
          </Link>
        </section>

        {/* Row 2: Ventas del Día + Corte de Caja */}
        <section className="grid grid-cols-2 gap-4">
          <Link href="/historial" className="block">
            <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-[#4169E1] h-full overflow-hidden relative group">
              <CardContent className="p-6 flex flex-col justify-center items-center text-center mt-2 relative z-10">
                <div className="bg-white/20 p-3 rounded-2xl mb-3 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <div className="text-4xl font-black text-white mb-1 drop-shadow-md">
                  ${stats?.todayTotal?.toFixed(2) ?? "0.00"}
                </div>
                <div className="text-[11px] font-black text-white uppercase tracking-widest">Ventas del Día</div>
                <div className="text-[10px] text-white/80 mt-1 font-bold">{stats?.todayCount ?? 0} transacciones</div>
              </CardContent>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            </Card>
          </Link>
          <Link href="/caja" className="block">
            <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-[#4169E1] h-full overflow-hidden relative group">
              <CardContent className="p-6 flex flex-col justify-center items-center text-center mt-2 relative z-10">
                <div className="bg-white/20 p-3 rounded-2xl mb-3 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <Calculator className="h-7 w-7 text-white" />
                </div>
                <div className="text-3xl font-black text-white mb-1 drop-shadow-md">Corte de Caja</div>
                <div className="text-[11px] text-white/80 mt-1 uppercase font-black tracking-widest">Ver caja actual</div>
              </CardContent>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            </Card>
          </Link>
        </section>

      </main>
    </div>
  )
}
