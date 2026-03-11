"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getRawMaterials } from "@/lib/actions/inventory"
import { createFormula, NewFormulaIngredient } from "@/lib/actions/formulas"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, ArrowLeft, Plus, Trash2, Calculator, Info } from "lucide-react"

// Tipos base para el cliente
type RawMaterial = {
  id: string
  name: string
  densityKgL: number
  pricePerKg: number
}

type IngredientRow = {
  id: string // ID local temporal para el map del UI
  rawMaterialId: string
  quantityGramos: string // String para manejar inputs vacíos (captura de usuario en g)
}

export default function NewFormulaPage() {
  const router = useRouter()
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  
  const [name, setName] = useState("")
  const [instructions, setInstructions] = useState("")
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { id: Math.random().toString(36).substring(2), rawMaterialId: "", quantityGramos: "" }
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getRawMaterials().then(res => {
      if (res.success && res.data) setMaterials(res.data as any)
    })
  }, [])

  // Cálculos reactivos en tiempo real
  const calculations = useMemo(() => {
    let totalKg = 0
    let totalLiters = 0
    let totalCost = 0

    ingredients.forEach(ing => {
      const material = materials.find(m => m.id === ing.rawMaterialId)
      const kg = (parseFloat(ing.quantityGramos) || 0) / 1000 // Convertir gramos a Kg para cálculo

      if (material && kg > 0) {
        totalKg += kg
        totalLiters += (kg / material.densityKgL)
        totalCost += (kg * material.pricePerKg)
      }
    })

    const costPerLiter = totalLiters > 0 ? totalCost / totalLiters : 0

    return { totalKg, totalLiters, totalCost, costPerLiter }
  }, [ingredients, materials])

  const addIngredient = () => {
    setIngredients([...ingredients, { id: Math.random().toString(36).substring(2), rawMaterialId: "", quantityGramos: "" }])
  }

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ing => ing.id !== id))
    }
  }

  const updateIngredient = (id: string, field: keyof IngredientRow, value: string) => {
    setIngredients(ingredients.map(ing => ing.id === id ? { ...ing, [field]: value } : ing))
  }

  const handleAutoFillWater = (rowId: string) => {
    const materialId = ingredients.find(i => i.id === rowId)?.rawMaterialId
    if (!materialId) return
    const material = materials.find(m => m.id === materialId)
    if (!material) return

    // Calcular cuánto volumen falta para 1 Litro
    let currentLitersWithoutThis = 0
    ingredients.forEach(ing => {
      if (ing.id !== rowId) { // No contamos la fila actual del agua
        const mat = materials.find(m => m.id === ing.rawMaterialId)
        const kg = (parseFloat(ing.quantityGramos) || 0) / 1000
        if (mat && kg > 0) currentLitersWithoutThis += (kg / mat.densityKgL)
      }
    })

    const missingLiters = 1 - currentLitersWithoutThis
    if (missingLiters <= 0) {
       alert("No falta agua, el volumen ya superó o alcanzó 1 Litro.")
       return
    }

    // Convertir los litros faltantes a gramos del insumo seleccionado (Agua) usando su densidad
    const requiredKg = missingLiters * material.densityKgL
    const requiredGramos = requiredKg * 1000
    
    // Redondear a gramos exactos (entero o 1 decimal max)
    const finalGramos = Math.round(requiredGramos * 10) / 10

    updateIngredient(rowId, "quantityGramos", finalGramos.toString())
  }

  const handleSave = async () => {
    if (!name.trim()) return setError("El nombre de la fórmula es obligatorio.")
    
    const validIngredients: NewFormulaIngredient[] = ingredients
      .filter(i => i.rawMaterialId && parseFloat(i.quantityGramos) > 0)
      .map(i => ({ rawMaterialId: i.rawMaterialId, quantityKg: (parseFloat(i.quantityGramos) || 0) / 1000 }))

    if (validIngredients.length === 0) {
      return setError("Agrega al menos un ingrediente válido con más de 0g.")
    }

    const currentVol = Math.round(calculations.totalLiters * 1000) / 1000
    if (currentVol !== 1.000) {
      return setError(`La fórmula debe sumar exactamente 1.000 Litro. Volumen actual: ${currentVol.toFixed(3)} L.`)
    }

    setLoading(true)
    setError(null)
    
    const result = await createFormula(name, instructions, validIngredients)
    if (result.success) {
      router.push("/formulas")
      router.refresh()
    } else {
      setError(result.error || "Error al guardar.")
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 shrink-0 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Crear Fórmula</h1>
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading} className="bg-indigo-700 text-white font-black hover:bg-indigo-800 h-10 px-6 shadow-md rounded-xl">
          Guardar
        </Button>
      </header>

      <main className="flex-1 p-4 pb-32 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2 items-start">
            <AlertCircle className="h-5 w-5 shrink-0" /> <p>{error}</p>
          </div>
        )}

        {/* Resumen General Reactivo - SCROLL PEGAJOSO MÓVIL */}
        <div className="bg-indigo-950 border border-indigo-800 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5"><Calculator className="h-24 w-24"/></div>
           <h3 className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-4 border-b border-indigo-800/50 pb-2">Rendimiento Estimado</h3>
           
           <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="p-3 bg-indigo-900/50 rounded-xl">
                 <p className="text-indigo-200 text-[10px] uppercase font-bold tracking-widest mb-1">Volumen Total</p>
                 <div className="flex items-baseline gap-1">
                   <p className={`text-2xl font-black ${calculations.totalLiters > 1.005 ? "text-red-400" : (calculations.totalLiters >= 0.995 && calculations.totalLiters <= 1.005) ? "text-emerald-400" : "text-white"}`}>
                     {calculations.totalLiters.toFixed(3)}
                   </p>
                   <span className="text-xs font-bold text-indigo-300">/ 1.00 L</span>
                 </div>
                 <p className="text-xs text-indigo-400 mt-1.5 font-medium">Peso recetario: <span className="text-indigo-200">{calculations.totalKg.toFixed(2)} kg</span></p>
              </div>
              <div className="p-3 bg-indigo-900/50 rounded-xl">
                 <p className="text-indigo-200 text-[10px] uppercase font-bold tracking-widest mb-1">Costo Producción</p>
                 <p className="text-2xl font-black text-emerald-300">${calculations.costPerLiter.toFixed(2)}</p>
                 <p className="text-xs text-indigo-400 mt-1.5 font-medium">por Litro base</p>
              </div>
           </div>
        </div>

        {/* Datos Principales */}
        <section className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Nombre del Producto</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Multiusos Lavanda" className="h-14 text-lg" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Instrucciones de Preparación</label>
            <textarea 
              value={instructions} onChange={e => setInstructions(e.target.value)}
              className="w-full rounded-md border border-gray-400 bg-white p-3 text-base font-semibold text-black placeholder:text-gray-600 focus:ring-2 focus:ring-indigo-600 min-h-[100px]"
              placeholder="1. Llenar tanque con la mitad de agua...\n2. Agregar reactivos..."
            />
          </div>
        </section>

        {/* Ingredientes Dinámicos */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Materias Primas 
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{ingredients.length}</span>
            </h3>
            <Button type="button" size="sm" onClick={addIngredient} className="h-9 px-4 text-white font-black rounded-lg border-0 bg-indigo-600 hover:bg-indigo-700 shadow-md">
               <Plus className="h-4 w-4 mr-1 stroke-[3px]"/> Añadir
            </Button>
          </div>

          <div className="space-y-3">
            {ingredients.map((ing, index) => (
              <Card key={ing.id} className="border-gray-200 shadow-none relative overflow-visible">
                {ingredients.length > 1 && (
                  <button 
                    onClick={() => removeIngredient(ing.id)}
                    className="absolute -right-2 -top-2 bg-red-100 text-red-600 p-1.5 rounded-full shadow-sm hover:bg-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-gray-500 font-medium ml-1">Insumo</label>
                      <select 
                        value={ing.rawMaterialId} 
                        onChange={(e) => updateIngredient(ing.id, "rawMaterialId", e.target.value)}
                        className="w-full h-12 rounded-md border border-gray-400 bg-white px-3 text-base font-semibold text-black"
                      >
                        <option value="" disabled>Seleccionar...</option>
                        {materials.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-28 space-y-1 shrink-0">
                      <label className="text-xs text-gray-500 font-medium ml-1">Cant. (g)</label>
                      <Input 
                        type="number" step="any" 
                        value={ing.quantityGramos} 
                        onChange={(e) => updateIngredient(ing.id, "quantityGramos", e.target.value)}
                        placeholder="0.00"
                        className="h-12 text-center text-lg font-black"
                      />
                    </div>
                  </div>
                  {ing.rawMaterialId && materials.find(m => m.id === ing.rawMaterialId)?.name.toLowerCase().includes("agua") && (
                     <div className="mt-3 pt-3 border-t border-indigo-100 flex justify-end">
                       <Button 
                         type="button" 
                         variant="ghost" 
                         size="sm"
                         onClick={() => handleAutoFillWater(ing.id)}
                         className="text-[10px] h-8 bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 uppercase tracking-wider px-3"
                       >
                         Calcular Restante
                       </Button>
                     </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
