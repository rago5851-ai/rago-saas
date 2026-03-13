"use client"

import { useEffect, useState } from "react"
import { getClients, createClient } from "@/lib/actions/clients"
import { ArrowLeft, UserPlus, Search, Phone, User, Star, X } from "lucide-react"
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
        <Button onClick={() => setShowModal(true)} size="icon" className="h-10 w-10 rounded-xl bg-[#2563eb] hover:bg-blue-700 shadow-md">
          <UserPlus className="h-5 w-5 text-white" />
        </Button>
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="w-full max-w-md bg-white rounded-3xl p-6 pb-10 shadow-2xl space-y-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-900">Nuevo Cliente</h2>
                <button onClick={() => setShowModal(false)} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">{error}</div>}

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nombre Completo</label>
                  <input 
                    autoFocus
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full h-14 px-4 rounded-xl border-2 border-gray-100 focus:border-[#2563eb] focus:outline-none font-bold text-lg"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Teléfono / WhatsApp</label>
                  <input 
                    required
                    type="tel"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full h-14 px-4 rounded-xl border-2 border-gray-100 focus:border-[#2563eb] focus:outline-none font-bold text-lg"
                    placeholder="9381234567"
                  />
                </div>
                <Button disabled={processing} className="w-full h-14 bg-[#2563eb] hover:bg-blue-700 rounded-2xl text-lg font-black shadow-lg shadow-blue-500/20">
                  {processing ? "Registrando..." : "Confirmar Registro"}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
