"use client"

import { useEffect, useState } from "react";
import { getFormulas } from "@/lib/actions/formulas";
import { getWorkOrders } from "@/lib/actions/production";
import { getRawMaterials } from "@/lib/actions/inventory";
import { Card, CardContent } from "@/components/ui/card";
import { Search, History, AlertTriangle, ArrowRight, Activity } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [formulasRes, ordersRes, inventoryRes] = await Promise.all([
        getFormulas(),
        getWorkOrders(),
        getRawMaterials()
      ]);
      if (formulasRes.data) setFormulas(formulasRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (inventoryRes.data) setInventory(inventoryRes.data);
      setLoading(false);
    }
    loadData();
  }, []);

  const recentOrders = orders.slice(0, 3);
  const lowStockMaterials = inventory.filter((m: any) => m.stockKg < 5).slice(0, 2);

  if (loading) {
     return <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-medium">Cargando métricas...</div>
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      <header className="sticky top-0 z-10 bg-indigo-600 px-6 pt-12 pb-6 shadow-md rounded-b-[2rem]">
        <div className="flex justify-between items-center mb-6">
          <div className="text-white">
            <h1 className="text-2xl font-black tracking-tight">Hubble App</h1>
            <p className="text-indigo-200 text-sm font-medium">Gestión de Manufactura</p>
          </div>
          <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
             <Activity className="h-5 w-5 text-white" />
          </div>
        </div>
        
        <div className="relative">
          <Input 
            type="search" 
            placeholder="Buscar fórmulas, inventario..." 
            className="w-full h-12 pl-10 pr-4 rounded-xl border-0 bg-white shadow-lg text-gray-900 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-indigo-300 transition-all font-medium"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </header>

      <main className="flex-1 p-4 pb-24 -mt-2 space-y-6">
        
        {lowStockMaterials.length > 0 && (
          <section>
             <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 pl-2">Alertas de Inventario</h3>
             <div className="space-y-2">
                {lowStockMaterials.map((m: any) => (
                   <Link href="/inventory" key={m.id} className="block">
                     <Card className="bg-red-50/80 border-red-100 shadow-sm hover:bg-red-50 transition-colors">
                        <CardContent className="p-3 flex items-center justify-between mt-2">
                           <div className="flex items-center gap-3">
                              <div className="bg-red-100 p-2 rounded-full text-red-600">
                                 <AlertTriangle className="h-4 w-4" />
                              </div>
                              <div>
                                 <p className="font-bold text-red-900 text-sm leading-tight">{m.name}</p>
                                 <p className="text-xs text-red-700 font-medium">Stock crítico: {m.stockKg} kg</p>
                              </div>
                           </div>
                           <ArrowRight className="h-4 w-4 text-red-400" />
                        </CardContent>
                     </Card>
                   </Link>
                ))}
             </div>
          </section>
        )}

        <section className="grid grid-cols-2 gap-3 mt-4">
           <Link href="/formulas" className="block">
              <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white h-full">
                 <CardContent className="p-4 flex flex-col justify-center items-center text-center mt-2">
                    <div className="text-3xl font-black text-indigo-600 mb-1">{formulas.length}</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Fórmulas<br/>Registradas</div>
                 </CardContent>
              </Card>
           </Link>
           <Link href="/production" className="block">
              <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white h-full">
                 <CardContent className="p-4 flex flex-col justify-center items-center text-center mt-2">
                    <div className="text-3xl font-black text-green-600 mb-1">
                       {orders.filter((o: any) => o.status === 'FINISHED').length}
                    </div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Lotes<br/>Completados</div>
                 </CardContent>
              </Card>
           </Link>
        </section>

        <section className="mt-4">
           <div className="flex justify-between items-end mb-3 px-1">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                 <History className="h-4 w-4 text-gray-400" /> Producción Reciente
              </h3>
              <Link href="/production" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Ver todo</Link>
           </div>
           
           <div className="space-y-2">
             {recentOrders.length === 0 ? (
               <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500 font-medium pb-8 pt-8 mt-2">
                  Aún no hay lotes registrados
               </div>
             ) : (
                recentOrders.map((o: any) => (
                  <Link href={`/production/${o.id}`} key={o.id} className="block">
                    <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden">
                       <div className="flex border-l-4 border-indigo-500">
                          <CardContent className="p-3 px-4 w-full flex justify-between items-center mt-2">
                             <div>
                                <h4 className="font-bold text-gray-900 text-sm leading-tight">{o.formula.name}</h4>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">{o.status === 'FINISHED' ? 'Completado' : 'En Preparación'} • {new Date(o.createdAt).toLocaleDateString()}</p>
                             </div>
                             <div className="text-right shrink-0">
                                <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-sm">{o.targetVolumeLiters} L</span>
                             </div>
                          </CardContent>
                       </div>
                    </Card>
                  </Link>
                ))
             )}
           </div>
        </section>

      </main>
    </div>
  );
}
