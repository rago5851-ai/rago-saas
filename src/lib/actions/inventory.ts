"use server"

import { db } from "@/lib/firebase"
import { serializeDoc } from "@/lib/firestore-utils"
import { revalidatePath } from "next/cache"
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
    return {
      success: true,
      data: {
        id: docRef.id,
        ...data,
        createdAt: data.createdAt.toISOString(),
        updatedAt: data.updatedAt.toISOString(),
      },
    }
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

export async function addRawMaterialStock(rawMaterialId: string, quantityToAdd: number) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    const docRef = db.collection("rawMaterials").doc(rawMaterialId)
    const doc = await docRef.get()
    if (!doc.exists || (doc.data() as any)?.userId !== userId) {
      return { success: false, error: "No tienes permiso para surtir este insumo" }
    }

    const data = doc.data() as any
    const currentStock = Number(data?.stockKg) ?? 0
    const pricePerKg = Number(data?.pricePerKg) ?? 0
    const rawMaterialName = String(data?.name ?? "")
    const qty = Math.round(Number(quantityToAdd) * 1000) / 1000
    if (qty <= 0) return { success: false, error: "La cantidad debe ser mayor a 0" }

    const newStockKg = Math.round((currentStock + qty) * 1000) / 1000
    const totalCost = Math.round(qty * pricePerKg * 100) / 100

    await docRef.update({ stockKg: newStockKg, updatedAt: new Date() })

    await db.collection("materiaPrimaMovements").add({
      userId,
      rawMaterialId,
      rawMaterialName,
      quantityKg: qty,
      unitPrice: pricePerKg,
      totalCost,
      createdAt: new Date(),
    })

    revalidatePath("/inventory")
    revalidatePath("/reportes/utilidades")
    return { success: true }
  } catch (error: any) {
    console.error("Error addRawMaterialStock:", error?.message || error)
    return { success: false, error: "No se pudo agregar stock al insumo" }
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
