"use client"

import { useEffect, useState } from "react"
import {
  getVentasDelMes,
  getUtilidadesMes,
  getTotalComprasProductosMes,
  getTotalMateriaPrimaMes,
  saveUtilidadesMes,
  type UtilidadesGastos,
  type OtroGasto,
} from "@/lib/actions/reports"
import { ArrowLeft, DollarSign, TrendingDown, Plus, Trash2, Save } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { format } from "date-fns"

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export default function UtilidadesPage() {
  const now = new Date()
  const [yearMonth, setYearMonth] = useState(format(now, "yyyy-MM"))
  const [ventas, setVentas] = useState<number>(0)
  const [gastos, setGastos] = useState<UtilidadesGastos>({
    materiaPrima: 0,
    comprasProductos: 0,
    nomina: 0,
    renta: 0,
    otrosGastos: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [ventasRes, gastosRes, comprasRes, materiaPrimaRes] = await Promise.all([
          getVentasDelMes(yearMonth),
          getUtilidadesMes(yearMonth),
          getTotalComprasProductosMes(yearMonth),
          getTotalMateriaPrimaMes(yearMonth),
        ])
        if (ventasRes.success && ventasRes.data) setVentas(ventasRes.data.totalVentas ?? 0)
        if (gastosRes.success && gastosRes.data) {
          const saved = gastosRes.data
          const comprasDelMes = comprasRes.success && typeof comprasRes.data === "number" ? comprasRes.data : 0
          const materiaPrimaDelMes = materiaPrimaRes.success && typeof materiaPrimaRes.data === "number" ? materiaPrimaRes.data : 0
          const comprasProductos =
            (Number(saved.comprasProductos) || 0) > 0
              ? saved.comprasProductos
              : comprasDelMes > 0
                ? comprasDelMes
                : 0
          const materiaPrima =
            (Number(saved.materiaPrima) || 0) > 0
              ? saved.materiaPrima
              : materiaPrimaDelMes > 0
                ? materiaPrimaDelMes
                : 0
          setGastos({ ...saved, comprasProductos, materiaPrima })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [yearMonth])

  const totalGastos =
    (Number(gastos.materiaPrima) || 0) +
    (Number(gastos.comprasProductos) || 0) +
    (Number(gastos.nomina) || 0) +
    (Number(gastos.renta) || 0) +
    (gastos.otrosGastos || []).reduce((s, o) => s + (Number(o.monto) || 0), 0)

  const utilidadNeta = ventas - totalGastos

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await saveUtilidadesMes(yearMonth, gastos)
      if (!res.success) alert(res.error)
    } finally {
      setSaving(false)
    }
  }

  const addOtroGasto = () => {
    setGastos((p) => ({
      ...p,
      otrosGastos: [...(p.otrosGastos || []), { concepto: "", monto: 0 }],
    }))
  }

  const updateOtroGasto = (index: number, field: "concepto" | "monto", value: string | number) => {
    setGastos((p) => {
      const list = [...(p.otrosGastos || [])]
      if (!list[index]) return p
      list[index] = { ...list[index], [field]: field === "monto" ? Number(value) || 0 : value }
      return { ...p, otrosGastos: list }
    })
  }

  const removeOtroGasto = (index: number) => {
    setGastos((p) => ({
      ...p,
      otrosGastos: (p.otrosGastos || []).filter((_, i) => i !== index),
    }))
  }

  const [y, m] = yearMonth.split("-").map(Number)
  const monthLabel = m ? MESES[m - 1] : ""
  const yearLabel = y || ""

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-4 lg:px-8 lg:py-5 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto w-full">
          <Link href="/reportes" className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <h1 className="text-lg font-bold text-slate-800">Utilidades</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Selector mes / año */}
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-semibold text-slate-500">Mes</label>
            <select
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800"
            >
              {Array.from({ length: 24 }, (_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
                const val = format(d, "yyyy-MM")
                const label = `${MESES[d.getMonth()]} ${d.getFullYear()}`
                return (
                  <option key={val} value={val}>
                    {label}
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Ingresos: Ventas del mes */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm"
            >
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Ingresos
              </h2>
              <div className="flex items-baseline justify-between">
                <p className="text-slate-600 font-medium">Ventas del mes ({monthLabel} {yearLabel})</p>
                <p className="text-xl font-bold text-emerald-600">${ventas.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
              </div>
            </motion.div>

            {/* Gastos */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4"
            >
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-amber-500" />
                Gastos del mes
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Inversión materia prima</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={gastos.materiaPrima || ""}
                    onChange={(e) => setGastos((p) => ({ ...p, materiaPrima: Number(e.target.value) || 0 }))}
                    placeholder="0"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Compras en productos</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={gastos.comprasProductos || ""}
                    onChange={(e) => setGastos((p) => ({ ...p, comprasProductos: Number(e.target.value) || 0 }))}
                    placeholder="0"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Nómina</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={gastos.nomina || ""}
                    onChange={(e) => setGastos((p) => ({ ...p, nomina: Number(e.target.value) || 0 }))}
                    placeholder="0"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Renta</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={gastos.renta || ""}
                    onChange={(e) => setGastos((p) => ({ ...p, renta: Number(e.target.value) || 0 }))}
                    placeholder="0"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-500">Otros gastos</label>
                  <button
                    type="button"
                    onClick={addOtroGasto}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar
                  </button>
                </div>
                <div className="space-y-2">
                  {(gastos.otrosGastos || []).map((o, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder="Concepto (ej. Luz)"
                        value={o.concepto}
                        onChange={(e) => updateOtroGasto(i, "concepto", e.target.value)}
                        className="rounded-xl flex-1"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        value={o.monto || ""}
                        onChange={(e) => updateOtroGasto(i, "monto", e.target.value)}
                        className="rounded-xl w-24"
                      />
                      <button
                        type="button"
                        onClick={() => removeOtroGasto(i)}
                        className="h-10 w-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl h-11 font-semibold bg-blue-600 hover:bg-blue-700"
              >
                {saving ? "Guardando..." : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar gastos
                  </>
                )}
              </Button>
            </motion.div>

            {/* Desglose y utilidad neta */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4"
            >
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Desglose</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Ventas del mes</span>
                  <span className="font-semibold text-slate-800">${ventas.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                </div>
                {Number(gastos.materiaPrima) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Materia prima</span>
                    <span>- ${Number(gastos.materiaPrima).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {Number(gastos.comprasProductos) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Compras productos</span>
                    <span>- ${Number(gastos.comprasProductos).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {Number(gastos.nomina) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Nómina</span>
                    <span>- ${Number(gastos.nomina).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {Number(gastos.renta) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Renta</span>
                    <span>- ${Number(gastos.renta).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {(gastos.otrosGastos || []).map((o, i) =>
                  Number(o.monto) > 0 ? (
                    <div key={i} className="flex justify-between text-slate-600">
                      <span>{o.concepto || "Otro"}</span>
                      <span>- ${Number(o.monto).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ) : null
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 font-semibold text-slate-700">
                  <span>Total gastos</span>
                  <span>- ${totalGastos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-slate-200 flex justify-between items-center">
                <span className="text-base font-bold text-slate-800">Utilidad neta (lo que queda)</span>
                <span
                  className={`text-2xl font-bold tabular-nums ${
                    utilidadNeta >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  ${utilidadNeta.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </motion.div>
          </>
        )}
      </main>
    </div>
  )
}
