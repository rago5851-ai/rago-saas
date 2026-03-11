"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { completeWorkOrder } from "@/lib/actions/production"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, Clock, Beaker, FileText, AlertTriangle } from "lucide-react"

// Función mock temporal para obtener la orden por ID (en Producción deberías usar un Server Action GetOrderById)
// O en su defecto React Server Components. Lo haremos Client-Side fetch a la API temporalmente importando la acción de get orders
import { getWorkOrders } from "@/lib/actions/production"

export default function WorkOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [observations, setObservations] = useState("")

  useEffect(() => {
    getWorkOrders().then(res => {
      if (res.success && res.data) {
        const found = res.data.find((o: any) => o.id === id) as any
        if (found) {
          setOrder(found)
          setObservations(found.observations || "")
        }
      }
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando orden...</div>
  if (!order) return <div className="p-8 text-center text-red-500">Orden no encontrada.</div>

  const isFinished = order.status === "FINISHED"

  // Calcular Factor de Escala
  const baseLiters = order.formula.FormulaIngredients?.reduce(
    (sum: number, ing: any) => sum + (ing.quantityKg / ing.rawMaterial.densityKgL), 0
  ) || 1
  
  const scaleFactor = order.targetVolumeLiters / baseLiters

  const handleFinish = async () => {
    if (!confirm("¿Confirma que se preparó este lote y se descontará el inventario?")) return
    
    setFinishing(true)
    setError(null)
    const result = await completeWorkOrder(order.id, observations)
    
    if (result.success) {
      router.refresh()
      // Recargar localmente
      setOrder({...order, status: "FINISHED", observations, completedAt: new Date() })
    } else {
      setError(result.error || "No se pudo finalizar. Revisa si hay inventario suficiente.")
    }
    setFinishing(false)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      <header className={`sticky top-0 z-10 border-b px-4 py-4 shadow-sm flex items-center gap-3 transition-colors ${isFinished ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 shrink-0 rounded-full">
          <ArrowLeft className={`h-5 w-5 ${isFinished ? 'text-green-800' : 'text-gray-700'}`} />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-tight">Orden #{order.id.slice(0,6).toUpperCase()}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isFinished ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600"/> : <Clock className="h-3.5 w-3.5 text-orange-500"/>}
            <span className={`text-xs font-semibold ${isFinished ? 'text-green-700' : 'text-orange-600'}`}>
              {isFinished ? 'Finalizado' : 'En Preparación'}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 pb-24 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2 items-start shadow-sm">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-lg mt-2 relative overflow-hidden flex flex-col items-center text-center">
           <Beaker className="h-10 w-10 text-indigo-300 mb-2 opacity-50" />
           <h2 className="text-3xl font-black">{order.formula.name}</h2>
           <div className="mt-4 bg-white/10 px-4 py-2 rounded-full inline-block backdrop-blur-sm border border-white/20">
              <span className="text-xl font-bold">{order.targetVolumeLiters} L</span>
              <span className="text-xs uppercase tracking-widest text-indigo-200 ml-2">Volumen Objetivo</span>
           </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2 mt-6 pl-1">
             <div className="bg-indigo-100 p-1.5 rounded-md">
               <Beaker className="h-4 w-4 text-indigo-700" />
             </div>
             <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
               Instrucciones de Pesado
             </h3>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <div className="col-span-5 sm:col-span-6">Insumo</div>
              <div className="col-span-4 sm:col-span-3 text-right">Peso (Kg)</div>
              <div className="col-span-3 text-right">Vol (L)</div>
            </div>
            <div className="divide-y divide-gray-100">
              {order.formula.FormulaIngredients?.map((ing: any) => {
                const rawKg = ing.quantityKg * scaleFactor
                const scaledL = (rawKg / ing.rawMaterial.densityKgL).toFixed(2)
                
                let weightDisplay = ""
                if (rawKg < 1) {
                   weightDisplay = `${(rawKg * 1000).toFixed(0)} g`
                } else {
                   weightDisplay = `${rawKg.toFixed(2)} kg`
                }
                
                return (
                  <div key={ing.id} className={`grid grid-cols-12 gap-2 items-center px-4 py-3.5 transition-colors ${isFinished ? 'bg-gray-50/50 opacity-60' : 'hover:bg-indigo-50/30'}`}>
                    <div className="col-span-5 sm:col-span-6 pr-2">
                      <p className="font-semibold text-gray-900 leading-tight line-clamp-2">{ing.rawMaterial.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Stock lib: {ing.rawMaterial.stockKg < 1 ? (ing.rawMaterial.stockKg * 1000).toFixed(0) + ' g' : ing.rawMaterial.stockKg.toFixed(2) + ' kg'}</p>
                    </div>
                    <div className="col-span-4 sm:col-span-3 text-right">
                      <p className="text-base font-black text-indigo-600">{weightDisplay}</p>
                    </div>
                    <div className="col-span-3 text-right">
                      <p className="text-sm font-bold text-blue-500">{scaledL} <span className="text-[10px] uppercase font-semibold">L</span></p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {order.formula.instructions && (
          <section className="space-y-3 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider pl-1 flex items-center gap-2">
               <FileText className="h-4 w-4 text-gray-400" /> Instrucciones
            </h3>
            <Card className="bg-amber-50/50 border-amber-100 shadow-none">
              <CardContent className="p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-serif">
                {order.formula.instructions}
              </CardContent>
            </Card>
          </section>
        )}

        {!isFinished ? (
           <div className="pt-8 space-y-5">
             <div className="space-y-2">
               <label className="text-sm font-bold text-gray-700 pl-1">Observaciones del Lote</label>
               <textarea 
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  placeholder="Ej. Se varió el colorante, hubo demoras en el batido rápido..."
                  className="w-full rounded-xl border border-gray-400 bg-white p-4 text-base font-semibold text-black placeholder:text-gray-600 shadow-sm h-28 resize-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all outline-none"
               />
             </div>
             
             <div>
               <Button 
                 onClick={handleFinish} 
                 disabled={finishing} 
                 className="w-full h-14 text-lg font-black text-white rounded-xl bg-green-700 hover:bg-green-800 shadow-lg shadow-green-700/30 transition-all active:scale-[0.98]"
               >
                 {finishing ? "Guardando y Cerrando..." : "Finalizar Lote"}
               </Button>
               <p className="text-center text-[11px] text-gray-400 mt-3 font-medium px-4 leading-relaxed">
                  Al finalizar, el sistema registrará la hora de cierre y descontará automáticamente el peso de cada insumo en el inventario.
               </p>
             </div>
           </div>
        ) : (
           <div className="pt-6">
             <div className="bg-green-50 border border-green-200 rounded-2xl p-5 shadow-sm">
               <h3 className="text-sm font-bold text-green-800 flex items-center gap-2 mb-1">
                 <CheckCircle2 className="h-5 w-5" /> Lote Finalizado con Éxito
               </h3>
               {order.completedAt && (
                 <p className="text-xs font-medium text-green-600/80 mb-4 ml-7">
                   Cerrado el {new Date(order.completedAt).toLocaleString("es-MX", { dateStyle: 'long', timeStyle: 'short' })}
                 </p>
               )}
               
               {order.observations && (
                 <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm mt-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                       <FileText className="h-3 w-3" /> Bitácora
                    </p>
                    <p className="text-sm text-gray-700 font-medium italic">{order.observations}</p>
                 </div>
               )}
             </div>
           </div>
        )}
      </main>
    </div>
  )
}
