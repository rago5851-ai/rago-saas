"use server"

import { db, auth } from "@/lib/firebase"
import { serializeDoc } from "@/lib/firestore-utils"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { getUserId } from "@/lib/auth-utils"

export async function getRawMaterials() {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    const snapshot = await db.collection("rawMaterials")
                             .where("userId", "==", userId)
                             .get()

    const materials = snapshot.docs
      .map(doc => serializeDoc({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name))

    return { success: true, data: materials }
  } catch (error: any) {
    console.error("Error fetching materials:", error?.message || error)
    return { success: false, error: "No se pudieron cargar los insumos" }
  }
}

export async function createRawMaterial(formData: FormData) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    const roundTo3 = (num: number) => Math.round(num * 1000) / 1000;

    const data = {
      name: formData.get("name") as string,
      stockKg: roundTo3(parseFloat(formData.get("stockKg") as string)),
      concentrationPercent: roundTo3(parseFloat(formData.get("concentrationPercent") as string)),
      densityKgL: roundTo3(parseFloat(formData.get("densityKgL") as string)),
      pricePerKg: roundTo3(parseFloat(formData.get("pricePerKg") as string)),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userId
    }

    if (!data.name || isNaN(data.stockKg) || isNaN(data.densityKgL) || isNaN(data.pricePerKg)) {
      return { success: false, error: "Por favor revisa que todos los campos numéricos sean válidos." }
    }

    const docRef = await db.collection("rawMaterials").add(data)

    revalidatePath("/inventory")
    revalidatePath("/")
    return { success: true, data: { id: docRef.id, ...data } }
  } catch (error) {
    console.error("Error creating material:", error)
    return { success: false, error: "Hubo un error al guardar el insumo" }
  }
}

export async function updateRawMaterialStock(id: string, newStock: number) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    // Check ownership before updating
    const doc = await db.collection("rawMaterials").doc(id).get()
    if (!doc.exists || doc.data()?.userId !== userId) {
      return { success: false, error: "No tienes permiso para actualizar este recurso" }
    }

    await db.collection("rawMaterials").doc(id).update({
      stockKg: newStock,
      updatedAt: new Date(),
    })
    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    return { success: false, error: "No se pudo actualizar el inventario" }
  }
}

export async function deleteRawMaterial(id: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    const doc = await db.collection("rawMaterials").doc(id).get()
    if (!doc.exists || doc.data()?.userId !== userId) {
      return { success: false, error: "No tienes permiso para eliminar este recurso" }
    }

    await db.collection("rawMaterials").doc(id).delete()
    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    return { success: false, error: "No se pudo eliminar el insumo." }
  }
}

export async function updateRawMaterialFromForm(formData: FormData) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    const id = formData.get("id") as string;
    const roundTo3 = (num: number) => Math.round(num * 1000) / 1000;

    const doc = await db.collection("rawMaterials").doc(id).get()
    if (!doc.exists || doc.data()?.userId !== userId) {
      return { success: false, error: "No tienes permiso para modificar este recurso" }
    }

    const data = {
      name: formData.get("name") as string,
      stockKg: roundTo3(parseFloat(formData.get("stockKg") as string)),
      concentrationPercent: roundTo3(parseFloat(formData.get("concentrationPercent") as string)),
      densityKgL: roundTo3(parseFloat(formData.get("densityKgL") as string)),
      pricePerKg: roundTo3(parseFloat(formData.get("pricePerKg") as string)),
      updatedAt: new Date(),
    }

    if (!id || !data.name || isNaN(data.stockKg) || isNaN(data.densityKgL) || isNaN(data.pricePerKg)) {
      return { success: false, error: "Revisa los campos numéricos y el ID." }
    }

    await db.collection("rawMaterials").doc(id).update(data)

    revalidatePath("/inventory")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Hubo un error al actualizar." }
  }
}
