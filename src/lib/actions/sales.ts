"use server"

import { db, auth } from "@/lib/firebase"
import { cookies } from "next/headers"
import { serializeDoc, sanitizeResponse } from "@/lib/firestore-utils"
import { revalidatePath } from "next/cache"
import { getUserId } from "@/lib/auth-utils"
import { getMeridaDayRange, getMeridaTodayStr } from "@/lib/date-utils"

export async function getProductInventory() {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    const snapshot = await db.collection("productInventory")
      .where("userId", "==", userId)
      .get()

    const items = snapshot.docs
      .map((doc) => serializeDoc({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
      .sort((a: any, b: any) => (a.name ?? "").localeCompare(b.name ?? ""))

    return sanitizeResponse({ success: true, data: items })
  } catch (error: any) {
    console.error("Error fetching product inventory:", error?.message || error)
    return { success: false, error: "No se pudo cargar el catálogo" }
  }
}

export type CartItem = { productId: string; name: string; quantity: number; pricePerLiter: number }
export type PaymentMethod = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA"

export type LoyaltyConfig = {
  pointsPerSaleAmount: number // e.g. 100 pesos
  pointValue: number // e.g. 1 peso
}

const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  pointsPerSaleAmount: 100,
  pointValue: 1
}

export async function getLoyaltyConfig() {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    const docRef = db.collection("configuracion").doc(`${userId}_lealtad`)
    const doc = await docRef.get()
    
    if (!doc.exists) {
      console.log("[LOYALTY] No config found, using defaults for user:", userId)
      return sanitizeResponse({ success: true, data: DEFAULT_LOYALTY_CONFIG })
    }

    const data = doc.data() as Record<string, unknown>
    console.log("[LOYALTY] Config loaded:", data)
    return sanitizeResponse({
      success: true,
      data: {
        pointsPerSaleAmount: (data?.pointsPerSaleAmount as number) ?? DEFAULT_LOYALTY_CONFIG.pointsPerSaleAmount,
        pointValue: (data?.pointValue as number) ?? DEFAULT_LOYALTY_CONFIG.pointValue,
      },
    })
  } catch (error) {
    console.error("[LOYALTY] Load error:", error)
    return { success: false, error: "Error al cargar configuración" }
  }
}

export async function updateLoyaltyConfig(config: LoyaltyConfig) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    const dataToSave = {
      pointsPerSaleAmount: Number(config.pointsPerSaleAmount),
      pointValue: Number(config.pointValue),
      userId,
      tipo: "ajustes_lealtad",
      updatedAt: new Date()
    }

    console.log("[LOYALTY] Saving config with merge:true to 'configuracion/${userId}_lealtad':", dataToSave)
    
    await db.collection("configuracion").doc(`${userId}_lealtad`).set(dataToSave, { merge: true })
    
    revalidatePath("/ventas")
    revalidatePath("/clientes")
    
    return { success: true }
  } catch (error) {
    console.error("[LOYALTY] Save error:", error)
    return { success: false, error: "Error al guardar configuración" }
  }
}

export async function processCheckout(
  cart: CartItem[], 
  paymentMethod: PaymentMethod = "EFECTIVO", 
  amountPaid: number = 0,
  clientId?: string,
  redeemPoints: boolean = false
) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }
    if (!cart || cart.length === 0) return { success: false, error: "El carrito está vacío" }

    const totalOriginal = cart.reduce((s, i) => s + i.quantity * i.pricePerLiter, 0)
    let total = totalOriginal
    let pointsToRedeem = 0
    let pointsEarned = 0

    const configDoc = await getLoyaltyConfig()
    const config = configDoc.success ? configDoc.data as LoyaltyConfig : DEFAULT_LOYALTY_CONFIG

    await db.runTransaction(async (transaction: any) => {
      // 1. Validar Stock
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

      // 2. Manejar Puntos si hay cliente
      let clientRef = null
      let clientData = null
      if (clientId) {
        clientRef = db.collection("customers").doc(clientId)
        const clientSnap = await transaction.get(clientRef)
        if (clientSnap.exists) {
          clientData = clientSnap.data()
          
          if (redeemPoints) {
            pointsToRedeem = clientData.points || 0
            const discount = pointsToRedeem * config.pointValue
            total = Math.max(0, total - discount)
            transaction.update(clientRef, { points: 0, updatedAt: new Date() })
          }
        }
      }

      // 3. Aplicar Stock
      for (const { ref, newStock } of updates) {
        transaction.update(ref, { stockLiters: newStock, updatedAt: new Date() })
      }

      // 4. Calcular Puntos Ganados (sobre el total final descontado)
      pointsEarned = Math.floor(total / config.pointsPerSaleAmount)
      if (clientRef && clientData) {
        const currentPoints = redeemPoints ? 0 : (clientData.points || 0)
        transaction.update(clientRef, { 
          points: currentPoints + pointsEarned, 
          updatedAt: new Date() 
        })
      }

      // 5. Registrar Venta
      const saleRef = db.collection("salesHistory").doc()
      transaction.set(saleRef, {
        userId: userId,
        customerId: clientId || null,
        items: cart,
        totalOriginal: Math.round(totalOriginal * 100) / 100,
        total: Math.round(total * 100) / 100,
        pointsRedeemed: pointsToRedeem,
        pointsEarned: pointsEarned,
        paymentMethod,
        amountPaid: Math.round(amountPaid * 100) / 100,
        change: paymentMethod === "EFECTIVO" ? Math.round((amountPaid - total) * 100) / 100 : 0,
        createdAt: new Date(),
      })
    })

    console.log("[AUDIT] processCheckout SUCCESS", { userId });

    revalidatePath("/ventas")
    revalidatePath("/historial")
    revalidatePath("/caja")
    revalidatePath("/")
    
    const discountAmount = Math.round(pointsToRedeem * config.pointValue * 100) / 100
    return { 
      success: true, 
      total: Math.round(total * 100) / 100,
      totalOriginal: Math.round(totalOriginal * 100) / 100,
      pointsRedeemed: pointsToRedeem,
      discountAmount,
      pointsEarned,
      pointValue: config.pointValue,
    }
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
      const { start, end } = getMeridaDayRange(dateFilter)
      query = query.where("createdAt", ">=", start).where("createdAt", "<=", end)
    }

    const snap = await query.orderBy("createdAt", "desc").get()
    console.log("[AUDIT] getSalesHistory", { userId, dateFilter, count: snap.size });

    const sales = snap.docs.map((doc) =>
      serializeDoc({ id: doc.id, ...(doc.data() as Record<string, unknown>) })
    )

    return sanitizeResponse({ success: true, data: sales })
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

    const query = db.collection("salesHistory").where("userId", "==", userId)
    const snap = await query.get()
    
    // JS Filtering using Merida Timezone
    const { start, end, dateStr } = getMeridaDayRange(dateFilter)
    
    const todaySales = snap.docs.filter(doc => {
      const data = doc.data();
      if (!data.createdAt) return false;
      const createdAt = data.createdAt.toDate();
      return createdAt >= start && createdAt <= end;
    }).map(doc => doc.data());

    console.log("[AUDIT] getDashboardStats JS results", { 
      userId, 
      dateFilter: dateStr, 
      totalUserDocs: snap.size,
      foundToday: todaySales.length
    });
    const todayTotal = todaySales.reduce((sum: number, s: any) => sum + (s.total || 0), 0)
    const todayCount = todaySales.length

    return sanitizeResponse({
      success: true,
      data: { todayTotal: Math.round(todayTotal * 100) / 100, todayCount },
    })
  } catch (error: any) {
    console.error("Error fetching dashboard stats [FULL ERROR]:", error)
    return { success: false, error: "Error al cargar estadísticas" }
  }
}
// Force re-deploy: Verified local build success
