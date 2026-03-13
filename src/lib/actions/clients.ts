"use server"

import { db } from "@/lib/firebase"
import { getUserId } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { serializeDoc } from "@/lib/firestore-utils"

export async function getClients(search: string = "") {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    let query = db.collection("customers").where("userId", "==", userId)
    
    const snapshot = await query.get()
    let clients = snapshot.docs.map(doc => serializeDoc({ id: doc.id, ...doc.data() }))

    if (search) {
      const s = search.toLowerCase()
      clients = clients.filter((c: any) => 
        c.name?.toLowerCase().includes(s) || 
        c.phone?.toLowerCase().includes(s)
      )
    }

    return { success: true, data: clients }
  } catch (error: any) {
    console.error("Error fetching clients:", error)
    return { success: false, error: "No se pudieron cargar los clientes" }
  }
}

export async function createClient(name: string, phone: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

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
    return { success: true, data: { id: docRef.id, ...newClient } }
  } catch (error: any) {
    console.error("Error creating client:", error)
    return { success: false, error: "No se pudo registrar el cliente" }
  }
}
