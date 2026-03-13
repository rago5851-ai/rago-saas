"use client"

import { useEffect, useState } from "react"
import { getClients, createClient } from "@/lib/actions/clients"
import { getLoyaltyConfig, updateLoyaltyConfig, LoyaltyConfig } from "@/lib/actions/sales"
import { ArrowLeft, UserPlus, Search, Phone, User, Star, X, Settings, Check } from "lucide-react"
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
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const loadClients = async (query = "") => {
    // Safety timeout to prevent infinite spinner
    const timer = setTimeout(() => setLoading(false), 4000)
    
    try {
      setLoading(true)
      const res = await getClients(query)
      if (res.success && res.data) setClients(res.data)
    } catch (err) {
      console.error("Error loading clients:", err)
    } finally {
      clearTimeout(timer)
      setLoading(false)
    }
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
          {/* BOTÓN DE CONFIGURACIÓN DE LEALTAD */}
          <Button 
            disabled={loadingConfig}
            onClick={async () => {
              setLoadingConfig(true)
              try {
                const res = await getLoyaltyConfig()
                if (res.success) {
                  setLoyaltyConfig(res.data as LoyaltyConfig)
                } else {
                  // Fallback defaults if fetch fails
                  setLoyaltyConfig({ pointsPerSaleAmount: 100, pointValue: 1 })
                }
              } catch (err) {
                setLoyaltyConfig({ pointsPerSaleAmount: 100, pointValue: 1 })
              } finally {
                setLoadingConfig(false)
                setShowLoyaltyModal(true)
              }
            }} 
            className="h-10 w-10 rounded-2xl border-2 border-[#2563eb] bg-white hover:bg-blue-50 flex items-center justify-center transition-all shadow-sm active:scale-95 group p-0 overflow-hidden"
          >
            {loadingConfig ? (
              <div className="h-4 w-4 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Settings className="h-5 w-5 text-[#2563eb] group-hover:rotate-45 transition-transform duration-300" strokeWidth={3} />
            )}
          </Button>
          <Button onClick={() => setShowModal(true)} size="icon" className="h-10 w-10 rounded-2xl bg-[#2563eb] hover:bg-blue-700 shadow-md transition-all active:scale-95">
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

      {/* Toast de Éxito */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-2"
          >
            <Check className="h-5 w-5" />
            Configuración Actualizada
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Lealtad Rago (Configuración) */}
      <AnimatePresence>
        {showLoyaltyModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowLoyaltyModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl ring-1 ring-black/5 relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Botón Cerrar */}
              <button 
                onClick={() => setShowLoyaltyModal(false)}
                className="absolute top-4 right-4 z-20 h-8 w-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="bg-[#2563eb] p-6 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-sm">
                  <Settings className="h-7 v-7 text-white animate-[spin_10s_linear_infinite]" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Lealtad Rago</h3>
                <p className="text-blue-100 text-[9px] font-black uppercase tracking-[0.2em] mt-1">Configuración del Sistema</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                   <div className="flex justify-between items-center px-1">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estructura de Ganancia</p>
                     <div className="h-px flex-1 bg-gray-100 ml-4" />
                   </div>
                   <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 shadow-inner flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1 mb-1">Cada gasto de:</p>
                          <div className="relative group">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-400 group-focus-within:text-[#2563eb] transition-colors text-sm">$</span>
                             <input 
                              type="number" 
                              onFocus={(e) => e.target.select()}
                              className="w-full h-11 pl-7 pr-3 bg-white border-2 border-transparent focus:border-[#2563eb] rounded-xl font-black text-gray-900 focus:outline-none transition-all shadow-sm text-sm"
                              value={loyaltyConfig?.pointsPerSaleAmount ?? ''}
                              onChange={e => {
                                 const val = e.target.value === '' ? 0 : Number(e.target.value)
                                 setLoyaltyConfig(prev => prev ? { ...prev, pointsPerSaleAmount: val } : { pointsPerSaleAmount: val, pointValue: 1 })
                              }}
                             />
                          </div>
                        </div>
                        <div className="pt-5 hidden sm:block">
                           <div className="text-indigo-300 font-black">=</div>
                        </div>
                        <div className="flex-1">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1 mb-1">Obtiene:</p>
                           <div className="h-11 flex items-center justify-center bg-white/60 rounded-xl border border-indigo-50 font-black text-[#2563eb] text-sm gap-1">
                             1 <span className="text-[10px] opacity-60">PTO</span>
                           </div>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="flex justify-between items-center px-1">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor de Redención</p>
                     <div className="h-px flex-1 bg-gray-100 ml-4" />
                   </div>
                   <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100 shadow-inner space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">1 Punto Equivale a:</p>
                      <div className="relative group">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-400 group-focus-within:text-[#2563eb] transition-colors text-sm">$</span>
                         <input 
                          type="number" 
                          step="0.01"
                          onFocus={(e) => e.target.select()}
                          className="w-full h-11 pl-7 pr-3 bg-white border-2 border-transparent focus:border-[#2563eb] rounded-xl font-black text-gray-900 focus:outline-none transition-all shadow-sm text-sm"
                          value={loyaltyConfig?.pointValue ?? ''}
                          onChange={e => {
                            const val = e.target.value === '' ? 0 : Number(e.target.value)
                            setLoyaltyConfig(prev => prev ? { ...prev, pointValue: val } : { pointValue: val, pointsPerSaleAmount: 100 })
                          }}
                         />
                      </div>
                   </div>
                </div>

                <Button 
                  disabled={savingLoyalty}
                  className="w-full h-14 bg-[#2563eb] hover:bg-blue-700 text-white font-black text-base rounded-2xl shadow-xl shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  onClick={async () => {
                    if (loyaltyConfig) {
                      setSavingLoyalty(true)
                      await updateLoyaltyConfig(loyaltyConfig)
                      setSavingLoyalty(false)
                      setShowLoyaltyModal(false)
                      setShowSuccessToast(true)
                      setTimeout(() => setShowSuccessToast(false), 3000)
                    }
                  }}
                >
                  {savingLoyalty ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Guardar Configuración</>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
