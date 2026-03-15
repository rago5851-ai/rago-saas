"use client"

import { useEffect, useState } from "react"
import { getProducts, updateProduct } from "@/lib/actions/products"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, ArrowLeft } from "lucide-react"

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [form, setForm] = useState({
    barcode: "",
    name: "",
    cost: "",
    salePrice: "",
    wholesalePrice: "",
    category: "",
    stock: "",
  })

  useEffect(() => {
    async function load() {
      const res = await getProducts()
      if (res.success && res.data) {
        const p = (res.data as any[]).find((x) => x.id === id)
        if (p) {
          setForm({
            barcode: p.barcode ?? "",
            name: p.name ?? "",
            cost: String(p.cost ?? p.costPerLiter ?? ""),
            salePrice: String(p.salePrice ?? ""),
            wholesalePrice: String(p.wholesalePrice ?? ""),
            category: p.category ?? "",
            stock: String(p.stockLiters ?? ""),
          })
        }
      }
      setFetching(false)
    }
    load()
  }, [id])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const name = form.name.trim()
    if (!name) {
      setError("El nombre es obligatorio")
      setLoading(false)
      return
    }
    const salePrice = parseFloat(form.salePrice)
    const stock = parseFloat(form.stock)
    if (isNaN(salePrice) || salePrice < 0) {
      setError("Ingresa un precio válido")
      setLoading(false)
      return
    }
    if (isNaN(stock) || stock < 0) {
      setError("Ingresa un stock válido")
      setLoading(false)
      return
    }

    const result = await updateProduct(id, {
      barcode: form.barcode.trim() || undefined,
      name,
      cost: parseFloat(form.cost) || 0,
      salePrice,
      wholesalePrice: form.wholesalePrice ? parseFloat(form.wholesalePrice) : undefined,
      category: form.category.trim() || "",
      stock,
    })

    if (result.success) {
      router.push("/productos")
      router.refresh()
    } else {
      setError(result.error || "Ocurrió un error")
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 bg-white border-b px-4 py-5" />
        <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-4 lg:px-8 lg:py-5 shadow-sm">
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          <Link
            href="/productos"
            className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Editar producto</h1>
            <p className="text-xs text-slate-500 mt-0.5">Actualizar datos del catálogo</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 pb-24 lg:p-6 max-w-2xl mx-auto w-full">
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="barcode" className="text-sm font-medium text-slate-700">Código de barra</label>
              <Input
                id="barcode"
                value={form.barcode}
                onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))}
                placeholder="Opcional"
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">Nombre del producto *</label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="cost" className="text-sm font-medium text-slate-700">Costo</label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cost}
                  onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="salePrice" className="text-sm font-medium text-slate-700">Precio venta *</label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.salePrice}
                  onChange={(e) => setForm((p) => ({ ...p, salePrice: e.target.value }))}
                  required
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wholesalePrice" className="text-sm font-medium text-slate-700">Precio a mayoreo</label>
              <Input
                id="wholesalePrice"
                type="number"
                step="0.01"
                min="0"
                value={form.wholesalePrice}
                onChange={(e) => setForm((p) => ({ ...p, wholesalePrice: e.target.value }))}
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="category" className="text-sm font-medium text-slate-700">Categoría</label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="stock" className="text-sm font-medium text-slate-700">Stock (unidades) *</label>
              <Input
                id="stock"
                type="number"
                step="1"
                min="0"
                value={form.stock}
                onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                required
                className="rounded-xl border-slate-200"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg"
          >
            {loading ? "Guardando..." : "Actualizar producto"}
          </Button>
        </form>
      </main>
    </div>
  )
}
