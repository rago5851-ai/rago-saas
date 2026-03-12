"use client"

import { useEffect, useState, useMemo } from "react"
import { getProductInventory, processCheckout, CartItem, PaymentMethod } from "@/lib/actions/sales"
import {
  Search, Plus, Minus, ShoppingCart, Package2, X,
  CheckCircle2, CreditCard, ArrowRightLeft, Banknote, ChevronRight
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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

  const loadProducts = () => {
    setLoading(true)
    getProductInventory().then(res => {
      if (res.success && res.data) setProducts(res.data as Product[])
      setLoading(false)
    })
  }

  useEffect(() => { loadProducts() }, [])

  const normalize = (str: string) =>
    str.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()

  const filtered = useMemo(() => {
    const q = normalize(search.trim())
    return products.filter(p => (q === "" || normalize(p.name).includes(q)) && p.stockLiters > 0)
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
      const item = prev[id]
      if (!item || item.qty <= 0) return prev
      if (item.qty === 1) { const next = { ...prev }; delete next[id]; return next }
      return { ...prev, [id]: { ...item, qty: item.qty - 1 } }
    })
  }

  const cartItems = Object.values(cart).filter(i => i.qty > 0)
  const total = cartItems.reduce((s, i) => s + i.qty * i.product.salePrice, 0)
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)

  const cashPaid = parseFloat(cashInput) || 0
  const change = cashPaid - total

  const openModal = () => { setStep("METHODS"); setMethod("EFECTIVO"); setCashInput(""); setError(null); setShowModal(true) }
  const closeModal = () => { if (!checkingOut) { setShowModal(false); setSuccessData(null); setCart({}) } }

  const handleConfirmPayment = async () => {
    if (method === "EFECTIVO" && cashPaid < total) {
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
    const result = await processCheckout(payload, method, method === "EFECTIVO" ? cashPaid : total)
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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-medium pb-20">Cargando catálogo...</div>
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-indigo-700 px-4 pt-6 pb-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Punto de Venta</h1>
            <p className="text-indigo-200 text-xs font-medium">Inventario de Productos Terminados</p>
          </div>
          {cartCount > 0 && (
            <div className="relative">
              <ShoppingCart className="h-7 w-7 text-white" />
              <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-indigo-900 text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center">{cartCount}</span>
            </div>
          )}
        </div>
        <div className="relative">
          <Input type="search" placeholder="Buscar producto..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 pl-10 rounded-xl border-0 bg-white shadow-md text-gray-900 placeholder:text-gray-400 font-medium" />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </header>

      <main className="flex-1 p-4 pb-64 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-white rounded-2xl border border-dashed mt-6">
            <Package2 className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-sm font-medium">{products.length === 0 ? "No hay productos con stock disponible." : "Sin resultados."}</p>
            {products.length === 0 && (
              <Link href="/production" className="text-indigo-600 font-bold text-xs mt-3 hover:underline">Ir a Producción</Link>
            )}
          </div>
        ) : (
          filtered.map(p => {
            const inCart = cart[p.id]?.qty || 0
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-indigo-600 px-4 py-2.5 flex items-center justify-between">
                  <p className="font-black text-white text-base leading-tight truncate mr-2">{p.name}</p>
                  <span className="text-amber-300 font-black text-lg shrink-0">
                    ${p.salePrice != null ? p.salePrice.toFixed(2) : "—"}<span className="text-indigo-200 text-xs font-bold">/L</span>
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <span className={`text-sm font-bold ${p.stockLiters < 5 ? "text-red-500" : "text-emerald-600"}`}>
                    {p.stockLiters.toFixed(1)} L disponibles
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {inCart > 0 && (
                      <>
                        <button onClick={() => removeFromCart(p.id)}
                          className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                          <Minus className="h-4 w-4 text-gray-600" />
                        </button>
                        <span className="w-7 text-center font-black text-gray-900 text-base">{inCart}</span>
                      </>
                    )}
                    <button onClick={() => addToCart(p)} disabled={inCart >= p.stockLiters}
                      className="h-9 w-9 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 flex items-center justify-center transition-colors shadow-sm">
                      <Plus className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </main>

      {/* Sticky cart + cobrar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-20 px-4 pb-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden mx-auto max-w-md">
            <div className="px-4 pt-3 pb-2 space-y-1.5 max-h-36 overflow-y-auto">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carrito</p>
              {cartItems.map(i => (
                <div key={i.product.id} className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium truncate mr-2">{i.product.name}</span>
                  <span className="text-gray-500 shrink-0">{i.qty} L × ${i.product.salePrice?.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50/60 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                <p className="text-2xl font-black text-gray-900">${total.toFixed(2)}</p>
              </div>
              <Button onClick={openModal}
                className="h-14 px-8 text-base font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 shrink-0">
                Cobrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============ CHECKOUT MODAL ============ */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center" onClick={closeModal}>
          <div className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-y-auto max-h-[90vh]"
            onClick={e => e.stopPropagation()}>

            {step !== "SUCCESS" && (
              <>
                {/* Modal header */}
                <div className="bg-indigo-700 px-6 pt-6 pb-8 relative">
                  <button onClick={closeModal} disabled={checkingOut}
                    className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-white/20 text-white">
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Registrar Venta</p>
                  <p className="text-white text-5xl font-black">${total.toFixed(2)}</p>
                  <p className="text-indigo-300 text-sm mt-1">{cartItems.reduce((s, i) => s + i.qty, 0)} litros · {cartItems.length} producto{cartItems.length !== 1 ? "s" : ""}</p>
                </div>

                <div className="px-5 py-5 space-y-4 -mt-4 bg-white rounded-t-3xl relative pb-28">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium flex justify-between">
                      {error}
                      <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
                    </div>
                  )}

                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Método de Pago</p>

                  {/* Payment methods */}
                  <div className="space-y-2">
                    {/* EFECTIVO */}
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

                    {/* EFECTIVO input — aparece inline */}
                    {method === "EFECTIVO" && (
                      <div className="px-1 space-y-2">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-400">$</span>
                          <input type="number" step="0.01" min={total} value={cashInput}
                            onChange={e => setCashInput(e.target.value)}
                            placeholder={total.toFixed(2)}
                            className="w-full h-14 pl-10 pr-4 text-2xl font-black rounded-xl border-2 border-emerald-300 focus:border-emerald-500 focus:outline-none bg-white text-[#1a1a1a] placeholder:text-gray-400"
                          />
                        </div>
                        {/* Quick buttons */}
                        <div className="grid grid-cols-3 gap-2">
                          {[{ label: "Exacto", val: total }, { label: "$100", val: 100 }, { label: "$200", val: 200 }].map(btn => (
                            <button key={btn.label} onClick={() => setCashInput(btn.val.toFixed(2))}
                              className="py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm hover:bg-emerald-100 transition-colors">
                              {btn.label}
                            </button>
                          ))}
                        </div>
                        {cashPaid > 0 && cashPaid >= total && (
                          <div className="flex justify-between px-2 py-1">
                            <span className="text-sm font-medium text-gray-500">Cambio a entregar</span>
                            <span className="text-lg font-black text-indigo-700">${change.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TARJETA */}
                    <button onClick={() => setMethod("TARJETA")}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${method === "TARJETA" ? "border-indigo-500 bg-indigo-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${method === "TARJETA" ? "bg-indigo-500" : "bg-gray-200"}`}>
                        <CreditCard className={`h-5 w-5 ${method === "TARJETA" ? "text-white" : "text-gray-500"}`} />
                      </div>
                      <p className={`font-bold text-base ${method === "TARJETA" ? "text-indigo-800" : "text-gray-700"}`}>Tarjeta Crédito / Débito</p>
                    </button>

                    {/* TRANSFERENCIA */}
                    <button onClick={() => setMethod("TRANSFERENCIA")}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${method === "TRANSFERENCIA" ? "border-purple-500 bg-purple-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${method === "TRANSFERENCIA" ? "bg-purple-500" : "bg-gray-200"}`}>
                        <ArrowRightLeft className={`h-5 w-5 ${method === "TRANSFERENCIA" ? "text-white" : "text-gray-500"}`} />
                      </div>
                      <p className={`font-bold text-base ${method === "TRANSFERENCIA" ? "text-purple-800" : "text-gray-700"}`}>Transferencia Bancaria</p>
                    </button>
                  </div>

                  {/* Confirm button */}
                  <Button onClick={handleConfirmPayment} disabled={checkingOut || (method === "EFECTIVO" && cashPaid < total)}
                    className="w-full h-14 text-lg font-black rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 mt-2">
                    {checkingOut ? "Procesando..." : "Confirmar Pago"}
                  </Button>
                </div>
              </>
            )}

            {/* SUCCESS SCREEN */}
            {step === "SUCCESS" && successData && (
              <div className="px-6 py-10 pb-32 flex flex-col items-center text-center relative">
                {/* X button on success screen */}
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
        </div>
      )}
    </div>
  )
}
