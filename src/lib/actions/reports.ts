"use server"

import { db, auth } from "@/lib/firebase"
import { getUserId } from "@/lib/auth-utils"
import { getMeridaDayRange } from "@/lib/date-utils"
import { serializeDoc } from "@/lib/firestore-utils"
import { revalidatePath } from "next/cache"
import { subDays, startOfMonth, format, isWithinInterval, parseISO } from "date-fns"
import { toZonedTime } from "date-fns-tz"

const TIMEZONE = "America/Merida"

export async function getSalesReport(range: string, customStart?: string, customEnd?: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    let startDate: Date
    let endDate = new Date()

    if (range === "hoy") {
      const { start } = getMeridaDayRange("today")
      startDate = start
    } else if (range === "7d") {
      startDate = subDays(new Date(), 7)
    } else if (range === "mes") {
      startDate = startOfMonth(new Date())
    } else if (range === "custom" && customStart && customEnd) {
      startDate = parseISO(customStart)
      endDate = parseISO(customEnd)
    } else {
      startDate = subDays(new Date(), 7)
    }

    // Fetch sales for the user
    const snapshot = await db.collection("sales")
      .where("userId", "==", userId)
      .get()

    let sales = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as any[]

    // Filter by date range in JS to avoid complex indices for now
    sales = sales.filter(s => s.createdAt >= startDate && s.createdAt <= endDate)

    // Aggregate by day
    const dailyData: Record<string, number> = {}
    sales.forEach(s => {
      const day = format(toZonedTime(s.createdAt, TIMEZONE), "yyyy-MM-dd")
      dailyData[day] = (dailyData[day] || 0) + (Number(s.total) || 0)
    })

    const chartData = Object.entries(dailyData)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return { success: true, data: chartData }
  } catch (error) {
    console.error("Error in getSalesReport:", error)
    return { success: false, error: "Error al generar reporte" }
  }
}

export async function getTopProducts(range: string, customStart?: string, customEnd?: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    let startDate: Date
    let endDate = new Date()

    if (range === "hoy") {
      const { start } = getMeridaDayRange("today")
      startDate = start
    } else if (range === "7d") {
      startDate = subDays(new Date(), 7)
    } else if (range === "mes") {
      startDate = startOfMonth(new Date())
    } else if (range === "custom" && customStart && customEnd) {
      startDate = parseISO(customStart)
      endDate = parseISO(customEnd)
    } else {
      startDate = subDays(new Date(), 7)
    }

    const snapshot = await db.collection("sales")
      .where("userId", "==", userId)
      .get()

    let sales = snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }))

    sales = sales.filter(s => s.createdAt >= startDate && s.createdAt <= endDate)

    const productCounts: Record<string, number> = {}
    sales.forEach((s: any) => {
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach((item: any) => {
          const name = item.name || "Producto desconocido"
          productCounts[name] = (productCounts[name] || 0) + (Number(item.quantity) || 1)
        })
      }
    })

    const topProducts = Object.entries(productCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return { success: true, data: topProducts }
  } catch (error) {
    console.error("Error in getTopProducts:", error)
    return { success: false, error: "Error al generar ranking" }
  }
}

export async function getCashCutsHistory() {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    // Obtenemos los cortes del usuario
    const snapshot = await db.collection("cashCuts")
      .where("userId", "==", userId)
      .get()

    // Obtenemos el nombre del usuario (admin) para el reporte
    const userDoc = await db.collection("users").doc(userId).get()
    const userName = userDoc.data()?.email?.split("@")[0] || "Admin"

    const cuts = snapshot.docs.map(doc => {
      const data = doc.data()
      return serializeDoc({
        id: doc.id,
        ...data,
        userName, // Por ahora asumimos que el que lo ve es el que lo hizo o el dueño
        createdAt: data.createdAt?.toDate() || new Date()
      })
    }).sort((a: any, b: any) => b.createdAt - a.createdAt)

    return { success: true, data: cuts }
  } catch (error) {
    console.error("Error fetching cash cuts:", error)
    return { success: false, error: "No se pudieron cargar los cortes" }
  }
}

export async function maintenanceCleanup() {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    const thirtyDaysAgo = subDays(new Date(), 30)

    const snapshot = await db.collection("cashCuts")
      .where("userId", "==", userId)
      .where("createdAt", "<", thirtyDaysAgo)
      .get()

    if (snapshot.empty) return { success: true, deletedCount: 0 }

    const batch = db.batch()
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })

    await batch.commit()
    console.log(`[CLEANUP] Deleted ${snapshot.size} old cash cuts records.`)
    
    return { success: true, deletedCount: snapshot.size }
  } catch (error) {
    console.error("Cleanup error:", error)
    return { success: false, error: "Error en mantenimiento" }
  }
}
