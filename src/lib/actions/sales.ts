"use server"

import { db } from "@/lib/firebase"
import { cookies } from "next/headers"
import { serializeDoc } from "@/lib/firestore-utils"

export async function getFinishedInventory() {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_token')
    if (!authCookie?.value) return { success: false, error: "No autorizado" }

    const snapshot = await db.collection("finishedInventory")
      .where("userId", "==", authCookie.value)
      .get()

    const items = snapshot.docs
      .map(doc => serializeDoc({ id: doc.id, ...doc.data() }))
      // Sort by date desc in memory
      .sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""))

    return { success: true, data: items }
  } catch (error: any) {
    console.error("Error fetching finished inventory:", error?.message || error)
    return { success: false, error: "No se pudo cargar el inventario de ventas" }
  }
}
