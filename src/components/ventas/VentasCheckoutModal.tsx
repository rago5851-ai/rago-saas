"use client"

import {
  X,
  Star,
  Banknote,
  CreditCard,
  ArrowRightLeft,
  ChevronRight,
  CheckCircle2,
  Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import type { PaymentMethod } from "@/lib/actions/sales"
import type { CartItem } from "@/lib/actions/sales"

type SuccessData = {
  total: number
  change: number
  totalOriginal?: number
  pointsRedeemed?: number
  discountAmount?: number
  pointsEarned?: number
  items?: CartItem[]
  customerName?: string
  customerPhone?: string
}

type Props = {
  open: boolean
  onClose: () => void
  step: "METHODS" | "CASH_INPUT" | "SUCCESS"
  method: PaymentMethod
  setMethod: (m: PaymentMethod) => void
  cashInput: string
  setCashInput: (v: string) => void
  totalFinal: number
  total: number
  totalDiscount: number
  change: number
  cashPaid: number
  checkingOut: boolean
  error: string | null
  setError: (e: string | null) => void
  selectedCustomer: { name?: string; points?: number } | null
  redeemPoints: boolean
  setRedeemPoints: (v: boolean) => void
  totalPotentialDiscount: number
  pointsToEarn: number
  cartItemsCount: number
  successData: SuccessData | null
  onConfirmPayment: () => Promise<void>
}

export function VentasCheckoutModal({
  open,
  onClose,
  step,
  method,
  setMethod,
  cashInput,
  setCashInput,
  totalFinal,
  total,
  totalDiscount,
  change,
  cashPaid,
  checkingOut,
  error,
  setError,
  selectedCustomer,
  redeemPoints,
  setRedeemPoints,
  totalPotentialDiscount,
  pointsToEarn,
  cartItemsCount,
  successData,
  onConfirmPayment,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[88vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="overflow-y-auto flex-1">
            {step !== "SUCCESS" && (
              <>
                <div className="bg-[var(--primary)] px-6 pt-6 pb-8 relative">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={checkingOut}
                    className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">
                    Registrar Venta
                  </p>
                  <p className="text-white text-5xl font-black">${totalFinal.toFixed(2)}</p>
                  {totalDiscount > 0 && (
                    <p className="text-blue-300 text-xs mt-1 line-through">Subtotal: ${total.toFixed(2)}</p>
                  )}
                  <p className="text-blue-300 text-[10px] mt-1 uppercase tracking-widest font-bold">
                    {cartItemsCount} unid. · {pointsToEarn} PUNTOS GANADOS
                  </p>
                </div>

                <div className="px-5 py-5 space-y-4 -mt-4 bg-white rounded-t-3xl relative pb-28">
                  {selectedCustomer != null &&
                    (selectedCustomer.points ?? 0) > 0 &&
                    pointsToEarn > 0 && (
                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex items-center justify-center bg-[var(--primary)] rounded-full shadow-lg shadow-blue-600/30">
                            <Star className="h-5 w-5 text-white fill-white" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-blue-900 uppercase leading-none mb-1">
                              Puntos de {(selectedCustomer.name ?? "").split(" ")[0]}
                            </p>
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                              Saldo: {selectedCustomer.points ?? 0} pts (${totalPotentialDiscount.toFixed(2)})
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRedeemPoints(!redeemPoints)}
                          disabled={(selectedCustomer.points ?? 0) <= 0}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${
                            redeemPoints
                              ? "bg-[var(--primary)] text-white shadow-md"
                              : "bg-white text-blue-600 border border-blue-100 active:bg-blue-50"
                          } disabled:opacity-50`}
                        >
                          {redeemPoints ? " CANJEADO" : " CANJEAR"}
                        </button>
                      </div>
                    )}
                  {error != null && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium flex justify-between items-center">
                      <span>{error}</span>
                      <button type="button" onClick={() => setError(null)} aria-label="Cerrar error">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Método de Pago
                  </p>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setMethod("EFECTIVO")}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                        method === "EFECTIVO"
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-100 bg-gray-50 hover:border-gray-200"
                      }`}
                    >
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                          method === "EFECTIVO" ? "bg-emerald-500" : "bg-gray-200"
                        }`}
                      >
                        <Banknote
                          className={`h-5 w-5 ${method === "EFECTIVO" ? "text-white" : "text-gray-500"}`}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p
                          className={`font-bold text-base ${
                            method === "EFECTIVO" ? "text-emerald-800" : "text-gray-700"
                          }`}
                        >
                          Efectivo
                        </p>
                        {method === "EFECTIVO" && (
                          <p className="text-xs text-emerald-600 font-medium">Ingresa el monto recibido</p>
                        )}
                      </div>
                      {method === "EFECTIVO" && (
                        <ChevronRight className="h-5 w-5 text-emerald-500" />
                      )}
                    </button>

                    {method === "EFECTIVO" && (
                      <div className="px-1 space-y-2">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-400">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min={totalFinal}
                            value={cashInput}
                            onChange={(e) => setCashInput(e.target.value)}
                            placeholder={totalFinal.toFixed(2)}
                            className="w-full h-14 pl-10 pr-4 text-2xl font-black rounded-xl border-2 border-emerald-300 focus:border-emerald-500 focus:outline-none bg-white text-[#1a1a1a] placeholder:text-gray-400"
                            aria-label="Monto recibido"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Exacto", val: totalFinal },
                            { label: "$100", val: 100 },
                            { label: "$200", val: 200 },
                          ].map((btn) => (
                            <button
                              key={btn.label}
                              type="button"
                              onClick={() => setCashInput(btn.val.toFixed(2))}
                              className="py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm hover:bg-emerald-100 transition-colors"
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                        {cashPaid > 0 && cashPaid >= totalFinal && (
                          <div className="flex justify-between px-2 py-1">
                            <span className="text-sm font-medium text-gray-500">Cambio a entregar</span>
                            <span className="text-lg font-black text-blue-700">${change.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setMethod("TARJETA")}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                        method === "TARJETA"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-100 bg-gray-50 hover:border-gray-200"
                      }`}
                    >
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                          method === "TARJETA" ? "bg-blue-500" : "bg-gray-200"
                        }`}
                      >
                        <CreditCard
                          className={`h-5 w-5 ${method === "TARJETA" ? "text-white" : "text-gray-500"}`}
                        />
                      </div>
                      <p
                        className={`font-bold text-base ${
                          method === "TARJETA" ? "text-blue-800" : "text-gray-700"
                        }`}
                      >
                        Tarjeta Crédito / Débito
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMethod("TRANSFERENCIA")}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                        method === "TRANSFERENCIA"
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-100 bg-gray-50 hover:border-gray-200"
                      }`}
                    >
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                          method === "TRANSFERENCIA" ? "bg-purple-500" : "bg-gray-200"
                        }`}
                      >
                        <ArrowRightLeft
                          className={`h-5 w-5 ${
                            method === "TRANSFERENCIA" ? "text-white" : "text-gray-500"
                          }`}
                        />
                      </div>
                      <p
                        className={`font-bold text-base ${
                          method === "TRANSFERENCIA" ? "text-purple-800" : "text-gray-700"
                        }`}
                      >
                        Transferencia Bancaria
                      </p>
                    </button>
                  </div>

                  <Button
                    onClick={onConfirmPayment}
                    disabled={checkingOut || (method === "EFECTIVO" && cashPaid < totalFinal)}
                    className="w-full h-14 text-lg font-black rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 mt-2"
                  >
                    {checkingOut ? "Procesando..." : "Confirmar Pago"}
                  </Button>
                </div>
              </>
            )}

            {step === "SUCCESS" && successData != null && (
              <div className="px-6 py-6 pb-[140px] flex flex-col items-center text-center relative">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-1">¡Listo!</h2>
                <p className="text-gray-500 text-sm mb-6">Venta registrada correctamente</p>

                <div className="w-full bg-gray-50 rounded-2xl p-5 space-y-3 text-left">
                  {successData.totalOriginal != null &&
                    successData.totalOriginal > successData.total && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-medium">Subtotal</span>
                          <span className="font-bold text-gray-700 line-through">
                            ${successData.totalOriginal.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <Star className="h-4 w-4 fill-current" /> Descuento por puntos (
                            {successData.pointsRedeemed ?? 0} pts = $
                            {successData.discountAmount?.toFixed(2) ?? "0.00"})
                          </span>
                          <span className="font-bold text-emerald-600">
                            -${successData.discountAmount?.toFixed(2) ?? "0.00"}
                          </span>
                        </div>
                      </>
                    )}
                  <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                    <span className="text-gray-500 font-medium">Total cobrado</span>
                    <span className="text-2xl font-black text-gray-900">
                      ${successData.total.toFixed(2)}
                    </span>
                  </div>
                  {method === "EFECTIVO" && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Cambio a entregar</span>
                      <span className="text-xl font-black text-blue-600">
                        ${successData.change.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Método</span>
                    <span className="font-bold text-gray-700">{method}</span>
                  </div>
                  {successData.pointsEarned != null && successData.pointsEarned > 0 && (
                    <div className="flex justify-between items-center border-t border-blue-100 pt-3">
                      <span className="text-blue-600 font-bold text-sm">Puntos ganados</span>
                      <span className="font-black text-blue-600">
                        +{successData.pointsEarned} pts
                      </span>
                    </div>
                  )}
                </div>

                {(() => {
                  const phone = (successData.customerPhone ?? "").replace(/\D/g, "")
                  const waNum =
                    phone.length === 10
                      ? `52${phone}`
                      : phone.length === 12 && phone.startsWith("52")
                        ? phone
                        : phone.length >= 10
                          ? `52${phone.slice(-10)}`
                          : ""
                  const ticketLines = [
                    "🏪 *RAGO - Ticket de Venta*",
                    "",
                    "📦 *Productos:*",
                    ...(successData.items ?? []).map(
                      (i: CartItem) =>
                        `• ${i.name}: ${i.quantity} × $${i.pricePerLiter.toFixed(2)} = $${(i.quantity * i.pricePerLiter).toFixed(2)}`
                    ),
                    "",
                    successData.totalOriginal != null && successData.totalOriginal > successData.total
                      ? `Subtotal: $${successData.totalOriginal.toFixed(2)}\nDescuento (puntos): -$${successData.discountAmount?.toFixed(2) ?? "0.00"}`
                      : "",
                    `*Total: $${successData.total.toFixed(2)}*`,
                    "",
                    `💵 Método: ${method}`,
                    method === "EFECTIVO"
                      ? `🔄 Cambio: $${successData.change.toFixed(2)}`
                      : "",
                    successData.pointsEarned
                      ? `⭐ Puntos ganados: ${successData.pointsEarned}`
                      : "",
                    "",
                    "Gracias por tu compra 🙏",
                  ].filter(Boolean)
                  const waText = encodeURIComponent(ticketLines.join("\n"))
                  const waUrl = phone.length >= 10 && waNum ? `https://wa.me/${waNum}?text=${waText}` : null
                  return waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full mt-4 h-14 flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-500 text-emerald-600 font-black bg-white hover:bg-emerald-50 transition-colors"
                    >
                      <Send className="h-5 w-5" />
                      Enviar ticket por WhatsApp
                    </a>
                  ) : null
                })()}

                <Button
                  onClick={onClose}
                  className="w-full h-14 mt-4 text-base font-black rounded-2xl bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Nueva Venta
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  )
}
