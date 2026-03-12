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
    console.log("[AUDIT] processCheckout START", { userId, cartSize: cart.length, total, paymentMethod });

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
      console.log("[AUDIT] Transaction set saleRef", saleRef.id);
    })

    console.log("[AUDIT] processCheckout SUCCESS", { userId });

    revalidatePath("/ventas")
    revalidatePath("/historial")
    revalidatePath("/caja")
    revalidatePath("/")
    
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
      // dateFilter is YYYY-MM-DD. 
      // We create boundaries ensuring we cover the full day regardless of exact server time.
      const start = new Date(`${dateFilter}T00:00:00Z`) // Force UTC to avoid local server offset
      const end = new Date(`${dateFilter}T23:59:59.999Z`)
      query = query.where("createdAt", ">=", start).where("createdAt", "<=", end)
    }

    const snap = await query.orderBy("createdAt", "desc").get()
    console.log("[AUDIT] getSalesHistory", { userId, dateFilter, count: snap.size });

    const sales = snap.docs.map(doc => serializeDoc({ id: doc.id, ...doc.data() }))

    return { success: true, data: sales }
  } catch (error: any) {
    console.error("Error fetching sales history [FULL ERROR]:", error);
    return { success: false, error: "No se pudo cargar el historial. Revisa los logs para errores de índices." }
  }
}

export async function getDashboardStats(dateFilter?: string) {
  try {
    const userId = await getUserId()
    if (!userId) {
      console.error("[AUDIT] getDashboardStats: No userId found");
      return { success: false, error: "No autorizado" }
    }

    let query = db.collection("salesHistory").where("userId", "==", userId)

    if (dateFilter) {
      const start = new Date(`${dateFilter}T00:00:00Z`)
      const end = new Date(`${dateFilter}T23:59:59.999Z`)
      query = query.where("createdAt", ">=", start).where("createdAt", "<=", end)
    } else {
      // Fallback to server's today if no filter provided
      const todayISO = new Date().toLocaleDateString('en-CA');
      const start = new Date(`${todayISO}T00:00:00Z`);
      const end = new Date(`${todayISO}T23:59:59.999Z`);
      query = query.where("createdAt", ">=", start).where("createdAt", "<=", end)
    }

    const snap = await query.get()
    
    // DEBUG: Get a sample of documents to see why they might not match
    const sample = snap.docs.length > 0 ? snap.docs[0].data() : "NO_DOCS_FOUND";
    
    console.log("[AUDIT] getDashboardStats Results:", { 
      userId, 
      dateFilter: dateFilter || "server-default", 
      found: snap.size,
      firstDocSample: sample
    });

    const todaySales = snap.docs.map(doc => doc.data())
    const todayTotal = todaySales.reduce((sum: number, s: any) => sum + (s.total || 0), 0)
    const todayCount = todaySales.length

    return { success: true, data: { todayTotal: Math.round(todayTotal * 100) / 100, todayCount } }
  } catch (error: any) {
    console.error("Error fetching dashboard stats [FULL ERROR]:", error)
    return { success: false, error: "Error al cargar estadísticas" }
  }
}
