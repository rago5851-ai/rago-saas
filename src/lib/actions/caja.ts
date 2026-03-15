"use server"

import { db } from "@/lib/firebase"
import { serializeDoc } from "@/lib/firestore-utils"
import { revalidatePath } from "next/cache"
import { getUserId } from "@/lib/auth-utils"
import { getMeridaDayRange } from "@/lib/date-utils"

export async function getCashRegisterState(dateFilter?: string) {
  try {
    const userId = await getUserId()
    if (!userId) {
      console.error("[AUDIT] getCashRegisterState: No userId found");
      return { success: false, error: "No autorizado" }
    }
    if (!db) return { success: false, error: "Servicio no disponible" }

    // 1. Encontrar el corte de caja más reciente (Sin orderBy para evitar índice)
    const cutsSnap = await db.collection("cashCuts")
      .where("userId", "==", userId)
      .get()
    
    // Ordenar en memoria
    const sortedCuts = cutsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (b.createdAt?.toDate().getTime() || 0) - (a.createdAt?.toDate().getTime() || 0))

    let sessionStart: Date | null = null
    let retainedCash = 0
    if (sortedCuts.length > 0) {
      const lastCut: any = sortedCuts[0]
      sessionStart = lastCut.createdAt?.toDate() || null
      retainedCash = lastCut.cashRetained || 0
      if (process.env.NODE_ENV !== "production") {
        console.log("[AUDIT] getCashRegisterState: Found last cut", { sessionStart, retainedCash });
      }
    }

    // 2. Traer TODAS las ventas del usuario y filtrar en JS
    const salesQuery = db.collection("salesHistory").where("userId", "==", userId)
    const salesSnap = await salesQuery.get()
    
    // JS Filtering using Merida Timezone
    const { start, end, dateStr } = getMeridaDayRange(dateFilter)

    // Lógica de Sincronización: 
    // Si no hay corte hoy, empezamos desde las 00:00:00 de hoy Merida.
    // Si hay un corte hoy, empezamos desde ese corte.
    let effectiveStart = start;
    if (sessionStart && sessionStart > start) {
      effectiveStart = sessionStart;
      if (process.env.NODE_ENV !== "production") {
        console.log("[AUDIT] Caja: Usando corte reciente como inicio", { sessionStart });
      }
    } else {
      if (process.env.NODE_ENV !== "production") {
        console.log("[AUDIT] Caja: Usando inicio de día (Hoy) como inicio", { start });
      }
    }

    const filteredDocs = salesSnap.docs.filter(doc => {
      const data = doc.data()
      if (!data.createdAt) return false
      const createdAt = data.createdAt.toDate()
      return createdAt >= effectiveStart && createdAt <= end
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[AUDIT] getCashRegisterState JS results", {
        userId,
        totalUserDocs: salesSnap.size,
        foundFiltered: filteredDocs.length,
        range: { start: effectiveStart, end },
        dateStr,
      });
    }

    let efectivo = retainedCash
    let tarjeta = 0
    let transferencia = 0

    filteredDocs.forEach(doc => {
      const data = doc.data()
      const amount = Number(data.total) || 0
      const method = (data.paymentMethod || "").toString().toUpperCase().trim()
      
      console.log("[AUDIT] Caja Doc Item:", { id: doc.id, method, amount });
      
      if (method === "EFECTIVO") efectivo += amount
      else if (method === "TARJETA") tarjeta += amount
      else if (method === "TRANSFERENCIA") transferencia += amount
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
  withdrawAmount: number
) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }
    if (!db) return { success: false, error: "Servicio no disponible" }

    const difference = manualCount - expectedEfectivo
    // Lo que queda en caja es lo contado menos lo retirado
    const cashRetained = manualCount - withdrawAmount

    await db.collection("cashCuts").add({
      userId: userId,
      expectedEfectivo: Math.round(expectedEfectivo * 100) / 100,
      manualCount: Math.round(manualCount * 100) / 100,
      withdrawAmount: Math.round(withdrawAmount * 100) / 100,
      difference: Math.round(difference * 100) / 100,
      cashRetained: Math.round(cashRetained * 100) / 100,
      createdAt: new Date(),
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[AUDIT] processCashCut SUCCESS", {
        userId,
        expectedEfectivo,
        manualCount,
        withdrawAmount,
        cashRetained,
      });
    }

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
