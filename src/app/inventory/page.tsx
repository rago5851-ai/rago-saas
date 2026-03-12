import { useEffect, useState } from "react";
import { getRawMaterials, deleteRawMaterial } from "@/lib/actions/inventory";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Beaker, Package, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function InventoryPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  function formatStock(kg: number) {
    if (kg < 1) {
      return `${(kg * 1000).toFixed(0)} g`;
    }
    return `${kg.toFixed(2)} kg`;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      <header className="sticky top-0 z-10 bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Inventario</h1>
            <p className="text-xs text-gray-500">Materia Prima en Bodega</p>
          </motion.div>
          <Link href="/inventory/new">
            <Button size="icon" className="h-10 w-10 rounded-full shadow-md shrink-0 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-5 w-5 text-white" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4 pb-20">
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
                  <Link href="/inventory/new" className="text-indigo-600 font-bold text-xs mt-2 hover:underline">
                    Haz clic aquí para agregar el primero
                  </Link>
                </div>
              ) : (
                materials.map((m: any) => (
                  <Card key={m.id} className="overflow-hidden bg-white border-gray-100 rounded-2xl shadow-md hover:shadow-lg transition-all">
                    <div className="flex justify-between p-5 pb-4 items-start gap-4 bg-white">
                      <div className="pr-2 flex-grow">
                        <div className="font-extrabold text-black text-lg leading-tight w-full break-words tracking-tight">{m.name}</div>
                        
                        <div className="flex gap-2 mt-4">
                          <Link href={`/inventory/${m.id}/edit`}>
                            <button className="text-indigo-600 hover:text-indigo-700 bg-white p-2 rounded-xl transition-all flex items-center justify-center border-2 border-indigo-50 shadow-sm hover:border-indigo-100">
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
                        <span className={`text-2xl font-black ${m.stockKg < 5 ? "text-red-600" : "text-indigo-600"}`}>
                          {formatStock(m.stockKg)}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-0.5">Bodega</span>
                      </div>
                    </div>
                    
                    <CardContent className="px-5 py-5 bg-[#007bff] border-t border-blue-600/20">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest opacity-80">Densidad</span>
                          <span className="text-sm text-white font-black">{m.densityKgL} <span className="text-[10px] font-medium opacity-80">kg/L</span></span>
                        </div>
                        <div className="flex flex-col border-l border-indigo-500/50 pl-2">
                          <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest opacity-80">Activo</span>
                          <span className="text-sm text-white font-black">{m.concentrationPercent}%</span>
                        </div>
                        <div className="flex flex-col border-l border-indigo-500/50 pl-2">
                          <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest opacity-80">Costo</span>
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
      </main>
    </div>
  );
}
