"use client"

import { useEffect, useState, useMemo } from "react"
import { getProductInventory, processCheckout, CartItem, PaymentMethod, getLoyaltyConfig, updateLoyaltyConfig, LoyaltyConfig } from "@/lib/actions/sales"
import { getClientByPhone } from "@/lib/actions/clients"
import {
  Search, Plus, Minus, ShoppingCart, Package2, X,
  CheckCircle2, CreditCard, ArrowRightLeft, Banknote, ChevronRight, Trash2, 
  Phone, UserPlus, Star, Settings, Check
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"

type Product = { id: string; name: string; stockLiters: number; salePrice: number; costPerLiter: number }
type Cart = Record<string, { product: Product; qty: number }>
type ModalStep = "METHODS" | "CASH_INPUT" | "SUCCESS"

export default function VentasPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<Cart>({})

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<ModalStep>("METHODS")
  const [method, setMethod] = useState<PaymentMethod>("EFECTIVO")
  const [cashInput, setCashInput] = useState("")
  const [checkingOut, setCheckingOut] = useState(false)
  const [successData, setSuccessData] = useState<{ total: number; change: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Loyalty state
  const [customerPhone, setCustomerPhone] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [searchingCustomer, setSearchingCustomer] = useState(false)
  const [redeemPoints, setRedeemPoints] = useState(false)
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig | null>(null)

  const loadProducts = () => {
    setLoading(true)
    getProductInventory().then(res => {
      if (res.success && res.data) setProducts(res.data as Product[])
      setTimeout(() => setLoading(false), 300)
    })
  }

  const loadConfig = () => {
    getLoyaltyConfig().then(res => {
      if (res.success) setLoyaltyConfig(res.data as LoyaltyConfig)
    })
  }

  useEffect(() => { 
    loadProducts()
    loadConfig()
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (customerPhone.length >= 10) {
        setSearchingCustomer(true)
        const res = await getClientByPhone(customerPhone)
        if (res.success) {
          setSelectedCustomer(res.data)
        }
        setSearchingCustomer(false)
      } else {
        setSelectedCustomer(null)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [customerPhone])

  const normalize = (str: string) =>
    str.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()

  const filtered = useMemo(() => {
    const q = normalize(search.trim())
    if (!q) return []
    return products.filter(p => normalize(p.name).includes(q) && p.stockLiters > 0)
  }, [products, search])

  const addToCart = (p: Product) => {
    setCart(prev => {
      const qty = prev[p.id]?.qty || 0
      if (qty >= p.stockLiters) return prev
      return { ...prev, [p.id]: { product: p, qty: qty + 1 } }
    })
  }

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      const item = prev[id]
      if (!item) return prev
      const newQty = item.qty + delta
      if (newQty <= 0) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: { ...item, qty: newQty } }
    })
  }

  const cartItems = Object.values(cart).filter(i => i.qty > 0)
  const total = cartItems.reduce((s, i) => s + i.qty * i.product.salePrice, 0)
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)
  const hasIncompleteStock = cartItems.some(i => i.qty > i.product.stockLiters)

  const totalDiscount = redeemPoints && selectedCustomer && loyaltyConfig 
    ? (selectedCustomer.points || 0) * loyaltyConfig.pointValue 
    : 0
  const totalFinal = Math.max(0, total - totalDiscount)
  const pointsToEarn = Math.floor(totalFinal / (loyaltyConfig?.pointsPerSaleAmount || 100))

  const cashPaid = parseFloat(cashInput) || 0
  const change = cashPaid - totalFinal

  const openModal = () => { setStep("METHODS"); setMethod("EFECTIVO"); setCashInput(""); setError(null); setShowModal(true) }
  const closeModal = () => { if (!checkingOut) { setShowModal(false); setSuccessData(null); setCart({}) } }

  const handleConfirmPayment = async () => {
    if (method === "EFECTIVO" && cashPaid < totalFinal) {
      setError("El monto recibido es menor al total.")
      return
    }
    setCheckingOut(true)
    setError(null)
    const payload: CartItem[] = cartItems.map(i => ({
      productId: i.product.id,
      name: i.product.name,
      quantity: i.qty,
      pricePerLiter: i.product.salePrice,
    }))
    const result = await processCheckout(
      payload, 
      method, 
      method === "EFECTIVO" ? cashPaid : totalFinal,
      selectedCustomer?.id,
      redeemPoints
    )
    if (result.success) {
      setSuccessData({ total: result.total!, change: method === "EFECTIVO" ? change : 0 })
      setStep("SUCCESS")
      setCart({})
      loadProducts()
    } else {
      setError(result.error || "Error al cobrar")
    }
    setCheckingOut(false)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-indigo-700 px-4 pt-6 pb-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <h1 className="text-xl font-black text-white tracking-tight">Punto de Venta</h1>
            <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">Atención a Clientes</p>
          </motion.div>
          {cartCount > 0 && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <ShoppingCart className="h-7 w-7 text-white" />
              <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-indigo-900 text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center">{cartCount}</span>
            </motion.div>
          )}
        </div>
        <div className="relative px-2">
          <Input type="search" placeholder="Buscar producto (ej. Cloro)..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-12 pl-11 rounded-2xl border-0 bg-white shadow-lg text-gray-900 placeholder:text-gray-400 font-bold" />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
        </div>
      </header>

      <main className="flex-1 p-5 pb-[120px] space-y-6">
        {/* BUSCADOR DE CLIENTE / LEALTAD */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-indigo-600 fill-indigo-600" />
              <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Lealtad Rago</p>
            </div>
            {selectedCustomer && (
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">
                Puntos: {selectedCustomer.points || 0}
              </span>
            )}
          </div>
          <div className="p-4 space-y-3">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                type="tel" 
                placeholder="Teléfono del Cliente..." 
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="pl-9 h-11 rounded-xl border-gray-100 text-sm font-bold placeholder:font-normal"
              />
              {searchingCustomer && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                   <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {selectedCustomer ? (
                <motion.div
                  initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 5 }}
                  className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-100"
                >
                  <div>
                    <p className="text-xs font-black text-emerald-800 uppercase leading-tight">{selectedCustomer.name}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Cliente Frecuente</p>
                  </div>
                  <X className="h-4 w-4 text-emerald-400 cursor-pointer" onClick={() => { setCustomerPhone(""); setSelectedCustomer(null); }} />
                </motion.div>
              ) : customerPhone.length >= 10 && !searchingCustomer && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 rounded-xl border border-dashed border-gray-200"
                >
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cliente no registrado</p>
                  <Link href="/clientes">
                    <Button variant="ghost" className="h-7 px-3 text-[10px] font-black text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 group">
                      <UserPlus className="h-3 w-3" />
                      REGISTRAR CLIENTE
                    </Button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* RESULTADOS DE BÚSQUEDA PRODUCTO */}
        <AnimatePresence mode="wait">
          {search.trim() !== "" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                <Search className="h-3 w-3" />
                Sugerencias
              </h2>
              {loading ? (
                <Skeleton className="h-12 w-full rounded-xl" />
              ) : filtered.length === 0 ? (
                <div className="p-4 bg-white rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 text-xs font-bold">
                  Sin coincidencias.
                </div>
              ) : (
                filtered.map(p => (
                  <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-2.5 pl-4 flex items-center justify-between gap-3 shadow-sm transition-all active:scale-[0.98]">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 text-sm truncate uppercase tracking-tight">{p.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-indigo-600 tracking-wider">${p.salePrice.toFixed(2)}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{p.stockLiters.toFixed(1)} L disp.</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => addToCart(p)}
                      disabled={cart[p.id] !== undefined}
                      className="h-8 w-8 rounded-full bg-[#2563eb] hover:bg-blue-700 shadow-md flex items-center justify-center shrink-0 disabled:bg-gray-100 disabled:text-gray-300 transition-all active:scale-90"
                    >
                      <Plus className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* VENTA ACTUAL (LISTA COMPACTA) */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-2">
              Venta Actual
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"/>
            </h2>
            <button 
              onClick={() => setCart({})}
              className="text-[9px] font-black text-red-400 uppercase tracking-[0.15em] hover:text-red-600 transition-colors"
            >
              Limpiar Todo
            </button>
          </div>

          <AnimatePresence>
            {cartItems.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm"
              >
                <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <ShoppingCart className="h-5 w-5 text-gray-200" />
                </div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-loose">Tu lista está vacía</p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {cartItems.map(i => (
                  <motion.div
                    key={i.product.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`bg-white rounded-2xl border transition-all ${i.qty > i.product.stockLiters ? 'border-red-200 shadow-red-50' : 'border-gray-50 shadow-sm shadow-gray-200/40'}`}
                  >
                    <div className="px-4 py-3 flex items-center justify-between gap-4">
                      {/* Información Izquierda */}
                      <div className="min-w-0 flex-1 py-1">
                        <p className="font-black text-gray-900 text-xs leading-tight uppercase break-words">
                          {i.product.name}
                        </p>
                        <p className={`text-[9px] font-bold mt-1 tracking-wider uppercase ${i.qty > i.product.stockLiters ? 'text-red-500' : 'text-gray-500'}`}>
                          ${i.product.salePrice.toFixed(2)}/L · {i.product.stockLiters.toFixed(1)}L Disp.
                        </p>
                      </div>

                      {/* Controles Derecha (Compactos) */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100 shadow-inner">
                          <button 
                            onClick={() => updateQty(i.product.id, -1)}
                            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${i.qty <= 1 ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-white text-gray-700 shadow-sm'}`}
                          >
                            {i.qty <= 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                          </button>
                          
                          <span className="w-10 text-center font-black text-gray-900 text-sm tabular-nums">
                            {i.qty.toFixed(0)}
                          </span>

                          <button 
                            onClick={() => updateQty(i.product.id, 1)}
                            disabled={i.qty >= i.product.stockLiters}
                            className="h-8 w-8 rounded-lg bg-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-200 active:scale-95 transition-all disabled:bg-gray-200 disabled:shadow-none"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="text-right min-w-[70px]">
                          <p className="text-sm font-black text-blue-700 tabular-nums">
                            ${(i.qty * i.product.salePrice).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* BARRA DE COBRO FIJA (STICKY BOTTOM BAR) */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-16 left-0 right-0 z-30 px-3 pb-3"
          >
            <div className="bg-indigo-800 rounded-2xl shadow-2xl flex items-center justify-between p-4 border border-white/10 gap-4">
              <div className="flex-1">
                <p className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-0.5">Total a Pagar</p>
                <p className="text-2xl font-black text-white tabular-nums">${totalFinal.toFixed(2)}</p>
              </div>

              <div className="flex flex-col items-end gap-1">
                 {hasIncompleteStock && (
                   <p className="text-[10px] font-bold text-amber-300 uppercase animate-pulse">Revisar Stock</p>
                 )}
                 <Button 
                   onClick={openModal} 
                   disabled={hasIncompleteStock}
                   className={`h-12 px-8 text-base font-black rounded-xl transition-all shadow-xl ${hasIncompleteStock ? 'bg-gray-600' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-700/30'}`}
                 >
                   Cobrar
                 </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ CHECKOUT MODAL ============ */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center" 
            onClick={closeModal}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[88vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="overflow-y-auto flex-1">
                {step !== "SUCCESS" && (
                  <>
                    <div className="bg-indigo-700 px-6 pt-6 pb-8 relative">
                      <button onClick={closeModal} disabled={checkingOut}
                        className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-white/20 text-white">
                        <X className="h-4 w-4" />
                      </button>
                      <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Registrar Venta</p>
                      <p className="text-white text-5xl font-black">${totalFinal.toFixed(2)}</p>
                      {totalDiscount > 0 && (
                        <p className="text-indigo-300 text-xs mt-1 line-through">Subtotal: ${total.toFixed(2)}</p>
                      )}
                      <p className="text-indigo-300 text-[10px] mt-1 uppercase tracking-widest font-bold">
                        {cartItems.reduce((s, i) => s + i.qty, 0)} litros · {pointsToEarn} PUNTOS GANADOS
                      </p>
                    </div>

                    <div className="px-5 py-5 space-y-4 -mt-4 bg-white rounded-t-3xl relative pb-28">
                      {/* LEALTAD EN CHECKOUT */}
                      {selectedCustomer && (selectedCustomer.points > 0 || pointsToEarn > 0) && (
                        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex items-center justify-center bg-indigo-600 rounded-full shadow-lg shadow-indigo-600/30">
                              <Star className="h-5 w-5 text-white fill-white" />
                            </div>
                            <div>
                               <p className="text-xs font-black text-indigo-900 uppercase leading-none mb-1">Puntos de {selectedCustomer.name.split(' ')[0]}</p>
                               <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Saldo: {selectedCustomer.points || 0} pts (${totalDiscount.toFixed(2)})</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setRedeemPoints(!redeemPoints)}
                            disabled={selectedCustomer.points <= 0}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${redeemPoints ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 border border-indigo-100 active:bg-indigo-50'} disabled:opacity-50`}
                          >
                            {redeemPoints ? ' CANJEADO' : ' CANJEAR'}
                          </button>
                        </div>
                      )}
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium flex justify-between">
                          {error}
                          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
                        </div>
                      )}

                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Método de Pago</p>

                      <div className="space-y-2">
                        <button onClick={() => setMethod("EFECTIVO")}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${method === "EFECTIVO" ? "border-emerald-500 bg-emerald-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${method === "EFECTIVO" ? "bg-emerald-500" : "bg-gray-200"}`}>
                            <Banknote className={`h-5 w-5 ${method === "EFECTIVO" ? "text-white" : "text-gray-500"}`} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className={`font-bold text-base ${method === "EFECTIVO" ? "text-emerald-800" : "text-gray-700"}`}>Efectivo</p>
                            {method === "EFECTIVO" && (
                              <p className="text-xs text-emerald-600 font-medium">Ingresa el monto recibido</p>
                            )}
                          </div>
                          {method === "EFECTIVO" && <ChevronRight className="h-5 w-5 text-emerald-500" />}
                        </button>

                        {method === "EFECTIVO" && (
                          <div className="px-1 space-y-2">
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-400">$</span>
                              <input type="number" step="0.01" min={totalFinal} value={cashInput}
                                onChange={e => setCashInput(e.target.value)}
                                placeholder={totalFinal.toFixed(2)}
                                className="w-full h-14 pl-10 pr-4 text-2xl font-black rounded-xl border-2 border-emerald-300 focus:border-emerald-500 focus:outline-none bg-white text-[#1a1a1a] placeholder:text-gray-400"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {[{ label: "Exacto", val: totalFinal }, { label: "$100", val: 100 }, { label: "$200", val: 200 }].map(btn => (
                                <button key={btn.label} onClick={() => setCashInput(btn.val.toFixed(2))}
                                  className="py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm hover:bg-emerald-100 transition-colors">
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                            {cashPaid > 0 && cashPaid >= totalFinal && (
                              <div className="flex justify-between px-2 py-1">
                                <span className="text-sm font-medium text-gray-500">Cambio a entregar</span>
                                <span className="text-lg font-black text-indigo-700">${change.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <button onClick={() => setMethod("TARJETA")}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${method === "TARJETA" ? "border-indigo-500 bg-indigo-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${method === "TARJETA" ? "bg-indigo-500" : "bg-gray-200"}`}>
                            <CreditCard className={`h-5 w-5 ${method === "TARJETA" ? "text-white" : "text-gray-500"}`} />
                          </div>
                          <p className={`font-bold text-base ${method === "TARJETA" ? "text-indigo-800" : "text-gray-700"}`}>Tarjeta Crédito / Débito</p>
                        </button>

                        <button onClick={() => setMethod("TRANSFERENCIA")}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${method === "TRANSFERENCIA" ? "border-purple-500 bg-purple-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${method === "TRANSFERENCIA" ? "bg-purple-500" : "bg-gray-200"}`}>
                            <ArrowRightLeft className={`h-5 w-5 ${method === "TRANSFERENCIA" ? "text-white" : "text-gray-500"}`} />
                          </div>
                          <p className={`font-bold text-base ${method === "TRANSFERENCIA" ? "text-purple-800" : "text-gray-700"}`}>Transferencia Bancaria</p>
                        </button>
                      </div>

                      <Button onClick={handleConfirmPayment} disabled={checkingOut || (method === "EFECTIVO" && cashPaid < totalFinal)}
                        className="w-full h-14 text-lg font-black rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 mt-2">
                        {checkingOut ? "Procesando..." : "Confirmar Pago"}
                      </Button>
                    </div>
                  </>
                )}

                {step === "SUCCESS" && successData && (
                  <div className="px-6 py-6 pb-[140px] flex flex-col items-center text-center relative">
                    <button onClick={closeModal}
                      className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                    <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-1">¡Listo!</h2>
                    <p className="text-gray-500 text-sm mb-8">Venta registrada correctamente</p>

                    <div className="w-full bg-gray-50 rounded-2xl p-5 space-y-3 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium">Total cobrado</span>
                        <span className="text-2xl font-black text-gray-900">${successData.total.toFixed(2)}</span>
                      </div>
                      {method === "EFECTIVO" && (
                        <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                          <span className="text-gray-500 font-medium">Cambio a entregar</span>
                          <span className="text-2xl font-black text-indigo-600">${successData.change.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                        <span className="text-gray-500 font-medium">Método</span>
                        <span className="font-bold text-gray-700">{method}</span>
                      </div>
                    </div>

                    <Button onClick={closeModal} className="w-full h-14 mt-6 text-base font-black rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white">
                      Nueva Venta
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
