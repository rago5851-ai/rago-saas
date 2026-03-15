"use client"

import { useEffect, useState, useMemo } from "react"
import {
  getProductInventory,
  processCheckout,
  CartItem,
  PaymentMethod,
  getLoyaltyConfig,
  LoyaltyConfig,
} from "@/lib/actions/sales"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
  VentasCartPanel,
  VentasCheckoutModal,
  VentasClienteModal,
  VentasDescuentoModal,
  VentasProductoManualModal,
  VentasSearchModal,
  type Product,
  type Cart,
} from "@/components/ventas"

type ModalStep = "METHODS" | "CASH_INPUT" | "SUCCESS"

export default function VentasPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<Cart>({})

  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<ModalStep>("METHODS")
  const [method, setMethod] = useState<PaymentMethod>("EFECTIVO")
  const [cashInput, setCashInput] = useState("")
  const [checkingOut, setCheckingOut] = useState(false)
  const [successData, setSuccessData] = useState<{
    total: number
    change: number
    totalOriginal?: number
    pointsRedeemed?: number
    discountAmount?: number
    pointsEarned?: number
    manualDiscount?: number
    saleComment?: string
    items?: CartItem[]
    customerName?: string
    customerPhone?: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [customerPhone, setCustomerPhone] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id?: string
    name?: string
    phone?: string
    points?: number
  } | null>(null)
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [redeemPoints, setRedeemPoints] = useState(false)
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig | null>(null)
  const [opcionesMenuOpen, setOpcionesMenuOpen] = useState(false)
  const [showDescuentoModal, setShowDescuentoModal] = useState(false)
  const [showProductoManualModal, setShowProductoManualModal] = useState(false)
  const [manualDiscountAmount, setManualDiscountAmount] = useState(0)
  const [manualDiscountComment, setManualDiscountComment] = useState("")

  const loadProducts = () => {
    setLoading(true)
    getProductInventory().then((res) => {
      if (res.success && res.data) setProducts(res.data as Product[])
      setTimeout(() => setLoading(false), 300)
    })
  }

  const DEFAULT_LOYALTY = { pointsPerSaleAmount: 100, pointValue: 1 }

  const loadConfig = () => {
    getLoyaltyConfig()
      .then((res) => {
        if (res.success && res.data) {
          setLoyaltyConfig({
            pointsPerSaleAmount: Number(res.data.pointsPerSaleAmount) || 100,
            pointValue: Number(res.data.pointValue) || 1,
          } as LoyaltyConfig)
        } else {
          setLoyaltyConfig(DEFAULT_LOYALTY as LoyaltyConfig)
        }
      })
      .catch(() => setLoyaltyConfig(DEFAULT_LOYALTY as LoyaltyConfig))
  }

  useEffect(() => {
    loadProducts()
    loadConfig()
  }, [])

  const normalize = (str: string) =>
    str.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()

  const filtered = useMemo(() => {
    const q = normalize(search.trim())
    if (!q) return []
    return products.filter((p) => {
      const matchName = normalize(p.name ?? "").includes(q)
      const matchBarcode = (p.barcode ?? "").toString().includes(q.trim())
      return (matchName || matchBarcode) && p.stockLiters > 0
    })
  }, [products, search])

  const addToCart = (p: Product, quantity: number = 1) => {
    setCart((prev) => {
      const current = prev[p.id]?.qty || 0
      const maxAllowed = p.stockLiters
      const toAdd = Math.min(quantity, Math.max(0, maxAllowed - current))
      if (toAdd <= 0) return prev
      return { ...prev, [p.id]: { product: p, qty: current + toAdd } }
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => {
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

  const cartItems = Object.values(cart).filter((i) => i.qty > 0)
  const total = cartItems.reduce((s, i) => s + i.qty * i.product.salePrice, 0)
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)
  const hasIncompleteStock = cartItems.some(
    (i) => !i.product.id.startsWith("manual-") && i.qty > i.product.stockLiters
  )

  const addManualProduct = (name: string, price: number) => {
    const id = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const manualProduct: Product = {
      id,
      name: name.trim() || "Producto manual",
      salePrice: price,
      stockLiters: Infinity,
      unit: "pz",
    }
    setCart((prev) => ({
      ...prev,
      [id]: { product: manualProduct, qty: 1 },
    }))
  }

  const totalPotentialDiscount =
    selectedCustomer && loyaltyConfig
      ? (selectedCustomer.points ?? 0) * loyaltyConfig.pointValue
      : 0
  const totalDiscount = redeemPoints ? totalPotentialDiscount : 0
  const totalFinal = Math.max(0, total - totalDiscount - manualDiscountAmount)
  const pointsToEarn = Math.floor(
    totalFinal / (loyaltyConfig?.pointsPerSaleAmount ?? 100)
  )

  const cashPaid = parseFloat(cashInput) || 0
  const change = cashPaid - totalFinal

  const openModal = () => {
    loadConfig()
    setStep("METHODS")
    setMethod("EFECTIVO")
    setCashInput("")
    setError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    if (!checkingOut) {
      // Si cerramos desde la pantalla de éxito (Nueva Venta), quitar el cliente para la siguiente venta
      if (successData != null) {
        setSelectedCustomer(null)
        setCustomerPhone("")
      }
      setShowModal(false)
      setSuccessData(null)
      // No vaciar el carrito al cerrar (solo al completar): el usuario puede agregar más y cobrar después
    }
  }

  const clearManualDiscount = () => {
    setManualDiscountAmount(0)
    setManualDiscountComment("")
  }

  const handleConfirmPayment = async () => {
    if (method === "EFECTIVO" && cashPaid < totalFinal) {
      setError("El monto recibido es menor al total.")
      return
    }
    setCheckingOut(true)
    setError(null)
    const payload: CartItem[] = cartItems.map((i) => ({
      productId: i.product.id,
      name: i.product.name,
      quantity: i.qty,
      pricePerLiter: i.product.salePrice,
      manual: i.product.id.startsWith("manual-"),
    }))
    const result = await processCheckout(
      payload,
      method,
      method === "EFECTIVO" ? cashPaid : totalFinal,
      selectedCustomer?.id,
      redeemPoints,
      manualDiscountAmount,
      manualDiscountComment
    )
    if (result.success) {
      setSuccessData({
        total: result.total!,
        change: method === "EFECTIVO" ? change : 0,
        totalOriginal: result.totalOriginal,
        pointsRedeemed: result.pointsRedeemed,
        discountAmount: result.discountAmount,
        pointsEarned: result.pointsEarned,
        manualDiscount: manualDiscountAmount,
        saleComment: manualDiscountComment || undefined,
        items: payload,
        customerName: selectedCustomer?.name,
        customerPhone: selectedCustomer?.phone ?? customerPhone,
      })
      setStep("SUCCESS")
      setCart({})
      setManualDiscountAmount(0)
      setManualDiscountComment("")
      loadProducts()
    } else {
      setError(result.error ?? "Error al cobrar")
    }
    setCheckingOut(false)
  }

  return (
    <div className="flex flex-col lg:flex-row lg:min-h-screen bg-slate-50/80">
      {/* Header unificado: móvil + escritorio con gradiente y búsqueda */}
      <header className="lg:border-b border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 px-4 py-4 lg:px-8 lg:py-5 shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-white/95 lg:bg-gradient-to-b lg:from-white lg:to-slate-50/50">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
              Punto de venta
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Busca el producto y agrega al carrito
            </p>
          </motion.div>
          <div className="relative w-full focus-within:ring-2 focus-within:ring-[var(--primary)]/20 focus-within:rounded-2xl transition-shadow">
            <Search className="absolute left-4 lg:left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            <Input
              type="search"
              placeholder="Buscar producto (ej. Cloro, Jabón)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-11 lg:pl-12 pr-4 rounded-xl lg:rounded-2xl border border-slate-200/80 bg-white text-slate-900 placeholder:text-slate-400 font-medium focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:border-blue-400 shadow-sm transition-all"
              aria-label="Buscar producto"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 p-5 pb-24 lg:pb-6 lg:pt-6 lg:px-8 lg:max-w-4xl lg:mx-auto space-y-6">
        {/* Botones Clientes y Opciones debajo de la barra */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedCustomer ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setShowClienteModal(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setShowClienteModal(true)
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                Cliente: {selectedCustomer.name ?? "—"}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCustomerPhone("")
                    setSelectedCustomer(null)
                  }}
                  className="rounded p-0.5 hover:bg-slate-200 text-slate-500"
                  aria-label="Quitar cliente"
                >
                  ×
                </button>
              </span>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowClienteModal(true)}
              className="rounded-xl border-slate-200 bg-white hover:bg-slate-50"
            >
              Clientes
            </Button>
          )}
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpcionesMenuOpen((v) => !v)}
              className="rounded-xl border-slate-200 bg-white hover:bg-slate-50"
            >
              Opciones
            </Button>
            {opcionesMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden
                  onClick={() => setOpcionesMenuOpen(false)}
                />
                <div className="absolute left-0 top-full z-20 mt-1 min-w-[200px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setShowDescuentoModal(true)
                      setOpcionesMenuOpen(false)
                    }}
                  >
                    Añadir descuento
                  </button>
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setShowProductoManualModal(true)
                      setOpcionesMenuOpen(false)
                    }}
                  >
                    Producto manual
                  </button>
                </div>
              </>
            )}
          </div>
          {manualDiscountAmount > 0 && (
            <span className="text-sm text-slate-600">
              Descuento: ${manualDiscountAmount.toFixed(2)}
              {manualDiscountComment ? ` (${manualDiscountComment})` : ""}
              <button
                type="button"
                onClick={clearManualDiscount}
                className="ml-1 text-red-600 hover:underline"
              >
                Quitar
              </button>
            </span>
          )}
        </div>

        <VentasCartPanel
          variant="inline"
          cartItems={cartItems}
          totalFinal={totalFinal}
          hasIncompleteStock={hasIncompleteStock}
          onUpdateQty={updateQty}
          onClearCart={() => setCart({})}
          onCheckout={openModal}
        />

      </main>

      <VentasSearchModal
        open={search.trim() !== ""}
        onClose={() => setSearch("")}
        search={search}
        onSearchChange={setSearch}
        filtered={filtered}
        loading={loading}
        onAddToCart={addToCart}
      />

      {/* FAB móvil: total + Cobrar */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-16 left-0 right-0 z-30 px-3 pb-3 lg:hidden"
          >
            <div className="bg-[var(--primary)] rounded-2xl shadow-2xl flex items-center justify-between p-4 border border-white/10 gap-4">
              <div className="flex-1">
                <p className="text-[9px] font-black text-blue-200 uppercase tracking-[0.2em] mb-0.5">
                  Total a pagar
                </p>
                <p className="text-2xl font-black text-white tabular-nums">
                  ${totalFinal.toFixed(2)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {hasIncompleteStock && (
                  <p className="text-[10px] font-bold text-amber-300 uppercase animate-pulse">
                    Revisar stock
                  </p>
                )}
                <Button
                  onClick={openModal}
                  disabled={hasIncompleteStock}
                  className={`h-12 px-8 text-base font-black rounded-xl transition-all shadow-xl ${
                    hasIncompleteStock
                      ? "bg-gray-600"
                      : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-700/30"
                  }`}
                >
                  Cobrar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <VentasClienteModal
        open={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        onSelectCustomer={(c) => {
          setSelectedCustomer(c)
          setCustomerPhone(c.phone ?? "")
          setShowClienteModal(false)
        }}
      />

      <VentasDescuentoModal
        open={showDescuentoModal}
        onClose={() => setShowDescuentoModal(false)}
        onApply={(amount, comment) => {
          setManualDiscountAmount(amount)
          setManualDiscountComment(comment)
          setShowDescuentoModal(false)
        }}
        currentAmount={manualDiscountAmount}
        currentComment={manualDiscountComment}
      />

      <VentasProductoManualModal
        open={showProductoManualModal}
        onClose={() => setShowProductoManualModal(false)}
        onAdd={addManualProduct}
      />

      <VentasCheckoutModal
        open={showModal}
        onClose={closeModal}
        step={step}
        method={method}
        setMethod={setMethod}
        cashInput={cashInput}
        setCashInput={setCashInput}
        totalFinal={totalFinal}
        total={total}
        totalDiscount={totalDiscount}
        change={change}
        cashPaid={cashPaid}
        checkingOut={checkingOut}
        error={error}
        setError={setError}
        selectedCustomer={selectedCustomer}
        redeemPoints={redeemPoints}
        setRedeemPoints={setRedeemPoints}
        totalPotentialDiscount={totalPotentialDiscount}
        pointsToEarn={pointsToEarn}
        cartItemsCount={cartCount}
        successData={successData}
        onConfirmPayment={handleConfirmPayment}
      />
    </div>
  )
}
