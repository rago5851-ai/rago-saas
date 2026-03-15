"use server"

import { db } from "@/lib/firebase"
import { serializeDoc, sanitizeResponse } from "@/lib/firestore-utils"
import { revalidatePath } from "next/cache"
import { getUserId } from "@/lib/auth-utils"

export type ProductInput = {
  barcode?: string
  name: string
  cost: number
  salePrice: number
  wholesalePrice?: number
  category: string
  stock: number
}

export async function getProducts() {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }
    if (!db) return { success: false, error: "Servicio no disponible" }

    const snapshot = await db.collection("productInventory")
      .where("userId", "==", userId)
      .get()

    const items = snapshot.docs
      .map((doc) => serializeDoc({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
      .sort((a: any, b: any) => (a.name ?? "").localeCompare(b.name ?? ""))

    return sanitizeResponse({ success: true, data: items })
  } catch (error: any) {
    console.error("Error fetching products:", error?.message || error)
    return { success: false, error: "No se pudieron cargar los productos" }
  }
}

export async function createProduct(data: ProductInput) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    if (!data.name?.trim()) return { success: false, error: "El nombre es obligatorio" }
    const cost = Number(data.cost)
    const salePrice = Number(data.salePrice)
    const wholesalePrice = data.wholesalePrice != null ? Number(data.wholesalePrice) : undefined
    const stock = Math.round(Number(data.stock) * 100) / 100
    if (isNaN(salePrice) || salePrice < 0) return { success: false, error: "El precio debe ser válido" }
    if (isNaN(stock) || stock < 0) return { success: false, error: "El stock debe ser válido" }

    const docData = {
      userId,
      name: data.name.trim(),
      barcode: (data.barcode ?? "").trim() || undefined,
      cost: isNaN(cost) ? 0 : Math.round(cost * 100) / 100,
      salePrice: Math.round(salePrice * 100) / 100,
      wholesalePrice: wholesalePrice != null && !isNaN(wholesalePrice) ? Math.round(wholesalePrice * 100) / 100 : undefined,
      category: (data.category ?? "").trim() || undefined,
      stockLiters: stock,
      costPerLiter: isNaN(cost) ? 0 : Math.round(cost * 100) / 100,
      unit: "pz" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection("productInventory").add(docData)

    revalidatePath("/productos")
    revalidatePath("/ventas")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("Error creating product:", error?.message || error)
    return { success: false, error: "No se pudo crear el producto" }
  }
}

export async function updateProduct(id: string, data: Partial<ProductInput>) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }
    if (!db) return { success: false, error: "Servicio no disponible" }

    const doc = await db.collection("productInventory").doc(id).get()
    if (!doc.exists || (doc.data() as any)?.userId !== userId) {
      return { success: false, error: "No tienes permiso para modificar este producto" }
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (data.name != null) updates.name = data.name.trim()
    if (data.barcode != null) updates.barcode = (data.barcode ?? "").trim() || undefined
    if (data.cost != null) {
      const cost = Math.round(Number(data.cost) * 100) / 100
      updates.cost = cost
      updates.costPerLiter = cost
    }
    if (data.salePrice != null) updates.salePrice = Math.round(Number(data.salePrice) * 100) / 100
    if (data.wholesalePrice != null) updates.wholesalePrice = Math.round(Number(data.wholesalePrice) * 100) / 100
    if (data.category != null) updates.category = (data.category ?? "").trim() || undefined
    if (data.stock != null) updates.stockLiters = Math.round(Number(data.stock) * 100) / 100

    await db.collection("productInventory").doc(id).update(updates)

    revalidatePath("/productos")
    revalidatePath("/ventas")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating product:", error?.message || error)
    return { success: false, error: "No se pudo actualizar el producto" }
  }
}

export async function deleteProduct(id: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }
    if (!db) return { success: false, error: "Servicio no disponible" }

    const doc = await db.collection("productInventory").doc(id).get()
    if (!doc.exists || (doc.data() as any)?.userId !== userId) {
      return { success: false, error: "No tienes permiso para eliminar este producto" }
    }

    await db.collection("productInventory").doc(id).delete()
    revalidatePath("/productos")
    revalidatePath("/ventas")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting product:", error?.message || error)
    return { success: false, error: "No se pudo eliminar el producto" }
  }
}

export async function surtirProducto(productId: string, quantity: number) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }
    if (!db) return { success: false, error: "Servicio no disponible" }

    const docRef = db.collection("productInventory").doc(productId)
    const doc = await docRef.get()
    if (!doc.exists || (doc.data() as any)?.userId !== userId) {
      return { success: false, error: "No tienes permiso para surtir este producto" }
    }

    const data = doc.data() as any
    const currentStock = Number(data?.stockLiters) ?? 0
    const unitCost = Number(data?.cost) ?? Number(data?.costPerLiter) ?? 0
    const productName = String(data?.name ?? "")
    const qty = Math.round(Number(quantity) * 100) / 100
    if (qty <= 0) return { success: false, error: "La cantidad debe ser mayor a 0" }

    const newStock = Math.round((currentStock + qty) * 100) / 100
    const totalCost = Math.round(qty * unitCost * 100) / 100

    await docRef.update({ stockLiters: newStock, updatedAt: new Date() })

    await db.collection("productRestocks").add({
      userId,
      productId,
      productName,
      quantity: qty,
      unitCost,
      totalCost,
      createdAt: new Date(),
    })

    revalidatePath("/productos")
    revalidatePath("/ventas")
    revalidatePath("/reportes/utilidades")
    return { success: true }
  } catch (error: any) {
    console.error("Error surtirProducto:", error?.message || error)
    return { success: false, error: "No se pudo surtir el producto" }
  }
}
