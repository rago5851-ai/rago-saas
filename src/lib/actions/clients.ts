"use server"

import { db } from "@/lib/firebase"
import { getUserId } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { serializeDoc, sanitizeResponse } from "@/lib/firestore-utils"

export async function getClients(search: string = "") {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }
    if (!db) return { success: false, error: "Servicio no disponible" }

    let query = db.collection("customers").where("userId", "==", userId)
    
    const snapshot = await query.get()
    let clients = snapshot.docs.map((doc) =>
      serializeDoc({ id: doc.id, ...(doc.data() as Record<string, unknown>) })
    )

    if (search) {
      const s = search.toLowerCase()
      clients = clients.filter(
        (c: Record<string, unknown>) =>
          String(c?.name ?? "").toLowerCase().includes(s) ||
          String(c?.phone ?? "").toLowerCase().includes(s)
      )
    }

    return sanitizeResponse({ success: true, data: clients })
  } catch (error: any) {
    console.error("Error fetching clients:", error)
    return { success: false, error: "No se pudieron cargar los clientes" }
  }
}

export async function createClient(name: string, phone: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }
    if (!db) return { success: false, error: "Servicio no disponible" }

    const newClient = {
      userId,
      name,
      phone,
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const docRef = await db.collection("customers").add(newClient)
    
    revalidatePath("/clientes")
    return sanitizeResponse({
      success: true,
      data: {
        id: docRef.id,
        ...newClient,
        createdAt: newClient.createdAt.toISOString(),
        updatedAt: newClient.updatedAt.toISOString(),
      },
    })
  } catch (error: any) {
    console.error("Error creating client:", error)
    return { success: false, error: "No se pudo registrar el cliente" }
  }
}

export async function getClientByPhone(phone: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }
    if (!db) return { success: false, error: "Servicio no disponible" }

    const snapshot = await db.collection("customers")
      .where("userId", "==", userId)
      .where("phone", "==", phone)
      .limit(1)
      .get()

    if (snapshot.empty) return { success: true, data: null }

    const doc = snapshot.docs[0]
    return sanitizeResponse({
      success: true,
      data: serializeDoc({ id: doc.id, ...(doc.data() as Record<string, unknown>) }),
    })
  } catch (error: any) {
    console.error("Error fetching client by phone:", error)
    return { success: false, error: "Error al buscar cliente" }
  }
}
