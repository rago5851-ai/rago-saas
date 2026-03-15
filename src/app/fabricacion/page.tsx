"use client"

import { ArrowLeft, Package, FlaskConical, ClipboardCheck, Factory } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

const links = [
  { href: "/inventory", label: "Materia Prima", sub: "Bodega e insumos", Icon: Package, color: "blue" },
  { href: "/formulas", label: "Fórmulas", sub: "Biblioteca de recetas", Icon: FlaskConical, color: "amber" },
  { href: "/production", label: "Producto Terminado", sub: "Stock listo para venta", Icon: ClipboardCheck, color: "emerald" },
] as const

const colorMap = {
  blue: { bg: "bg-blue-500/10", icon: "text-blue-600", hover: "hover:border-blue-300" },
  amber: { bg: "bg-amber-500/10", icon: "text-amber-600", hover: "hover:border-amber-300" },
  emerald: { bg: "bg-emerald-500/10", icon: "text-emerald-600", hover: "hover:border-emerald-300" },
}

export default function FabricacionPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-4 lg:px-8 lg:py-5 shadow-sm">
        <div className="flex items-center gap-4 max-w-5xl mx-auto">
          <Link href="/" className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 hover:bg-slate-200 transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Fabricación</h1>
            <p className="text-xs text-slate-500 mt-0.5">Gestión de producción</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-5 pb-24 lg:p-8 lg:pb-8 max-w-5xl mx-auto w-full space-y-8">
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 lg:p-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Centro de control</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {links.map(({ href, label, sub, Icon, color }) => {
              const c = colorMap[color]
              return (
                <Link key={href} href={href}>
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className={`w-full bg-slate-50 p-5 rounded-2xl border-2 border-transparent ${c.hover} transition-all group flex items-center gap-4`}
                  >
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${c.bg}`}>
                      <Icon className={`h-6 w-6 ${c.icon}`} />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-bold text-slate-800 text-base">{label}</p>
                      <p className="text-xs font-medium text-slate-500">{sub}</p>
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="bg-slate-800 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Acceso rápido</p>
            <h3 className="text-lg font-bold mb-4">¿Preparar un nuevo lote?</h3>
            <Link href="/production/new">
              <Button className="bg-white text-slate-800 hover:bg-slate-100 font-bold rounded-xl h-12 px-6">
                Iniciar producción
              </Button>
            </Link>
          </div>
          <Factory className="absolute -bottom-4 -right-4 h-32 w-32 text-white/5" />
        </section>
      </main>
    </div>
  )
}
