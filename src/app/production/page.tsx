"use client"

import { useEffect, useState } from "react";
import { getWorkOrders, deleteWorkOrder } from "@/lib/actions/production";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ClipboardList, CheckCircle2, Clock, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductionPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const response = await getWorkOrders();
      if (response.success && response.data) {
        setOrders(response.data);
      }
      setTimeout(() => setLoading(false), 300);
    }
    loadData();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm("¿Estás seguro de eliminar este registro de producción? (Nota: Los insumos de lotes finalizados ya fueron descontados y no se regresarán al inventario verde).")) {
       setDeleting(id);
       const res = await deleteWorkOrder(id);
       if (res.success) {
         setOrders(orders.filter(o => o.id !== id));
       } else {
         alert(res.error);
       }
       setDeleting(null);
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      <header className="sticky top-0 z-10 bg-white border-b px-6 py-4 shadow-sm">
        <motion.div
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Lotes de Producción</h1>
          <p className="text-xs text-gray-500">Gestión de Órdenes y Fabricación</p>
        </motion.div>
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
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
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
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-white rounded-2xl border border-dashed mt-10">
                  <ClipboardList className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-sm font-medium">No hay órdenes de producción</p>
                  <p className="text-xs mt-1">Dirígete a Fórmulas para preparar un lote.</p>
                  <Link href="/formulas">
                    <Button variant="outline" className="mt-4 h-10 rounded-xl">Ver Fórmulas</Button>
                  </Link>
                </div>
              ) : (
                orders.map((o: any) => (
                  <Link href={`/production/${o.id}`} key={o.id} className="block group">
                    <Card className="overflow-hidden bg-white hover:bg-gray-50/50 transition-all shadow-sm group-hover:shadow-md border border-gray-100 rounded-[1.5rem] relative">
                      <div className="p-5 flex justify-between items-center sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-[#2563eb] text-lg leading-tight truncate uppercase tracking-tight">
                            {o.formula.name}
                          </h3>
                          <div className="text-xs text-gray-500 mt-2 flex items-center gap-2 font-bold">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100/80">
                              {o.status === 'PENDING' ? (
                                <>
                                  <Clock className="h-3 w-3 text-amber-500"/>
                                  <span className="text-gray-600 uppercase tracking-wider text-[9px]">En Preparación</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500"/>
                                  <span className="text-gray-600 uppercase tracking-wider text-[9px]">Finalizado</span>
                                </>
                              )}
                            </div>
                            <span className="text-gray-300">•</span>
                            <span className="text-[10px] uppercase tracking-widest text-gray-400">
                              {new Date(o.createdAt).toLocaleDateString("es-MX", { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 shrink-0">
                          <div className="bg-[#2563eb] text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 whitespace-nowrap">
                            {o.targetVolumeLiters} L
                          </div>
                          <button 
                            onClick={(e) => handleDelete(e, o.id)}
                            disabled={deleting === o.id}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all active:scale-90"
                          >
                            {deleting === o.id ? (
                              <div className="h-4 w-4 border-2 border-red-500 border-t-transparent animate-spin rounded-full"/>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
