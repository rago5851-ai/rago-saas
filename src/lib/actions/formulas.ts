"use server"

import { db, auth } from "@/lib/firebase"
import { serializeDoc } from "@/lib/firestore-utils"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { getUserId } from "@/lib/auth-utils"

export async function getFormulas() {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }
    if (!db) return { success: false, error: "Servicio no disponible" }

    // 1. Obtener formulas del usuario (sin orderBy para evitar índice compuesto)
    const formulasSnapshot = await db.collection("formulas")
      .where("userId", "==", userId)
      .get()

    // 2. Obtener insumos para popularlos manualmente (Firestore no tiene 'include')
    const rawMaterialsSnapshot = await db.collection("rawMaterials")
      .where("userId", "==", userId)
      .get()
      
    const rawMaterialsMap = new Map()
    rawMaterialsSnapshot.docs.forEach(doc => {
      rawMaterialsMap.set(doc.id, serializeDoc({ id: doc.id, ...doc.data() }))
    })

    const formulas = formulasSnapshot.docs
      .map(doc => {
        const rawData = doc.data()
        const serialized = serializeDoc({ id: doc.id, ...rawData })
        return {
          ...serialized,
          FormulaIngredients: (rawData.ingredients || []).map((ing: any) => ({
            rawMaterialId: ing.rawMaterialId,
            quantityKg: ing.quantityKg,
            rawMaterial: rawMaterialsMap.get(ing.rawMaterialId) || null
          }))
        }
      })
      // Sort in-memory by updatedAt ISO string (desc)
      .sort((a: any, b: any) => {
        const aStr = a.updatedAt || ""
        const bStr = b.updatedAt || ""
        return bStr.localeCompare(aStr)
      })

    return { success: true, data: formulas }
  } catch (error: any) {
    console.error("Error fetching formulas:", error?.message || error)
    return { success: false, error: "No se pudieron cargar las fórmulas" }
  }
}

export type FormulaProductType = "TERMINADO" | "SEMIELABORADO"

export type NewFormulaIngredient = {
  rawMaterialId: string
  quantityKg: number
}

export async function createFormula(
  name: string,
  instructions: string,
  ingredients: NewFormulaIngredient[],
  productType: FormulaProductType = "TERMINADO"
) {
  try {
    if (!name || ingredients.length === 0) {
      return { success: false, error: "La fórmula debe tener un nombre y al menos un ingrediente." }
    }

    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }
    if (!db) return { success: false, error: "Servicio no disponible" }

    const formulaData = {
      userId: userId,
      name,
      instructions,
      type: productType,
      ingredients: ingredients.map(ing => ({
        rawMaterialId: ing.rawMaterialId,
        quantityKg: ing.quantityKg
      })),
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const docRef = await db.collection("formulas").add(formulaData)

    revalidatePath("/formulas")
    revalidatePath("/")
    return {
      success: true,
      data: {
        id: docRef.id,
        ...formulaData,
        createdAt: formulaData.createdAt.toISOString(),
        updatedAt: formulaData.updatedAt.toISOString(),
      },
    }
  } catch (error) {
    console.error("Error creating formula:", error)
    return { success: false, error: "Hubo un error al guardar la fórmula" }
  }
}

export async function deleteFormula(formulaId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }
    if (!db) return { success: false, error: "Servicio no disponible" }

    const docRef = db.collection("formulas").doc(formulaId)
    const doc = await docRef.get()

    if (!doc.exists) return { success: false, error: "Fórmula no encontrada" }
    if (doc.data()?.userId !== userId) return { success: false, error: "No tienes permiso para borrar esta fórmula" }

    await docRef.delete()

    revalidatePath("/formulas")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting formula:", error)
    return { success: false, error: "Error al eliminar la fórmula" }
  }
}

export async function updateFormula(
  formulaId: string,
  name: string,
  instructions: string,
  ingredients: NewFormulaIngredient[],
  productType: FormulaProductType = "TERMINADO"
) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }
    if (!db) return { success: false, error: "Servicio no disponible" }

    const docRef = db.collection("formulas").doc(formulaId)
    const doc = await docRef.get()

    if (!doc.exists) return { success: false, error: "Fórmula no encontrada" }
    if (doc.data()?.userId !== userId) return { success: false, error: "No tienes permiso para editar esta fórmula" }

    const formulaData = {
      name,
      instructions,
      type: productType,
      ingredients: ingredients.map(ing => ({
        rawMaterialId: ing.rawMaterialId,
        quantityKg: ing.quantityKg
      })),
      updatedAt: new Date(),
    }

    await docRef.update(formulaData)

    revalidatePath("/formulas")
    revalidatePath(`/formulas/${formulaId}`)
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating formula:", error)
    return { success: false, error: "Error al actualizar la fórmula" }
  }
}

export async function getFormulaById(formulaId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }
    if (!db) return { success: false, error: "Servicio no disponible" }

    const docRef = db.collection("formulas").doc(formulaId)
    const doc = await docRef.get()

    if (!doc.exists) return { success: false, error: "Fórmula no encontrada" }
    const data = doc.data()
    if (data?.userId !== userId) return { success: false, error: "No tienes permiso" }

    return { success: true, data: serializeDoc({ id: doc.id, ...data }) }
  } catch (error: any) {
    console.error("Error fetching formula by id:", error)
    return { success: false, error: "Error al cargar la fórmula" }
  }
}
