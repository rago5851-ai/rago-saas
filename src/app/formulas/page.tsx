"use client"

import { useEffect, useState } from "react";
import { getFormulas } from "@/lib/actions/formulas";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Beaker, FileText, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function FormulasPage() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const response = await getFormulas();
      if (response.success && response.data) {
        setFormulas(response.data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
     return <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-medium pb-20">Cargando fórmulas...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      <header className="sticky top-0 z-10 bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Fórmulas</h1>
            <p className="text-xs text-gray-500">Biblioteca de Recetas</p>
          </div>
          <Link href="/formulas/new">
            <Button size="icon" className="h-10 w-10 rounded-full shadow-md shrink-0 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-5 w-5 text-white" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4 pb-20">
        {formulas.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-white rounded-2xl border border-dashed mt-10">
            <Beaker className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-sm font-medium">Sin fórmulas registradas</p>
            <p className="text-xs mt-1">Crea tu primera receta para costear sus ingredientes.</p>
          </div>
        ) : (
          formulas.map((f: any) => {
            
            // Calculos básicos para la fórmula base
            // Calculos básicos para la fórmula base con guards de seguridad
            const baseKg = f.FormulaIngredients.reduce((sum: any, ing: any) => sum + (ing.quantityKg || 0), 0)
            const baseLiters = f.FormulaIngredients.reduce((sum: any, ing: any) => {
              const density = ing.rawMaterial?.densityKgL || 1;
              return sum + ((ing.quantityKg || 0) / density);
            }, 0)
            const rawCost = f.FormulaIngredients.reduce((sum: any, ing: any) => {
              const price = ing.rawMaterial?.pricePerKg || 0;
              return sum + ((ing.quantityKg || 0) * price);
            }, 0)
            const costPerLiter = baseLiters > 0 ? (rawCost / baseLiters).toFixed(2) : "0.00"

            return (
              <Card key={f.id} className="overflow-hidden border-gray-100 shadow-sm transition-all hover:shadow-md">
                <div 
                  className="flex justify-between p-4 pb-2 cursor-pointer transition-colors hover:bg-gray-50 active:bg-gray-100"
                  onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                >
                  <div className="font-semibold text-gray-900 text-lg">{f.name}</div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 rounded-full py-0.5">
                      v{f.version}
                    </span>
                  </div>
                </div>
                
                <CardContent className="px-4 py-3 pt-0 bg-gray-50/50 mt-2 border-t border-b">
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Rendimiento Base
                      </span>
                      <span className="text-sm text-gray-700 font-medium">{baseLiters.toFixed(2)} L ({baseKg.toFixed(2)}kg)</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Costo por Litro</span>
                      <span className="text-sm text-indigo-600 font-bold">${costPerLiter}/L</span>
                    </div>
                  </div>
                </CardContent>
                
                {/* Expandable Ingredients Section */}
                {expandedId === f.id && (
                  <div className="px-4 py-3 bg-white border-t border-b border-gray-100 space-y-2">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Detalle de Insumos</h4>
                    {f.FormulaIngredients.map((ing: any, i: number) => {
                      const percentage = baseKg > 0 ? ((ing.quantityKg / baseKg) * 100).toFixed(1) : "0"
                      const cost = (ing.quantityKg * (ing.rawMaterial?.pricePerKg || 0)).toFixed(2)
                      const weightText = ing.quantityKg < 1 ? `${(ing.quantityKg * 1000).toFixed(0)} g` : `${ing.quantityKg} kg`

                      return (
                        <div key={ing.id || i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 mb-2 last:border-0 last:mb-0 last:pb-0">
                           <div>
                             <p className="font-semibold text-gray-700 leading-snug">{ing.rawMaterial?.name || "Insumo no encontrado"}</p>
                             <p className="text-xs text-gray-400 mt-0.5">{weightText} <span className="text-indigo-400/80">({percentage}%)</span></p>
                           </div>
                           <div className="font-bold text-indigo-600">${cost}</div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="px-4 py-2 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
                   <div 
                     className="flex items-center gap-1 cursor-pointer hover:text-gray-700"
                     onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                   >
                      <FileText className="h-3 w-3" /> 
                      {expandedId === f.id ? "Ocultar Detalles" : `Ver ${f.FormulaIngredients.length} Insumos`}
                   </div>
                   <Link href={`/production/new?formulaId=${f.id}`}>
                      <Button variant="ghost" className="text-indigo-600 h-8 font-medium hover:bg-indigo-50 hover:text-indigo-700">Preparar Lote</Button>
                   </Link>
                </div>
              </Card>
            )
          })
        )}
      </main>
    </div>
  );
}
