"use server"

import { db } from "@/lib/firebase"
import { cookies } from "next/headers"
import { serializeDoc } from "@/lib/firestore-utils"
import { revalidatePath } from "next/cache"

/** Returns totals by payment method since the last cashCut (or all time if no cut exists) */
export async function getCashRegisterState() {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_token')
    if (!authCookie?.value) return { success: false, error: "No autorizado" }

    // Find the most recent cash cut to know our session start
    const cutsSnap = await db.collection("cashCuts")
      .where("userId", "==", authCookie.value)
      .get()

    let sessionStartISO = ""
    let retainedCash = 0
    if (!cutsSnap.empty) {
      const cuts = cutsSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0))
      const lastCut: any = cuts[0]
      sessionStartISO = lastCut.createdAt?.toDate?.()?.toISOString() || ""
      retainedCash = lastCut.cashRetained || 0
    }

    // Fetch sales since last cut
    const salesSnap = await db.collection("salesHistory")
      .where("userId", "==", authCookie.value)
      .get()

    let efectivo = retainedCash
    let tarjeta = 0
    let transferencia = 0

    salesSnap.docs.forEach(doc => {
      const data = doc.data()
      const createdAt = data.createdAt?.toDate?.()?.toISOString() || ""
      if (sessionStartISO && createdAt <= sessionStartISO) return
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
    console.error("Error fetching cash register:", error?.message || error)
    return { success: false, error: "No se pudo cargar la caja" }
  }
}

export async function processCashCut(
  expectedEfectivo: number,
  manualCount: number,
  withdraw: boolean
) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_token')
    if (!authCookie?.value) return { success: false, error: "No autorizado" }

    const difference = manualCount - expectedEfectivo
    const cashRetained = withdraw ? 0 : manualCount

    await db.collection("cashCuts").add({
      userId: authCookie.value,
      expectedEfectivo: Math.round(expectedEfectivo * 100) / 100,
      manualCount: Math.round(manualCount * 100) / 100,
      difference: Math.round(difference * 100) / 100,
      withdrawn: withdraw,
      cashRetained: Math.round(cashRetained * 100) / 100,
      createdAt: new Date(),
    })

    revalidatePath("/caja")
    return { success: true, difference: Math.round(difference * 100) / 100, cashRetained: Math.round(cashRetained * 100) / 100 }
  } catch (error: any) {
    console.error("Cash cut error:", error?.message || error)
    return { success: false, error: error.message || "Error al hacer el corte de caja" }
  }
}
