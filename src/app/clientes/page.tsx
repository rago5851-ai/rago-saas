"use client"

import { useEffect, useState } from "react"
import { getClients, createClient } from "@/lib/actions/clients"
import { getLoyaltyConfig, updateLoyaltyConfig, LoyaltyConfig } from "@/lib/actions/sales"
import { ArrowLeft, UserPlus, Search, Phone, User, Star, X, Settings } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"

export default function ClientesPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Loyalty Config State
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false)
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig | null>(null)
  const [savingLoyalty, setSavingLoyalty] = useState(false)

  const loadClients = async (query = "") => {
    setLoading(true)
    const res = await getClients(query)
    if (res.success && res.data) setClients(res.data)
    setLoading(false)
  }

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadClients(search)
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [search])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newPhone) return
    setProcessing(true)
    const res = await createClient(newName, newPhone)
    if (res.success) {
      setShowModal(false)
      setNewName("")
      setNewPhone("")
      loadClients(search)
    } else {
      setError(res.error || "Error al registrar cliente")
    }
    setProcessing(false)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-4 shadow-sm flex items-center gap-3">
        <Link href="/" className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Clientes</h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Gestión de Lealtad</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => {
              getLoyaltyConfig().then(res => {
                if (res.success) setLoyaltyConfig(res.data as LoyaltyConfig)
                setShowLoyaltyModal(true)
              })
            }} 
            variant="ghost" 
            className="h-10 w-10 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 flex items-center justify-center transition-all"
          >
            <Settings className="h-5 w-5 text-indigo-600" />
          </Button>
          <Button onClick={() => setShowModal(true)} size="icon" className="h-10 w-10 rounded-xl bg-[#2563eb] hover:bg-blue-700 shadow-md transition-all active:scale-95">
            <UserPlus className="h-5 w-5 text-white" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 focus:border-[#2563eb] focus:ring-0 focus:outline-none bg-white text-sm"
          />
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {clients.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <div className="inline-flex h-16 w-16 bg-gray-100 rounded-full items-center justify-center mb-2">
                    <User className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">No se encontraron clientes</p>
                  <Button variant="link" onClick={() => setShowModal(true)} className="text-[#2563eb] font-bold">Registrar el primero</Button>
                </div>
              ) : (
                clients.map(client => (
                  <motion.div 
                    layout
                    key={client.id}
                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4"
                  >
                    <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <User className="h-6 w-6 text-[#2563eb]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{client.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Phone className="h-3 w-3" />
                        <span>{client.phone}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-black text-gray-900">{client.points || 0}</span>
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Puntos</p>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modal Registro */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl space-y-8 relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

              <div className="flex justify-between items-center relative z-10">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-gray-900 leading-none">Nuevo Cliente</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Registro de Lealtad</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-3"
                >
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleCreate} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nombre Completo</label>
                  <div className="relative group">
                     <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-[#2563eb] transition-colors" />
                     <input 
                       autoFocus
                       required
                       value={newName}
                       onChange={e => setNewName(e.target.value)}
                       className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-[#2563eb] focus:outline-none font-bold text-gray-800 transition-all"
                       placeholder="Nombre del cliente"
                     />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Teléfono / WhatsApp</label>
                  <div className="relative group">
                     <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-[#2563eb] transition-colors" />
                     <input 
                       required
                       type="tel"
                       value={newPhone}
                       onChange={e => setNewPhone(e.target.value)}
                       className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-[#2563eb] focus:outline-none font-bold text-gray-800 transition-all"
                       placeholder="10 dígitos"
                     />
                  </div>
                </div>

                <div className="pt-2">
                  <Button 
                    disabled={processing} 
                    className="w-full h-14 bg-[#2563eb] hover:bg-blue-700 rounded-[1.25rem] text-base font-black shadow-xl shadow-blue-500/30 active:scale-[0.98] transition-all"
                  >
                    {processing ? "Procesando..." : "Confirmar Registro"}
                  </Button>
                  {/* Keyboard Safety Space */}
                  <div className="h-4 sm:hidden" />
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Lealtad Rago (Configuración) */}
      <AnimatePresence>
        {showLoyaltyModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setShowLoyaltyModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-indigo-700 p-6 flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <Star className="h-8 w-8 text-white fill-white" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Lealtad Rago</h3>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Configuración del Sistema</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                   <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Estructura de Ganancia</p>
                   <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 shadow-inner">
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Cada gasto de:</p>
                        <div className="relative">
                           <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                           <input 
                            type="number" 
                            className="w-full h-11 pl-8 pr-4 bg-white border border-gray-200 rounded-xl font-black text-gray-800 focus:outline-none focus:border-indigo-600 transition-all shadow-sm"
                            value={loyaltyConfig?.pointsPerSaleAmount || 0}
                            onChange={e => setLoyaltyConfig(prev => prev ? { ...prev, pointsPerSaleAmount: Number(e.target.value) } : { pointsPerSaleAmount: Number(e.target.value), pointValue: 1 })}
                           />
                        </div>
                      </div>
                      <div className="h-full pt-8 font-black text-indigo-400">=</div>
                      <div className="w-20">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Obtiene:</p>
                        <div className="h-11 flex items-center justify-center font-black text-indigo-700 text-lg border-b-2 border-indigo-200 bg-indigo-50/30 rounded-t-xl">
                          1 PTO
                        </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-3">
                   <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Valor de Redención</p>
                   <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 shadow-inner">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">1 Punto Equivale a:</p>
                      <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                         <input 
                          type="number" 
                          className="w-full h-11 pl-8 pr-4 bg-white border border-gray-200 rounded-xl font-black text-gray-800 focus:outline-none focus:border-indigo-600 transition-all shadow-sm"
                          value={loyaltyConfig?.pointValue || 0}
                          onChange={e => setLoyaltyConfig(prev => prev ? { ...prev, pointValue: Number(e.target.value) } : { pointValue: Number(e.target.value), pointsPerSaleAmount: 100 })}
                         />
                      </div>
                   </div>
                </div>

                <Button 
                  disabled={savingLoyalty}
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition-all"
                  onClick={async () => {
                    if (loyaltyConfig) {
                      setSavingLoyalty(true)
                      await updateLoyaltyConfig(loyaltyConfig)
                      setSavingLoyalty(false)
                      setShowLoyaltyModal(false)
                    }
                  }}
                >
                  {savingLoyalty ? "Guardando..." : "Guardar Configuración"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
