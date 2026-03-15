"use client"

import { useState, useEffect } from "react"
import { X, Phone, UserPlus, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { getClientByPhone, createClient } from "@/lib/actions/clients"

export type CustomerForSale = {
  id?: string
  name?: string
  phone?: string
  points?: number
}

type Props = {
  open: boolean
  onClose: () => void
  onSelectCustomer: (customer: CustomerForSale) => void
}

export function VentasClienteModal({ open, onClose, onSelectCustomer }: Props) {
  const [phone, setPhone] = useState("")
  const [searching, setSearching] = useState(false)
  const [lookupResult, setLookupResult] = useState<CustomerForSale | null | "pending">(null)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizedPhone = phone.replace(/\D/g, "")

  useEffect(() => {
    if (!open) {
      setPhone("")
      setLookupResult(null)
      setNewName("")
      setError(null)
      return
    }
  }, [open])

  useEffect(() => {
    if (!open || normalizedPhone.length < 10) {
      setLookupResult(null)
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      setError(null)
      const res = await getClientByPhone(normalizedPhone)
      setSearching(false)
      if (res.success) {
        setLookupResult((res.data as CustomerForSale | null) ?? null)
      } else {
        setError(res.error ?? "Error al buscar")
        setLookupResult(null)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [open, normalizedPhone])

  const handleUseCustomer = (customer: CustomerForSale) => {
    onSelectCustomer(customer)
    onClose()
  }

  const handleRegisterAndUse = async () => {
    const name = newName.trim()
    if (!name) {
      setError("Escribe el nombre del cliente")
      return
    }
    if (normalizedPhone.length < 10) {
      setError("Teléfono debe tener al menos 10 dígitos")
      return
    }
    setCreating(true)
    setError(null)
    const res = await createClient(name, normalizedPhone)
    setCreating(false)
    if (res.success && res.data) {
      const created = res.data as CustomerForSale
      onSelectCustomer({
        id: created.id,
        name: created.name ?? name,
        phone: created.phone ?? normalizedPhone,
        points: 0,
      })
      onClose()
    } else {
      setError(res.error ?? "No se pudo registrar el cliente")
    }
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
            <h2 className="text-lg font-bold text-slate-800">Asignar cliente a la venta</h2>
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
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="tel"
                placeholder="Teléfono (10 dígitos)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-11 h-12 rounded-xl border-slate-200"
                aria-label="Teléfono del cliente"
              />
              {searching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium" role="alert">
                {error}
              </p>
            )}

            {normalizedPhone.length >= 10 && !searching && lookupResult !== "pending" && (
              <>
                {lookupResult != null ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-emerald-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-emerald-900 truncate">
                          {lookupResult.name ?? "Cliente"}
                        </p>
                        <p className="text-xs text-emerald-600">
                          {(lookupResult.points ?? 0)} pts
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleUseCustomer(lookupResult)}
                      className="shrink-0 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold"
                    >
                      Usar para esta venta
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50"
                  >
                    <p className="text-sm font-medium text-slate-600">No registrado</p>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                        Nombre del cliente
                      </label>
                      <Input
                        type="text"
                        placeholder="Nombre"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="h-11 rounded-xl border-slate-200"
                      />
                    </div>
                    <Button
                      onClick={handleRegisterAndUse}
                      disabled={creating || !newName.trim()}
                      className="w-full min-h-[44px] rounded-xl font-semibold bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
                    >
                      {creating ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          Registrando…
                        </span>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Registrar y usar
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </>
            )}

            {normalizedPhone.length < 10 && (
              <p className="text-sm text-slate-500">Escribe al menos 10 dígitos para buscar.</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
