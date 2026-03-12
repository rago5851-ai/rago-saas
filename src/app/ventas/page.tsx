"use client"

import { useEffect, useState } from "react"
import { getFinishedInventory } from "@/lib/actions/sales"
import { ShoppingBag, Package2 } from "lucide-react"
import Link from "next/link"

export default function VentasPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFinishedInventory().then(res => {
      if (res.success && res.data) setItems(res.data as any[])
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-medium pb-20">
        Cargando inventario de ventas...
      </div>
    )
  }

  // Agrupar por nombre de fórmula para mostrar totales
  const grouped: Record<string, { name: string, totalLiters: number, totalCost: number, lotes: number }> = {}
  for (const item of items) {
    const key = item.formulaName || "Sin nombre"
    if (!grouped[key]) grouped[key] = { name: key, totalLiters: 0, totalCost: 0, lotes: 0 }
    grouped[key].totalLiters += item.quantityLiters || 0
    grouped[key].totalCost += item.totalCost || 0
    grouped[key].lotes += 1
  }
  const products = Object.values(grouped)

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      <header className="sticky top-0 z-10 bg-white border-b px-6 py-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Inventario de Ventas</h1>
          <p className="text-xs text-gray-500">Productos Terminados</p>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4 pb-20">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-white rounded-2xl border border-dashed mt-10">
            <Package2 className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-sm font-medium">Aún no hay productos terminados.</p>
            <p className="text-xs mt-1">Finaliza una orden de producción de tipo <strong>Producto Terminado</strong> para verlos aquí.</p>
            <Link href="/production" className="text-indigo-600 font-bold text-xs mt-3 hover:underline">
              Ir a Producción
            </Link>
          </div>
        ) : (
          products.map(p => (
            <div key={p.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 rounded-xl p-2.5">
                    <ShoppingBag className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-base leading-tight">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.lotes} lote{p.lotes !== 1 ? "s" : ""} de producción</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-black text-emerald-600">{p.totalLiters.toFixed(1)} L</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Disponible</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Costo Total</p>
                  <p className="text-sm font-bold text-gray-700">${p.totalCost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Costo / Litro</p>
                  <p className="text-sm font-bold text-indigo-600">
                    ${p.totalLiters > 0 ? (p.totalCost / p.totalLiters).toFixed(2) : "0.00"}/L
                  </p>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Resumen total */}
        {products.length > 0 && (
          <div className="bg-indigo-950 rounded-2xl p-4 text-white">
            <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">Resumen General</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-black text-white">
                  {products.reduce((s, p) => s + p.totalLiters, 0).toFixed(1)} L
                </p>
                <p className="text-xs text-indigo-400">Total listo para venta</p>
              </div>
              <div>
                <p className="text-2xl font-black text-amber-300">
                  ${products.reduce((s, p) => s + p.totalCost, 0).toFixed(2)}
                </p>
                <p className="text-xs text-indigo-400">Costo total producido</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
