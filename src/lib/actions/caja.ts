"use server"

import { db, auth } from "@/lib/firebase"
import { cookies } from "next/headers"
import { serializeDoc } from "@/lib/firestore-utils"
import { revalidatePath } from "next/cache"
import { getUserId } from "@/lib/auth-utils"

export async function getCashRegisterState() {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    // 1. Encontrar el corte de caja más reciente
    const cutsSnap = await db.collection("cashCuts")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get()
    
    console.log("[AUDIT] getCashRegisterState lastCut query", { userId, empty: cutsSnap.empty });

    let sessionStart: Date | null = null
    let retainedCash = 0
    if (!cutsSnap.empty) {
      const lastCut = cutsSnap.docs[0].data()
      sessionStart = lastCut.createdAt?.toDate() || null
      retainedCash = lastCut.cashRetained || 0
    }

    // 2. Traer ventas filtradas desde el servidor (User + Fecha)
    let salesQuery = db.collection("salesHistory").where("userId", "==", userId)
    
    if (sessionStart) {
      salesQuery = salesQuery.where("createdAt", ">", sessionStart)
    }

    const salesSnap = await salesQuery.get()
    console.log("[AUDIT] getCashRegisterState sales query", { userId, sessionStart, count: salesSnap.size });

    let efectivo = retainedCash
    let tarjeta = 0
    let transferencia = 0

    salesSnap.docs.forEach(doc => {
      const data = doc.data()
      const amount = data.total || 0
      if (data.paymentMethod === "EFECTIVO") efectivo += amount
      else if (data.paymentMethod === "TARJETA") tarjeta += amount
      else if (data.paymentMethod === "TRANSFERENCIA") transferencia += amount
    })

    const total = efectivo + tarjeta + transferencia

    return {
      success: true,
      data: {
        efectivo: Math.round(efectivo * 100) / 100,
        tarjeta: Math.round(tarjeta * 100) / 100,
        transferencia: Math.round(transferencia * 100) / 100,
        total: Math.round(total * 100) / 100,
        retainedCash: Math.round(retainedCash * 100) / 100,
      }
    }
  } catch (error: any) {
    console.error("Error fetching cash register [FULL ERROR]:", error);
    return { success: false, error: "No se pudo cargar la caja. Posible error de índice." }
  }
}

export async function processCashCut(
  expectedEfectivo: number,
  manualCount: number,
  withdraw: boolean
) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    const difference = manualCount - expectedEfectivo
    const cashRetained = withdraw ? 0 : manualCount

    await db.collection("cashCuts").add({
      userId: userId,
      expectedEfectivo: Math.round(expectedEfectivo * 100) / 100,
      manualCount: Math.round(manualCount * 100) / 100,
      difference: Math.round(difference * 100) / 100,
      withdrawn: withdraw,
      cashRetained: Math.round(cashRetained * 100) / 100,
      createdAt: new Date(),
    })

    console.log("[AUDIT] processCashCut SUCCESS", { userId, expectedEfectivo, manualCount, withdraw });

    revalidatePath("/caja")
    revalidatePath("/")
    revalidatePath("/ventas")
    revalidatePath("/historial")
    
    return { success: true, difference: Math.round(difference * 100) / 100, cashRetained: Math.round(cashRetained * 100) / 100 }
  } catch (error: any) {
    console.error("Cash cut error:", error?.message || error)
    return { success: false, error: error.message || "Error al hacer el corte de caja" }
  }
}
