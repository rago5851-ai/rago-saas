"use client"

import { useEffect, useState } from "react";
import { getRawMaterials, deleteRawMaterial, addRawMaterialStock } from "@/lib/actions/inventory";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Package, Edit2, Trash2, PackagePlus, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function InventoryPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [surtirMaterial, setSurtirMaterial] = useState<any | null>(null);
  const [surtirQuantity, setSurtirQuantity] = useState("");
  const [surtirSubmitting, setSurtirSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const response = await getRawMaterials();
      if (response.success && response.data) {
        setMaterials(response.data);
      }
      setTimeout(() => setLoading(false), 300);
    }
    loadData();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro que deseas eliminar "${name}"? Esta acción no se puede deshacer.`)) {
      setDeleting(id);
      const res = await deleteRawMaterial(id);
      if (res.success) {
         setMaterials(materials.filter(m => m.id !== id));
      } else {
         alert(res.error);
      }
      setDeleting(null);
    }
  }

  const handleSurtirSubmit = async () => {
    if (!surtirMaterial) return;
    const qty = parseFloat(surtirQuantity);
    if (isNaN(qty) || qty <= 0) {
      alert("Ingresa una cantidad válida mayor a 0 (kg).");
      return;
    }
    setSurtirSubmitting(true);
    const res = await addRawMaterialStock(surtirMaterial.id, qty);
    setSurtirSubmitting(false);
    if (res.success) {
      setSurtirMaterial(null);
      setSurtirQuantity("");
      const updated = await getRawMaterials();
      if (updated.success && updated.data) setMaterials(updated.data);
    } else {
      alert(res.error);
    }
  }

  function formatStock(kg: number) {
    return `${kg.toFixed(2)} kg`;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-4 lg:px-8 lg:py-5 shadow-sm">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Inventario</h1>
            <p className="text-xs text-slate-500 mt-0.5">Materia prima en bodega</p>
          </div>
          <Link href="/inventory/new">
            <Button size="icon" className="h-11 w-11 rounded-xl shadow-md shrink-0 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-5 w-5 text-white" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-5 pb-24 lg:p-8 lg:pb-8 max-w-5xl mx-auto w-full space-y-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading" 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
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
              {materials.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-white rounded-2xl border border-dashed mt-10">
                  <Package className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-sm font-medium">No hay insumos registrados todavía.</p>
                  <Link href="/inventory/new" className="text-blue-600 font-bold text-xs mt-2 hover:underline">
                    Haz clic aquí para agregar el primero
                  </Link>
                </div>
              ) : (
                materials.map((m: any) => (
                  <Card key={m.id} className="overflow-hidden bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between p-5 pb-4 items-start gap-4 bg-white">
                      <div className="pr-2 flex-grow">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-extrabold text-black text-lg leading-tight break-words tracking-tight">{m.name}</div>
                          {m.stockKg <= 0 && (
                            <span className="bg-red-600 text-[10px] text-white font-black px-2 py-0.5 rounded-full animate-pulse">
                              AGOTADO
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <button
                            type="button"
                            onClick={() => { setSurtirMaterial(m); setSurtirQuantity(""); }}
                            className="text-teal-600 hover:text-teal-700 bg-white p-2 rounded-xl transition-all flex items-center justify-center border-2 border-teal-50 shadow-sm hover:border-teal-100"
                            title="Surtir (agregar a bodega)"
                          >
                            <PackagePlus className="h-4 w-4" />
                          </button>
                          <Link href={`/inventory/${m.id}/edit`}>
                            <button className="text-blue-600 hover:text-blue-700 bg-white p-2 rounded-xl transition-all flex items-center justify-center border-2 border-blue-50 shadow-sm hover:border-blue-100">
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </Link>
                          <button 
                            onClick={() => handleDelete(m.id, m.name)}
                            disabled={deleting === m.id}
                            className="text-red-500 hover:text-red-600 bg-white p-2 rounded-xl transition-all flex items-center justify-center border-2 border-red-50 shadow-sm hover:border-red-100"
                          >
                            {deleting === m.id ? <div className="h-4 w-4 border-2 border-red-300 border-t-transparent animate-spin rounded-full"/> : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end shrink-0">
                        <span className={`text-2xl font-black ${m.stockKg <= 0 ? "text-red-600 drop-shadow-sm" : m.stockKg < 5 ? "text-amber-500" : "text-blue-600"}`}>
                          {formatStock(m.stockKg)}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-0.5">Bodega</span>
                      </div>
                    </div>
                    
                    <CardContent className="px-5 py-5 bg-[#007bff] border-t border-blue-600/20">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest opacity-80">Densidad</span>
                          <span className="text-sm text-white font-black">{m.densityKgL} <span className="text-[10px] font-medium opacity-80">kg/L</span></span>
                        </div>
                        <div className="flex flex-col border-l border-blue-500/50 pl-2">
                          <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest opacity-80">Activo</span>
                          <span className="text-sm text-white font-black">{m.concentrationPercent}%</span>
                        </div>
                        <div className="flex flex-col border-l border-blue-500/50 pl-2">
                          <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest opacity-80">Costo</span>
                          <span className="text-sm text-white font-black leading-none">${m.pricePerKg}<span className="text-[10px] font-medium opacity-80">/kg</span></span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {surtirMaterial && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => !surtirSubmitting && setSurtirMaterial(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">Surtir insumo</h2>
                  <button
                    type="button"
                    onClick={() => !surtirSubmitting && setSurtirMaterial(null)}
                    className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <p className="text-sm text-slate-600 font-medium">{surtirMaterial.name}</p>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Cantidad a agregar (kg)</label>
                    <Input
                      type="number"
                      min="0.001"
                      step="any"
                      value={surtirQuantity}
                      onChange={(e) => setSurtirQuantity(e.target.value)}
                      placeholder="0"
                      className="rounded-xl"
                    />
                  </div>
                  <Button
                    onClick={handleSurtirSubmit}
                    disabled={surtirSubmitting || !surtirQuantity || parseFloat(surtirQuantity) <= 0}
                    className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700"
                  >
                    {surtirSubmitting ? "Agregando..." : "Agregar a bodega"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
