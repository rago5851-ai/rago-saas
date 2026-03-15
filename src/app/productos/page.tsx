"use client"

import { useEffect, useState, useMemo } from "react"
import { getProducts, deleteProduct, surtirProducto } from "@/lib/actions/products"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Package, Edit2, Trash2, ArrowLeft, PackagePlus, X } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

const normalize = (s: string) =>
  (s ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()

export default function ProductosPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showSurtirModal, setShowSurtirModal] = useState(false)
  const [surtirSearch, setSurtirSearch] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [surtirQuantity, setSurtirQuantity] = useState("")
  const [surtirSubmitting, setSurtirSubmitting] = useState(false)

  useEffect(() => {
    async function loadData() {
      const res = await getProducts()
      if (res.success && res.data) setProducts(res.data as any[])
      setTimeout(() => setLoading(false), 300)
    }
    loadData()
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return
    setDeleting(id)
    const res = await deleteProduct(id)
    if (res.success) setProducts((p) => p.filter((x) => x.id !== id))
    else alert(res.error)
    setDeleting(null)
  }

  const formatStock = (p: any) => {
    const stock = p.stockLiters ?? 0
    const unit = p.unit === "pz" ? "unid." : "L"
    return `${Number(stock).toFixed(0)} ${unit}`
  }

  const surtirMatches = useMemo(() => {
    const q = normalize(surtirSearch.trim())
    if (!q) return []
    return products.filter(
      (p) =>
        normalize(p.name ?? "").includes(q) ||
        normalize(String(p.barcode ?? "")).includes(q)
    )
  }, [products, surtirSearch])

  const handleSurtirSubmit = async () => {
    if (!selectedProduct) return
    const qty = parseFloat(surtirQuantity)
    if (isNaN(qty) || qty <= 0) {
      alert("Ingresa una cantidad válida mayor a 0")
      return
    }
    setSurtirSubmitting(true)
    const res = await surtirProducto(selectedProduct.id, qty)
    setSurtirSubmitting(false)
    if (res.success) {
      setShowSurtirModal(false)
      setSurtirSearch("")
      setSelectedProduct(null)
      setSurtirQuantity("")
      const updated = await getProducts()
      if (updated.success && updated.data) setProducts(updated.data as any[])
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-4 lg:px-8 lg:py-5 shadow-sm">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Productos</h1>
              <p className="text-xs text-slate-500 mt-0.5">Catálogo para venta</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-xl border-teal-200 text-teal-600 hover:bg-teal-50 shrink-0"
              onClick={() => setShowSurtirModal(true)}
            >
              <PackagePlus className="h-5 w-5" />
            </Button>
            <Link href="/productos/new">
              <Button size="icon" className="h-11 w-11 rounded-xl shadow-md shrink-0 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-5 w-5 text-white" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showSurtirModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !surtirSubmitting && setShowSurtirModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Surtir producto</h2>
                <button
                  type="button"
                  onClick={() => !surtirSubmitting && setShowSurtirModal(false)}
                  className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Código de barra o nombre</label>
                  <Input
                    value={surtirSearch}
                    onChange={(e) => {
                      setSurtirSearch(e.target.value)
                      setSelectedProduct(null)
                    }}
                    placeholder="Buscar producto..."
                    className="rounded-xl"
                  />
                </div>
                {surtirSearch.trim() && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Selecciona el producto</label>
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                      {surtirMatches.length === 0 ? (
                        <p className="p-3 text-sm text-slate-500">Sin coincidencias</p>
                      ) : (
                        surtirMatches.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedProduct(p)
                              setSurtirQuantity("")
                            }}
                            className={`w-full p-3 text-left flex justify-between items-center transition-colors ${
                              selectedProduct?.id === p.id ? "bg-teal-50 border-l-4 border-teal-500" : "hover:bg-slate-50"
                            }`}
                          >
                            <span className="font-medium text-slate-800 truncate">{p.name}</span>
                            <span className="text-sm text-slate-500 shrink-0 ml-2">{formatStock(p)}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
                {selectedProduct && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">Cantidad a agregar (unidades)</label>
                      <Input
                        type="number"
                        min="0.01"
                        step="any"
                        value={surtirQuantity}
                        onChange={(e) => setSurtirQuantity(e.target.value)}
                        placeholder="0"
                        className="rounded-xl"
                      />
                    </div>
                    <Button
                      onClick={handleSurtirSubmit}
                      disabled={surtirSubmitting || !surtirQuantity || parseFloat(surtirQuantity) <= 0}
                      className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700"
                    >
                      {surtirSubmitting ? "Surtiendo..." : "Surtir"}
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 p-5 pb-24 lg:p-8 lg:pb-8 max-w-5xl mx-auto w-full space-y-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                  <Package className="h-14 w-14 text-slate-300 mb-4" />
                  <p className="text-slate-600 font-medium">No hay productos registrados</p>
                  <p className="text-slate-400 text-sm mt-1">Agrega productos para venderlos en el punto de venta</p>
                  <Link href="/productos/new" className="mt-4">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar producto
                    </Button>
                  </Link>
                </div>
              ) : (
                products.map((p: any) => (
                  <motion.div
                    layout
                    key={p.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 truncate">{p.name}</span>
                        {(p.stockLiters ?? 0) <= 0 && (
                          <span className="bg-red-500/15 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            AGOTADO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        {p.category && <span>{p.category}</span>}
                        <span className="font-semibold text-blue-600">${Number(p.salePrice ?? 0).toFixed(2)}</span>
                        <span>{formatStock(p)} disp.</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/productos/${p.id}/edit`}>
                        <button
                          type="button"
                          className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.name)}
                        disabled={deleting === p.id}
                        className="h-9 w-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {deleting === p.id ? (
                          <div className="h-4 w-4 border-2 border-red-300 border-t-transparent animate-spin rounded-full" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
