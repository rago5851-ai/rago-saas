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
import { getClientByPhone } from "@/lib/actions/clients"
import { Search, ShoppingCart } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
  VentasSearchArea,
  VentasLoyaltyCard,
  VentasCartPanel,
  VentasCheckoutModal,
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
  const [searchingCustomer, setSearchingCustomer] = useState(false)
  const [redeemPoints, setRedeemPoints] = useState(false)
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig | null>(null)

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

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (customerPhone.length >= 10) {
        setSearchingCustomer(true)
        const res = await getClientByPhone(customerPhone)
        if (res.success)
        setSelectedCustomer(
          (res.data ?? null) as { id?: string; name?: string; phone?: string; points?: number } | null
        )
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
    return products.filter((p) => {
      const matchName = normalize(p.name ?? "").includes(q)
      const matchBarcode = (p.barcode ?? "").toString().includes(q.trim())
      return (matchName || matchBarcode) && p.stockLiters > 0
    })
  }, [products, search])

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const qty = prev[p.id]?.qty || 0
      if (qty >= p.stockLiters) return prev
      return { ...prev, [p.id]: { product: p, qty: qty + 1 } }
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
  const hasIncompleteStock = cartItems.some((i) => i.qty > i.product.stockLiters)

  const totalPotentialDiscount =
    selectedCustomer && loyaltyConfig
      ? (selectedCustomer.points ?? 0) * loyaltyConfig.pointValue
      : 0
  const totalDiscount = redeemPoints ? totalPotentialDiscount : 0
  const totalFinal = Math.max(0, total - totalDiscount)
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
      setShowModal(false)
      setSuccessData(null)
      setCart({})
    }
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
    }))
    const result = await processCheckout(
      payload,
      method,
      method === "EFECTIVO" ? cashPaid : totalFinal,
      selectedCustomer?.id,
      redeemPoints
    )
    if (result.success) {
      setSuccessData({
        total: result.total!,
        change: method === "EFECTIVO" ? change : 0,
        totalOriginal: result.totalOriginal,
        pointsRedeemed: result.pointsRedeemed,
        discountAmount: result.discountAmount,
        pointsEarned: result.pointsEarned,
        items: payload,
        customerName: selectedCustomer?.name,
        customerPhone: selectedCustomer?.phone ?? customerPhone,
      })
      setStep("SUCCESS")
      setCart({})
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
        <div className="max-w-6xl mx-auto flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
          <div className="flex items-center justify-between lg:shrink-0">
            <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
                Punto de venta
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Busca el producto y agrega al carrito
              </p>
            </motion.div>
            {cartCount > 0 && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative lg:hidden"
              >
                <ShoppingCart className="h-7 w-7 text-slate-600" />
                <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              </motion.div>
            )}
          </div>
          <div className="relative flex-1 max-w-2xl focus-within:ring-2 focus-within:ring-[var(--primary)]/20 focus-within:rounded-2xl transition-shadow">
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
          <div className="hidden lg:block shrink-0">
            <AnimatePresence mode="wait">
              {cartCount > 0 ? (
                <motion.div
                  key="with-items"
                  initial={{ scale: 0.95, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0.8 }}
                  className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[var(--primary)] text-white shadow-lg shadow-blue-500/25"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-sm font-bold tabular-nums">
                    {cartCount} en carrito
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-slate-100 text-slate-500"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-sm font-medium">Carrito vacío</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="flex-1 p-5 pb-24 lg:pb-6 lg:pt-6 lg:px-8 lg:grid lg:grid-cols-[1fr_300px_380px] lg:gap-6 lg:items-start lg:max-w-7xl lg:mx-auto space-y-6 lg:space-y-0">
        {/* Columna 1: Búsqueda + en móvil Lealtad y Carrito */}
        <div className="space-y-6 lg:space-y-4">
          <VentasSearchArea
            search={search}
            onSearchChange={setSearch}
            filtered={filtered}
            loading={loading}
            isInCart={(id) => cart[id] != null}
            onAddToCart={addToCart}
          />

          <div className="lg:hidden">
            <VentasLoyaltyCard
              customerPhone={customerPhone}
              onCustomerPhoneChange={setCustomerPhone}
              selectedCustomer={selectedCustomer}
              onClearCustomer={() => {
                setCustomerPhone("")
                setSelectedCustomer(null)
              }}
              searchingCustomer={searchingCustomer}
            />
          </div>

          <div className="lg:hidden">
            <VentasCartPanel
              variant="inline"
              cartItems={cartItems}
              totalFinal={totalFinal}
              hasIncompleteStock={hasIncompleteStock}
              onUpdateQty={updateQty}
              onClearCart={() => setCart({})}
              onCheckout={openModal}
            />
          </div>
        </div>

        {/* Columna 2: Lealtad — solo escritorio */}
        <aside className="hidden lg:block lg:sticky lg:top-4 h-fit">
          <VentasLoyaltyCard
            customerPhone={customerPhone}
            onCustomerPhoneChange={setCustomerPhone}
            selectedCustomer={selectedCustomer}
            onClearCustomer={() => {
              setCustomerPhone("")
              setSelectedCustomer(null)
            }}
            searchingCustomer={searchingCustomer}
          />
        </aside>

        {/* Columna 3: Carrito — solo escritorio */}
        <aside className="hidden lg:block lg:sticky lg:top-4 space-y-4">
          <VentasCartPanel
            variant="sidebar"
            cartItems={cartItems}
            totalFinal={totalFinal}
            hasIncompleteStock={hasIncompleteStock}
            onUpdateQty={updateQty}
            onClearCart={() => setCart({})}
            onCheckout={openModal}
          />
        </aside>
      </main>

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
