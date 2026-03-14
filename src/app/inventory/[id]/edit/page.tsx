"use client"

import { useState, useEffect } from "react"
import { updateRawMaterialFromForm, getRawMaterials } from "@/lib/actions/inventory"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, ArrowLeft } from "lucide-react"

export default function EditRawMaterialPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [initialData, setInitialData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadMaterial() {
      const res = await getRawMaterials()
      if (res.success && res.data) {
         const mat = res.data.find((m: any) => m.id === id)
         if (mat) {
           setInitialData(mat)
         } else {
           setError("Materia prima no encontrada")
         }
      } else {
         setError("No se pudo cargar el insumo")
      }
      setLoading(false)
    }
    loadMaterial()
  }, [id])

  async function onSubmit(formData: FormData) {
    formData.append("id", id)
    setSaving(true)
    setError(null)
    const result = await updateRawMaterialFromForm(formData)
    
    if (result.success) {
      router.push("/inventory")
      router.refresh()
    } else {
      setError(result.error || "Ocurrió un error")
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-blue-900 font-bold text-center">Cargando datos...</div>
  if (!initialData) return <div className="p-8 text-red-500 font-bold text-center">{error}</div> 

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-4 shadow-sm flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="h-10 w-10 shrink-0 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Editar Insumo</h1>
          <p className="text-xs text-gray-500">Actualizar registro</p>
        </div>
      </header>

      <main className="flex-1 p-4 pb-24">
        <form action={onSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2 items-start">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Card className="border-0 shadow-sm border-gray-100">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">Nombre de la materia prima</label>
                <Input id="name" name="name" defaultValue={initialData.name} placeholder="Ej. Ácido Sulfónico..." required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="stockKg" className="text-sm font-medium text-gray-700">Existencia Total (Kg)</label>
                  <Input id="stockKg" name="stockKg" defaultValue={initialData.stockKg} type="number" step="any" placeholder="0.00" required />
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="pricePerKg" className="text-sm font-medium text-gray-700">Precio de Compra por Kilo</label>
                  <Input id="pricePerKg" name="pricePerKg" defaultValue={initialData.pricePerKg} type="number" step="any" placeholder="0.00" required />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="densityKgL" className="text-sm font-medium text-gray-700">Densidad (kg/L)</label>
                  <Input id="densityKgL" name="densityKgL" defaultValue={initialData.densityKgL} type="number" step="any" placeholder="Ej: 1.05" required />
                  <p className="text-[10px] text-gray-400">Peso por Litro</p>
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="concentrationPercent" className="text-sm font-medium text-gray-700">Pureza (%)</label>
                  <Input id="concentrationPercent" name="concentrationPercent" defaultValue={initialData.concentrationPercent} type="number" step="any" placeholder="100.0" required />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={saving} className="w-full text-lg font-black text-white bg-blue-600 hover:bg-blue-700 h-14 rounded-xl shadow-lg mt-8">
            {saving ? "Guardando..." : "Actualizar Insumo"}
          </Button>
        </form>
      </main>
    </div>
  )
}
