"use client"

import { ArrowLeft, Package, FlaskConical, ClipboardCheck, Factory } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export default function FabricacionPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-indigo-600 px-6 pt-12 pb-6 shadow-lg rounded-b-[2rem]">
        <div className="flex items-center gap-4 max-w-lg mx-auto w-full">
          <Link href="/" className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0">
            <ArrowLeft className="h-5 w-5 text-white" />
          </Link>
          <div className="text-white">
            <h1 className="text-xl font-black tracking-tight">Fabricación</h1>
            <p className="text-indigo-100/80 text-[10px] font-bold uppercase tracking-widest">Gestión de Producción</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-5 space-y-6 max-w-lg mx-auto w-full pb-28">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 space-y-6">
          <div className="space-y-1">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Centro de Control</h2>
            <div className="h-1 w-10 bg-indigo-600 rounded-full ml-1"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Materia Prima */}
            <Link href="/inventory">
              <motion.button 
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gray-50 p-5 rounded-2xl border-2 border-transparent hover:border-indigo-600 hover:bg-white transition-all group flex items-center gap-5 shadow-sm"
              >
                <div className="bg-indigo-100 p-3.5 rounded-2xl group-hover:bg-indigo-600 transition-colors duration-300">
                  <Package className="h-7 w-7 text-indigo-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="font-black text-gray-900 text-lg">Materia Prima</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bodega e Insumos</p>
                </div>
              </motion.button>
            </Link>

            {/* Fórmulas */}
            <Link href="/formulas">
              <motion.button 
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gray-50 p-5 rounded-2xl border-2 border-transparent hover:border-indigo-600 hover:bg-white transition-all group flex items-center gap-5 shadow-sm"
              >
                <div className="bg-amber-100 p-3.5 rounded-2xl group-hover:bg-amber-500 transition-colors duration-300">
                  <FlaskConical className="h-7 w-7 text-amber-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="font-black text-gray-900 text-lg">Fórmulas</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Biblioteca de Recetas</p>
                </div>
              </motion.button>
            </Link>

            {/* Producto Terminado */}
            <Link href="/ventas">
              <motion.button 
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gray-50 p-5 rounded-2xl border-2 border-transparent hover:border-indigo-600 hover:bg-white transition-all group flex items-center gap-5 shadow-sm"
              >
                <div className="bg-emerald-100 p-3.5 rounded-2xl group-hover:bg-emerald-500 transition-colors duration-300">
                  <ClipboardCheck className="h-7 w-7 text-emerald-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="font-black text-gray-900 text-lg">Producto Terminado</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stock Listo para Venta</p>
                </div>
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Info card o atajo rápido */}
        <div className="bg-indigo-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Acceso Rápido</p>
            <h3 className="text-lg font-black mb-4">¿Preparar un nuevo lote?</h3>
            <Link href="/production/new">
              <Button className="bg-white text-indigo-900 hover:bg-indigo-50 font-black rounded-xl">
                Iniciar Producción
              </Button>
            </Link>
          </div>
          <Factory className="absolute -bottom-4 -right-4 h-32 w-32 text-white/10 rotate-12" />
        </div>
      </main>
    </div>
  )
}
