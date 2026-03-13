"use client"

import { useEffect, useState } from "react";
import { getFormulas } from "@/lib/actions/formulas";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Beaker, FileText, TrendingUp, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { deleteFormula } from "@/lib/actions/formulas";

export default function FormulasPage() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const response = await getFormulas();
    if (response.success && response.data) {
      setFormulas(response.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`¿Estás seguro de eliminar la fórmula de ${name}? Esta acción no se puede deshacer.`)) {
      setDeletingId(id);
      const res = await deleteFormula(id);
      if (res.success) {
        await loadData();
      } else {
        alert(res.error || "Error al eliminar");
      }
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      <header className="sticky top-0 z-10 bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Fórmulas</h1>
            <p className="text-xs text-gray-500">Biblioteca de Recetas</p>
          </motion.div>
          <Link href="/formulas/new">
            <Button size="icon" className="h-10 w-10 rounded-full shadow-md shrink-0 bg-indigo-600 hover:bg-indigo-700 transition-colors">
              <Plus className="h-5 w-5 text-white" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4 pb-20">
        <AnimatePresence mode="wait">
          {loading && formulas.length === 0 ? (
            <motion.div 
              key="loading" 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-48 w-full rounded-2xl" />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {formulas.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-white rounded-2xl border border-dashed mt-10">
                  <Beaker className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-sm font-medium">Sin fórmulas registradas</p>
                  <p className="text-xs mt-1">Crea tu primera receta para costear sus ingredientes.</p>
                </div>
              ) : (
                formulas.map((f: any) => {
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
                    <Card key={f.id} className={`overflow-hidden bg-white border-none rounded-2xl shadow-md hover:shadow-lg transition-all ${deletingId === f.id ? "opacity-50 grayscale" : ""}`}>
                      <div 
                        className="flex justify-between items-start p-5 pb-4 cursor-pointer transition-colors bg-white group"
                        onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                      >
                        <div className="flex-1 pr-4">
                           <div className="font-extrabold text-black text-lg leading-tight tracking-tight group-hover:text-blue-600 transition-colors uppercase">{f.name}</div>
                           <div className="mt-1">
                              <span className="text-[10px] font-black bg-blue-50 text-[#007bff] px-2.5 rounded-full py-0.5 border border-blue-100">
                                V{f.version}
                              </span>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                           <Link href={`/formulas/${f.id}/edit`} onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-blue-600 hover:bg-blue-50">
                                 <Pencil className="h-4 w-4" />
                              </Button>
                           </Link>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-9 w-9 rounded-xl text-red-400 hover:bg-red-50"
                             disabled={deletingId === f.id}
                             onClick={(e) => handleDelete(e, f.id, f.name)}
                           >
                              {deletingId === f.id ? (
                                <div className="h-4 w-4 border-2 border-red-400 border-t-transparent animate-spin rounded-full" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                           </Button>
                        </div>
                      </div>
                      
                      <CardContent className="px-5 py-4 bg-[#007bff] border-y border-blue-600/20 shadow-inner">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest flex items-center gap-1 opacity-90">
                              <TrendingUp className="h-3 w-3" /> Rendimiento Base
                            </span>
                            <span className="text-sm text-white font-black">{baseLiters.toFixed(2)} <span className="text-[10px] font-medium opacity-80">L</span> <span className="text-[10px] font-medium opacity-60">({baseKg.toFixed(2)}kg)</span></span>
                          </div>
                          <div className="flex flex-col border-l border-white/20 pl-4">
                            <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest opacity-90">Costo por Litro</span>
                            <span className="text-base text-white font-black leading-none">${costPerLiter}<span className="text-[10px] font-medium opacity-80">/L</span></span>
                          </div>
                        </div>
                      </CardContent>
                      
                      <AnimatePresence>
                        {expandedId === f.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
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
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="px-4 py-3 bg-white flex justify-between items-center">
                         <div 
                           className="flex items-center gap-1.5 cursor-pointer text-[#007bff] hover:text-blue-700 font-bold text-xs transition-colors"
                           onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                         >
                            <FileText className="h-4 w-4" /> 
                            {expandedId === f.id ? "Ocultar Detalles" : `Ver ${f.FormulaIngredients.length} Insumos`}
                         </div>
                         <Link href={`/production/new?formulaId=${f.id}`}>
                            <Button variant="ghost" className="text-[#007bff] h-9 font-black hover:bg-blue-50 transition-all border border-blue-100 rounded-xl px-4">
                              Preparar Lote
                            </Button>
                         </Link>
                      </div>
                    </Card>
                  )
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
