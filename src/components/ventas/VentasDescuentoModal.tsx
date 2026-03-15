"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

type Props = {
  open: boolean
  onClose: () => void
  onApply: (amount: number, comment: string) => void
  currentAmount?: number
  currentComment?: string
}

export function VentasDescuentoModal({
  open,
  onClose,
  onApply,
  currentAmount = 0,
  currentComment = "",
}: Props) {
  const [amount, setAmount] = useState("")
  const [comment, setComment] = useState("")

  useEffect(() => {
    if (open) {
      setAmount(currentAmount > 0 ? String(currentAmount) : "")
      setComment(currentComment)
    }
  }, [open, currentAmount, currentComment])

  const handleApply = () => {
    const value = parseFloat(amount.replace(",", ".")) || 0
    if (value <= 0) return
    onApply(value, comment.trim())
    onClose()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
            <h2 className="text-lg font-bold text-slate-800">Añadir descuento</h2>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 min-h-0 p-5 pb-8 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Cantidad a descontar ($)
              </label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Comentario (promoción o comentario)
              </label>
              <Input
                type="text"
                placeholder="Ej. Promo 2x1, Descuento por volumen"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1 h-12 min-h-[44px] rounded-xl text-base font-semibold">
                Cancelar
              </Button>
              <Button
                onClick={handleApply}
                disabled={!(parseFloat(amount.replace(",", ".")) > 0)}
                className="flex-1 h-12 min-h-[44px] rounded-xl text-base font-semibold bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
