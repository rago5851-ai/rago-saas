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
        <section className="grid grid-cols-2 gap-3">
          <Link href="/formulas" className="block">
            <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-[#007bff] h-full overflow-hidden relative group">
              <CardContent className="p-5 flex flex-col justify-center items-center text-center mt-2 relative z-10">
                <div className="bg-white/20 p-2 rounded-xl mb-2 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <FlaskConical className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-black text-white mb-1 drop-shadow-sm">{formulas.length}</div>
                <div className="text-[10px] font-bold text-white/90 uppercase tracking-wider">Fórmulas<br/>Registradas</div>
              </CardContent>
              {/* Subtle glass effect highlight */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            </Card>
          </Link>
          <Link href="/production" className="block">
            <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-[#8A2BE2] h-full overflow-hidden relative group">
              <CardContent className="p-5 flex flex-col justify-center items-center text-center mt-2 relative z-10">
                <div className="bg-white/20 p-2 rounded-xl mb-2 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <Boxes className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-black text-white mb-1 drop-shadow-sm">
                  {orders.filter((o: any) => o.status === 'FINISHED').length}
                </div>
                <div className="text-[10px] font-bold text-white/90 uppercase tracking-wider">Lotes<br/>Completados</div>
              </CardContent>
              {/* Subtle glass effect highlight */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            </Card>
          </Link>
        </section>

        {/* Row 2: Ventas del Día + Corte de Caja */}
        <section className="grid grid-cols-2 gap-3">
          <Link href="/historial" className="block">
            <Card className="border-emerald-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-600 to-emerald-700 h-full">
              <CardContent className="p-4 flex flex-col justify-center items-center text-center mt-2">
                <TrendingUp className="h-6 w-6 text-emerald-100 mb-1" />
                <div className="text-2xl font-black text-white mb-0.5">
                  ${stats?.todayTotal?.toFixed(2) ?? "0.00"}
                </div>
                <div className="text-[10px] font-bold text-emerald-100 uppercase">Ventas del Día</div>
                <div className="text-[9px] text-emerald-200 mt-0.5">{stats?.todayCount ?? 0} transacciones</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/caja" className="block">
            <Card className="border-amber-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-amber-500 to-amber-600 h-full">
              <CardContent className="p-4 flex flex-col justify-center items-center text-center mt-2">
                <Calculator className="h-6 w-6 text-amber-100 mb-1" />
                <div className="text-base font-black text-white leading-tight">Corte</div>
                <div className="text-base font-black text-white leading-tight">de Caja</div>
                <div className="text-[9px] text-amber-100 mt-0.5 uppercase font-bold">Ver caja actual</div>
              </CardContent>
            </Card>
          </Link>
        </section>

        {/* Recent production */}
        <section>
          <div className="flex justify-between items-end mb-3 px-1">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <History className="h-4 w-4 text-gray-400" /> Producción Reciente
            </h3>
            <Link href="/production" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Ver todo</Link>
          </div>
          <div className="space-y-2">
            {recentOrders.length === 0 ? (
              <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500 font-medium">
                Aún no hay lotes registrados
              </div>
            ) : (
              recentOrders.map((o: any) => (
                <Link href={`/production/${o.id}`} key={o.id} className="block">
                  <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden">
                    <div className="flex border-l-4 border-indigo-500">
                      <CardContent className="p-3 px-4 w-full flex justify-between items-center mt-2">
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm leading-tight">{o.formula?.name}</h4>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {o.status === 'FINISHED' ? 'Completado' : 'En Preparación'} · {new Date(o.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-sm shrink-0">{o.targetVolumeLiters} L</span>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>

      </main>
    </div>
  )
}
