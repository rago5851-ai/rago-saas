"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getFormulas } from "@/lib/actions/formulas"
import { createWorkOrder } from "@/lib/actions/production"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Beaker, Check, AlertCircle } from "lucide-react"

function ProductionOrderForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlFormulaId = searchParams.get("formulaId")

  const [formulas, setFormulas] = useState<any[]>([])
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(urlFormulaId || "")
  const [targetVolume, setTargetVolume] = useState<string>("")
  const [salePrice, setSalePrice] = useState<string>("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getFormulas().then(res => {
      if (res.success && res.data) {
        setFormulas(res.data)
        if (!selectedFormulaId && urlFormulaId) {
          setSelectedFormulaId(urlFormulaId)
        }
      }
    })
  }, [urlFormulaId])

  const selectedFormula = formulas.find(f => f.id === selectedFormulaId) || null

  const handleCreate = async () => {
    const vol = parseFloat(targetVolume)
    if (!selectedFormulaId) return setError("Debes seleccionar una fórmula base.")
    if (isNaN(vol) || vol <= 0) return setError("El volumen a preparar debe ser mayor a cero.")
    const isTerminado = selectedFormula?.type === "TERMINADO" || !selectedFormula?.type
    const price = parseFloat(salePrice)
    if (isTerminado && (isNaN(price) || price <= 0)) return setError("Ingresa el Precio de Venta por litro para productos terminados.")

    setLoading(true)
    setError(null)
    const result = await createWorkOrder(selectedFormulaId, vol, isTerminado ? price : 0)
    
    if (result.success && result.data) {
      router.push(`/production/${result.data.id}`)
      router.refresh()
    } else {
      setError(result.error || "Error al crear lote.")
      setLoading(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 shrink-0 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Preparar Lote</h1>
            <p className="text-xs text-gray-500">Escalamiento de Producción</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 pb-24 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2 items-start">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <section className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Selecciona la Fórmula / Receta</label>
            <select 
              value={selectedFormulaId} 
              onChange={(e) => setSelectedFormulaId(e.target.value)}
              className="w-full h-14 rounded-xl border border-gray-300 bg-white px-4 text-base text-black font-medium shadow-sm transition-all focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            >
              <option value="" disabled>Seleccionar fórmula...</option>
              {formulas.map(f => (
                <option key={f.id} value={f.id}>{f.name} (v{f.version})</option>
              ))}
            </select>
          </div>

          {selectedFormula && (
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mt-4">
              <div className="flex gap-4 items-center mb-2">
                 <div className="bg-indigo-600 p-2 rounded-lg text-white">
                    <Beaker className="h-6 w-6"/>
                 </div>
                 <div>
                    <h3 className="text-indigo-900 font-bold">{selectedFormula.name}</h3>
                    <p className="text-indigo-600 font-medium text-sm">{selectedFormula.FormulaIngredients.length} ingredientes requeridos</p>
                 </div>
              </div>
            </div>
          )}

          <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
            <label className="text-sm font-semibold text-gray-700">¿Cuántos Litros Quieres Preparar?</label>
            <div className="relative">
               <Input 
                 type="number" step="1" 
                 value={targetVolume} 
                 onChange={e => setTargetVolume(e.target.value)} 
                 placeholder="Ej. 100" 
                 className="h-16 text-2xl font-bold pl-16 pr-6 shadow-sm ring-indigo-600 transition-all border-indigo-200 focus:border-indigo-600" 
                 autoFocus
               />
               <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">L</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 px-1">
               Ingresa el volumen total esperado. El sistema escalará automáticamente los kilos necesarios de cada materia prima de acuerdo a la receta base.
            </p>
          </div>

          {selectedFormula && (selectedFormula.type === "TERMINADO" || !selectedFormula.type) && (
            <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
              <label className="text-sm font-semibold text-gray-700">
                Precio de Venta <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input 
                  type="number" step="0.01" min="0"
                  value={salePrice} 
                  onChange={e => setSalePrice(e.target.value)} 
                  placeholder="Ej. 42.50" 
                  className="h-14 text-xl font-bold pl-8 pr-6 shadow-sm border-emerald-200 focus:border-emerald-600" 
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">$</span>
              </div>
              <p className="text-xs text-gray-500 px-1">Precio por litro al que se venderá este producto.</p>
            </div>
          )}

        </section>

        <Button 
          onClick={handleCreate} 
          disabled={loading || !selectedFormulaId || !targetVolume} 
          className="w-full h-14 text-lg font-black text-white rounded-xl mt-8 bg-indigo-700 hover:bg-indigo-800 shadow-lg shadow-indigo-700/30"
        >
          {loading ? "Creando Lote..." : "Escalar y Crear Orden"}
        </Button>
      </main>
    </>
  )
}

export default function NewProductionOrderPage() {
  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Cargando formulario...</div>}>
         <ProductionOrderForm />
      </Suspense>
    </div>
  )
}
