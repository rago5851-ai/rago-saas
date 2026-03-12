"use server"

import { db, auth } from "@/lib/firebase"
import { cookies } from "next/headers"
import { serializeDoc } from "@/lib/firestore-utils"
import { revalidatePath } from "next/cache"
import { getUserId } from "@/lib/auth-utils"

export async function getProductInventory() {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    const snapshot = await db.collection("productInventory")
      .where("userId", "==", userId)
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
export type PaymentMethod = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA"

export async function processCheckout(cart: CartItem[], paymentMethod: PaymentMethod = "EFECTIVO", amountPaid: number = 0) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }
    if (!cart || cart.length === 0) return { success: false, error: "El carrito está vacío" }

    const total = cart.reduce((s, i) => s + i.quantity * i.pricePerLiter, 0)

    await db.runTransaction(async (transaction: any) => {
      const refs = cart.map(item => db.collection("productInventory").doc(item.productId))
      const snaps = await Promise.all(refs.map(ref => transaction.get(ref)))

      const updates: { ref: any; newStock: number }[] = []
      for (let i = 0; i < cart.length; i++) {
        const item = cart[i]
        const snap = snaps[i]
        if (!snap.exists) throw new Error(`Producto no encontrado: ${item.name}`)
        const current = snap.data()
        const newStock = (current?.stockLiters || 0) - item.quantity
        if (newStock < 0) {
          throw new Error(`Stock insuficiente para: ${item.name} (disponible: ${(current?.stockLiters || 0).toFixed(1)} L)`)
        }
        updates.push({ ref: refs[i], newStock })
      }

      for (const { ref, newStock } of updates) {
        transaction.update(ref, { stockLiters: newStock, updatedAt: new Date() })
      }

      const saleRef = db.collection("salesHistory").doc()
      transaction.set(saleRef, {
        userId: userId,
        items: cart,
        total: Math.round(total * 100) / 100,
        paymentMethod,
        amountPaid: Math.round(amountPaid * 100) / 100,
        change: paymentMethod === "EFECTIVO" ? Math.round((amountPaid - total) * 100) / 100 : 0,
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

export async function getSalesHistory(dateFilter?: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    let query = db.collection("salesHistory").where("userId", "==", userId)

    if (dateFilter) {
      // dateFilter is YYYY-MM-DD. We filter from 00:00:00 to 23:59:59
      const start = new Date(`${dateFilter}T00:00:00`)
      const end = new Date(`${dateFilter}T23:59:59.999`)
      query = query.where("createdAt", ">=", start).where("createdAt", "<=", end)
    }

    const snap = await query.orderBy("createdAt", "desc").get()

    const sales = snap.docs.map(doc => serializeDoc({ id: doc.id, ...doc.data() }))

    return { success: true, data: sales }
  } catch (error: any) {
    console.error("Error fetching sales history:", error?.message || error)
    return { success: false, error: "No se pudo cargar el historial" }
  }
}

export async function getDashboardStats() {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    // Start of today (local time)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const snap = await db.collection("salesHistory")
      .where("userId", "==", userId)
      .where("createdAt", ">=", today)
      .get()

    const todaySales = snap.docs.map(doc => doc.data())
    const todayTotal = todaySales.reduce((sum: number, s: any) => sum + (s.total || 0), 0)
    const todayCount = todaySales.length

    return { success: true, data: { todayTotal: Math.round(todayTotal * 100) / 100, todayCount } }
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error?.message || error)
    return { success: false, error: "Error al cargar estadísticas" }
  }
}
