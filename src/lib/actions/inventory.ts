"use server"

import { db } from "@/lib/firebase"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function getRawMaterials() {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_token')
    if (!authCookie?.value) return { success: false, error: "No autorizado" }

    const snapshot = await db.collection("rawMaterials")
                             .where("userId", "==", authCookie.value)
                             .get()

    // Sort in memory to avoid needing a Firestore composite index
    const materials = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name))

    return { success: true, data: materials }
  } catch (error) {
    console.error("Error fetching materials:", error)
    return { success: false, error: "No se pudieron cargar los insumos" }
  }
}

export async function createRawMaterial(formData: FormData) {
  try {
    const roundTo3 = (num: number) => Math.round(num * 1000) / 1000;

    const data = {
      name: formData.get("name") as string,
      stockKg: roundTo3(parseFloat(formData.get("stockKg") as string)),
      concentrationPercent: roundTo3(parseFloat(formData.get("concentrationPercent") as string)),
      densityKgL: roundTo3(parseFloat(formData.get("densityKgL") as string)),
      pricePerKg: roundTo3(parseFloat(formData.get("pricePerKg") as string)),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    if (!data.name || isNaN(data.stockKg) || isNaN(data.densityKgL) || isNaN(data.pricePerKg)) {
      return { success: false, error: "Por favor revisa que todos los campos numéricos sean válidos." }
    }

    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_token')
    if (!authCookie?.value) return { success: false, error: "No autorizado" }

    const docRef = await db.collection("rawMaterials").add({
      ...data,
      userId: authCookie.value
    })

    revalidatePath("/inventory")
    return { success: true, data: { id: docRef.id, ...data, userId: authCookie.value } }
  } catch (error) {
    console.error("Error creating material:", error)
    return { success: false, error: "Hubo un error al guardar el insumo" }
  }
}

export async function updateRawMaterialStock(id: string, newStock: number) {
  try {
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
    await db.collection("rawMaterials").doc(id).delete()
    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    return { success: false, error: "No se pudo eliminar el insumo." }
  }
}

export async function updateRawMaterialFromForm(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const roundTo3 = (num: number) => Math.round(num * 1000) / 1000;

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
    return { success: true }
  } catch (error) {
    return { success: false, error: "Hubo un error al actualizar." }
  }
}
