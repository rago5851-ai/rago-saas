"use server"

import { db } from "@/lib/firebase"
import { cookies } from "next/headers"
import { serializeDoc } from "@/lib/firestore-utils"
import { revalidatePath } from "next/cache"

export async function getProductInventory() {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_token')
    if (!authCookie?.value) return { success: false, error: "No autorizado" }

    // productInventory holds one doc per product, with salePrice + stockLiters
    const snapshot = await db.collection("productInventory")
      .where("userId", "==", authCookie.value)
      .get()

    const items = snapshot.docs
      .map(doc => serializeDoc({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name))

    return { success: true, data: items }
  } catch (error: any) {
    console.error("Error fetching product inventory:", error?.message || error)
    return { success: false, error: "No se pudo cargar el catálogo" }
  }
}

export type CartItem = { productId: string; name: string; quantity: number; pricePerLiter: number }

export async function processCheckout(cart: CartItem[]) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_token')
    if (!authCookie?.value) return { success: false, error: "No autorizado" }
    if (!cart || cart.length === 0) return { success: false, error: "El carrito está vacío" }

    const total = cart.reduce((s, i) => s + i.quantity * i.pricePerLiter, 0)

    // 1. Descontar stock en transacción
    await db.runTransaction(async (transaction: any) => {
      for (const item of cart) {
        const ref = db.collection("productInventory").doc(item.productId)
        const snap = await transaction.get(ref)
        if (!snap.exists) throw new Error(`Producto no encontrado: ${item.name}`)
        const current = snap.data()
        const newStock = (current?.stockLiters || 0) - item.quantity
        if (newStock < 0) throw new Error(`Stock insuficiente para: ${item.name} (disponible: ${(current?.stockLiters || 0).toFixed(1)} L)`)
        transaction.update(ref, { stockLiters: newStock, updatedAt: new Date() })
      }

      // 2. Guardar registro de venta
      const saleRef = db.collection("salesHistory").doc()
      transaction.set(saleRef, {
        userId: authCookie.value,
        items: cart,
        total: Math.round(total * 100) / 100,
        createdAt: new Date(),
      })
    })

    revalidatePath("/ventas")
    return { success: true, total: Math.round(total * 100) / 100 }
  } catch (error: any) {
    console.error("Checkout error:", error?.message || error)
    return { success: false, error: error.message || "Error al procesar el cobro" }
  }
}
