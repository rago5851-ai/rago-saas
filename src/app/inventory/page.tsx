"use client"

import { useEffect, useState } from "react";
import { getRawMaterials, deleteRawMaterial } from "@/lib/actions/inventory";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Beaker, Package, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";

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
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-medium pb-20">Cargando inventario...</div>;
  }

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
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Inventario</h1>
            <p className="text-xs text-gray-500">Materia Prima en Bodega</p>
          </div>
          <Link href="/inventory/new">
            <Button size="icon" className="h-10 w-10 rounded-full shadow-md shrink-0">
              <Plus className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4 pb-20">
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
            <Card key={m.id} className="overflow-hidden bg-indigo-950 border-indigo-900 shadow-md transition-all">
              <div className="flex justify-between p-4 pb-2 items-start gap-4">
                <div className="pr-2 flex-grow">
                  <div className="font-black text-amber-300 text-base leading-tight w-full break-words">{m.name}</div>
                  <div className="flex gap-2 mt-2">
                     <Link href={`/inventory/${m.id}/edit`}>
                       <button className="text-indigo-300 hover:text-white bg-white/10 p-1.5 rounded-md transition-colors flex items-center justify-center">
                         <Edit2 className="h-4 w-4" />
                       </button>
                     </Link>
                     <button 
                       onClick={() => handleDelete(m.id, m.name)}
                       disabled={deleting === m.id}
                       className="text-red-400 hover:text-red-100 bg-red-500/10 hover:bg-red-500/30 p-1.5 rounded-md transition-colors flex items-center justify-center"
                     >
                       {deleting === m.id ? <div className="h-4 w-4 border-2 border-red-300 border-t-transparent animate-spin rounded-full"/> : <Trash2 className="h-4 w-4" />}
                     </button>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className={`text-xl font-black ${m.stockKg < 5 ? "text-red-400" : "text-emerald-400"}`}>
                    {formatStock(m.stockKg)}
                  </span>
                  <span className="text-[10px] text-indigo-300 uppercase tracking-widest font-bold mt-0.5 shadow-sm">Existencia</span>
                </div>
              </div>
              
              <CardContent className="px-4 py-3 pt-0 bg-indigo-900/50 mt-2 border-t border-indigo-800/50">
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Densidad</span>
                    <span className="text-sm text-indigo-100 font-semibold">{m.densityKgL} kg/L</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Activo</span>
                    <span className="text-sm text-indigo-100 font-semibold">{m.concentrationPercent}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Precio</span>
                    <span className="text-sm text-emerald-300 font-bold">${m.pricePerKg}/kg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
