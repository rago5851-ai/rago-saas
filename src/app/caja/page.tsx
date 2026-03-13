"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { getCashRegisterState, processCashCut } from "@/lib/actions/caja"
import { ArrowLeft, Scissors, CheckCircle2, X, Banknote, CreditCard, ArrowRightLeft, Wallet } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"

type CajaState = { efectivo: number; tarjeta: number; transferencia: number; total: number; retainedCash: number }
type CutStep = "CONFIRM" | "RESULT"

export default function CajaPage() {
  const [caja, setCaja] = useState<CajaState | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<CutStep>("CONFIRM")
  const [manualInput, setManualInput] = useState("")
  const [withdraw, setWithdraw] = useState(true)
  const [withdrawInput, setWithdrawInput] = useState("")
  const [processing, setProcessing] = useState(false)
  const [cutResult, setCutResult] = useState<{ difference: number; cashRetained: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadCaja = () => {
    setLoading(true)
    const todayISO = new Date().toLocaleDateString('en-CA')
    getCashRegisterState(todayISO).then(res => {
      if (res.success && res.data) setCaja(res.data as CajaState)
      setTimeout(() => setLoading(false), 300)
    })
  }

  useEffect(() => { loadCaja() }, [])

  const manualCount = parseFloat(manualInput) || 0
  const withdrawAmount = parseFloat(withdrawInput) || 0
  const expectedEfectivo = caja?.efectivo ?? 0
  const difference = manualCount - expectedEfectivo

  const openModal = () => { 
    setStep("CONFIRM"); 
    setManualInput(""); 
    setWithdrawInput(""); 
    setError(null); 
    setShowModal(true) 
  }
  const closeModal = () => { if (!processing) { setShowModal(false); setCutResult(null) } }

  const handleCut = async () => {
    if (withdrawAmount > manualCount) {
      setError("No puedes retirar más de lo que hay físicamente en caja.")
      return
    }
    setProcessing(true)
    setError(null)
    const result = await processCashCut(expectedEfectivo, manualCount, withdrawAmount)
    if (result.success) {
      setCutResult({ difference: result.difference!, cashRetained: result.cashRetained! })
      setStep("RESULT")
      loadCaja()
    } else {
      setError(result.error || "Error al procesar el corte")
    }
    setProcessing(false)
  }

  const handleWithdrawAll = () => {
    // Ponemos el total manual (o lo que haya) para dejar en $0
    setWithdrawInput(manualCount.toString())
  }

  const rows = [
    { label: "Efectivo", icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50", value: caja?.efectivo ?? 0 },
    { label: "Tarjeta Crédito / Débito", icon: CreditCard, color: "text-indigo-600", bg: "bg-indigo-50", value: caja?.tarjeta ?? 0 },
    { label: "Transferencia", icon: ArrowRightLeft, color: "text-purple-600", bg: "bg-purple-50", value: caja?.transferencia ?? 0 },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-4 shadow-sm flex items-center gap-3">
        <Link href="/" className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <motion.div 
          className="flex-1"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Caja Actual</h1>
          <p className="text-xs text-gray-500">Desde el último corte</p>
        </motion.div>
        <Wallet className="h-5 w-5 text-amber-500 shrink-0" />
      </header>

      <main className="flex-1 p-4 pb-32 space-y-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading" 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                {rows.map(({ label, icon: Icon, color, bg, value }) => (
                  <div key={label} className="flex items-center gap-4 px-4 py-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <span className="flex-1 font-medium text-gray-700 text-sm">{label}</span>
                    <span className={`text-lg font-black ${color}`}>${value.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="bg-indigo-700 rounded-2xl px-5 py-5 flex justify-between items-center shadow-md">
                <span className="text-indigo-100 font-bold text-base">Total General</span>
                <span className="text-white text-3xl font-black">${caja?.total?.toFixed(2) ?? "0.00"}</span>
              </div>

              {(caja?.retainedCash ?? 0) > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <Banknote className="h-5 w-5 text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-800 font-medium">
                    Incluye <span className="font-black">${caja?.retainedCash?.toFixed(2)}</span> retenidos del corte anterior.
                  </p>
                </div>
              )}

              <Button onClick={openModal}
                className="w-full h-16 text-lg font-black rounded-2xl bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/30 flex items-center justify-center gap-3 mt-2">
                <Scissors className="h-6 w-6" />
                Hacer Corte de Caja
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center" 
            onClick={closeModal}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[88vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="overflow-y-auto flex-1">
                {step === "CONFIRM" && (
                  <>
                    <div className="bg-amber-500 px-6 pt-6 pb-7 relative">
                      <button onClick={closeModal} disabled={processing}
                        className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-white/25 text-white">
                        <X className="h-4 w-4" />
                      </button>
                      <p className="text-amber-100 text-xs font-bold uppercase tracking-widest mb-1">Corte de Caja</p>
                      <p className="text-white text-4xl font-black">${caja?.total.toFixed(2)}</p>
                      <p className="text-amber-100 text-sm mt-1">Total en caja actual</p>
                    </div>

                    <div className="px-5 py-5 space-y-5 -mt-3 bg-white rounded-t-3xl pb-[140px]">
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium flex justify-between">
                          {error}
                          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
                        </div>
                      )}

                      <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">💵 Total Esperado (Efectivo)</span>
                        <span className="font-black text-gray-900 text-lg">${expectedEfectivo.toFixed(2)}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Recuento Manual (Físico)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-gray-400">$</span>
                            <input type="number" step="0.01" min={0} value={manualInput}
                              onChange={e => setManualInput(e.target.value)}
                              placeholder="0.00"
                              className="w-full h-12 pl-10 pr-4 text-xl font-black rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:outline-none bg-white text-[#1a1a1a] placeholder:text-gray-400"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Cantidad a Retirar</label>
                          <div className="relative flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-gray-400">$</span>
                              <input type="number" step="0.01" min={0} value={withdrawInput}
                                onChange={e => setWithdrawInput(e.target.value)}
                                placeholder="0.00"
                                className="w-full h-12 pl-10 pr-4 text-xl font-black rounded-xl border-2 border-amber-300 focus:border-amber-500 focus:outline-none bg-white text-[#1a1a1a] placeholder:text-gray-400"
                              />
                            </div>
                            <Button onClick={handleWithdrawAll} variant="outline" className="h-12 border-2 border-amber-500 text-amber-600 font-bold whitespace-nowrap">
                              Retirar Todo
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Diferencia (Sobra/Falta):</span>
                          <span className={`font-black ${difference >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {difference >= 0 ? "+" : ""}${difference.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-t pt-2">
                          <span className="text-gray-500">Queda como Fondo:</span>
                          <span className="font-black text-indigo-600">
                            ${(manualCount - withdrawAmount).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <Button onClick={handleCut} disabled={processing || manualInput === "" || withdrawInput === ""}
                        className="w-full h-14 text-base font-black rounded-2xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg">
                        {processing ? "Procesando..." : "Realizar Corte"}
                      </Button>
                    </div>
                  </>
                )}

                {step === "RESULT" && cutResult && (
                  <div className="px-6 py-6 pb-[140px] flex flex-col items-center text-center relative">
                    <button onClick={closeModal}
                      className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                    <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-10 w-10 text-amber-500" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-1">¡Corte listo!</h2>
                    <p className="text-gray-500 text-sm mb-6">El corte de caja fue registrado</p>

                    <div className="w-full bg-gray-50 rounded-2xl p-5 space-y-3 text-left">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total esperado (efectivo)</span>
                        <span className="font-black text-gray-900">${expectedEfectivo.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Recuento manual</span>
                        <span className="font-black text-gray-900">${manualCount.toFixed(2)}</span>
                      </div>
                      <div className={`flex justify-between border-t pt-3 ${cutResult.difference >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        <span className="font-bold">Diferencia</span>
                        <span className="font-black text-lg">{cutResult.difference >= 0 ? "+" : ""}${cutResult.difference.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-3">
                        <span className="text-gray-500">Queda en caja</span>
                        <span className="font-black text-indigo-600">${cutResult.cashRetained.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button onClick={closeModal} className="w-full h-14 mt-6 font-black rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white">
                      Cerrar
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
