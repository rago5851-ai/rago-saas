"use client"

import { useEffect, useState, useMemo } from "react"
import { getProductInventory, processCheckout, CartItem } from "@/lib/actions/sales"
import { Search, Plus, Minus, ShoppingCart, Package2, X, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Product = {
  id: string
  name: string
  stockLiters: number
  salePrice: number
  costPerLiter: number
}

type Cart = Record<string, { product: Product; qty: number }>

export default function VentasPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<Cart>({})
  const [checkingOut, setCheckingOut] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadProducts = () => {
    getProductInventory().then(res => {
      if (res.success && res.data) setProducts(res.data as Product[])
      setLoading(false)
    })
  }

  useEffect(() => { loadProducts() }, [])

  // Normalize text for accent + case-insensitive search (ej: 'laur' matches 'Láurico')
  const normalize = (str: string) =>
    str.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()

  const filtered = useMemo(() => {
    const q = normalize(search.trim())
    return products.filter(p =>
      (q === "" || normalize(p.name).includes(q)) && p.stockLiters > 0
    )
  }, [products, search])

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev[p.id]
      const currentQty = existing?.qty || 0
      if (currentQty >= p.stockLiters) return prev
      return { ...prev, [p.id]: { product: p, qty: currentQty + 1 } }
    })
  }

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev[id]
      if (!existing || existing.qty <= 0) return prev
      if (existing.qty === 1) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: { ...existing, qty: existing.qty - 1 } }
    })
  }

  const cartItems = Object.values(cart).filter(i => i.qty > 0)
  const total = cartItems.reduce((s, i) => s + i.qty * i.product.salePrice, 0)
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)

  const handleCheckout = async () => {
    if (cartItems.length === 0) return
    setCheckingOut(true)
    setError(null)
    setSuccess(null)

    const payload: CartItem[] = cartItems.map(i => ({
      productId: i.product.id,
      name: i.product.name,
      quantity: i.qty,
      pricePerLiter: i.product.salePrice,
    }))

    const result = await processCheckout(payload)
    if (result.success) {
      setSuccess(`✅ Venta de $${result.total?.toFixed(2)} procesada con éxito.`)
      setCart({})
      setLoading(true)
      loadProducts()
    } else {
      setError(result.error || "Error al cobrar")
    }
    setCheckingOut(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-medium pb-20">
        Cargando catálogo...
      </div>
    )
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
              <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-indigo-900 text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center">
                {cartCount}
              </span>
            </div>
          )}
        </div>
        <div className="relative">
          <Input
            type="search"
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 pl-10 rounded-xl border-0 bg-white shadow-md text-gray-900 placeholder:text-gray-400 font-medium"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </header>

      <main className="flex-1 p-4 pb-64 space-y-3">
        {/* Notifications */}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-sm font-medium">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            {success}
            <button onClick={() => setSuccess(null)} className="ml-auto"><X className="h-4 w-4" /></button>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-medium">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-bold">✕</button>
          </div>
        )}

        {/* Product Catalog */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-white rounded-2xl border border-dashed mt-6">
            <Package2 className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-sm font-medium">
              {products.length === 0
                ? "No hay productos terminados con stock."
                : "Sin resultados para tu búsqueda."}
            </p>
            {products.length === 0 && (
              <Link href="/production" className="text-indigo-600 font-bold text-xs mt-3 hover:underline">
                Finalizar un lote de producción
              </Link>
            )}
          </div>
        ) : (
          filtered.map(p => {
            const inCart = cart[p.id]?.qty || 0
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Price badge at top */}
                <div className="bg-indigo-600 px-4 py-2 flex items-center justify-between">
                  <p className="font-black text-white text-base leading-tight truncate mr-2">{p.name}</p>
                  <span className="text-amber-300 font-black text-lg shrink-0">
                    ${p.salePrice != null ? p.salePrice.toFixed(2) : "—"}<span className="text-indigo-200 text-xs font-bold">/L</span>
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <span className={`text-sm font-bold ${p.stockLiters < 5 ? "text-red-500" : "text-emerald-600"}`}>
                    {p.stockLiters.toFixed(1)} L disponibles
                  </span>

                  {/* +/- Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    {inCart > 0 && (
                      <>
                        <button
                          onClick={() => removeFromCart(p.id)}
                          className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        >
                          <Minus className="h-4 w-4 text-gray-600" />
                        </button>
                        <span className="w-6 text-center font-black text-gray-900 text-base">{inCart}</span>
                      </>
                    )}
                    <button
                      onClick={() => addToCart(p)}
                      disabled={inCart >= p.stockLiters}
                      className="h-9 w-9 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 flex items-center justify-center transition-colors shadow-sm"
                    >
                      <Plus className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </main>

      {/* Cart & Checkout — Fixed Bottom Panel */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-20 px-4 pb-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Cart items */}
            <div className="px-4 pt-4 pb-2 space-y-2 max-h-40 overflow-y-auto">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Carrito</p>
              {cartItems.map(i => (
                <div key={i.product.id} className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium truncate mr-2">{i.product.name}</span>
                  <span className="text-gray-500 shrink-0">{i.qty} L × ${i.product.salePrice?.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Divider + Total + Cobrar */}
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/60 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                <p className="text-2xl font-black text-gray-900">${total.toFixed(2)}</p>
              </div>
              <Button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="h-14 px-8 text-base font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 shrink-0"
              >
                {checkingOut ? "Cobrando..." : "Cobrar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
