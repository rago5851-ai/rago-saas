"use server"

import { db } from "@/lib/firebase"
import { serializeDoc } from "@/lib/firestore-utils"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function getFormulas() {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_token')
    if (!authCookie?.value) return { success: false, error: "No autorizado" }

    // 1. Obtener formulas del usuario (sin orderBy para evitar índice compuesto)
    const formulasSnapshot = await db.collection("formulas")
      .where("userId", "==", authCookie.value)
      .get()

    // 2. Obtener insumos para popularlos manualmente (Firestore no tiene 'include')
    const rawMaterialsSnapshot = await db.collection("rawMaterials")
      .where("userId", "==", authCookie.value)
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

export type NewFormulaIngredient = {
  rawMaterialId: string
  quantityKg: number
}

export async function createFormula(
  name: string,
  instructions: string,
  ingredients: NewFormulaIngredient[]
) {
  try {
    if (!name || ingredients.length === 0) {
      return { success: false, error: "La fórmula debe tener un nombre y al menos un ingrediente." }
    }

    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_token')
    if (!authCookie?.value) return { success: false, error: "No autorizado" }

    const formulaData = {
      userId: authCookie.value,
      name,
      instructions,
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
    return { success: true, data: { id: docRef.id, ...formulaData } }
  } catch (error) {
    console.error("Error creating formula:", error)
    return { success: false, error: "Hubo un error al guardar la fórmula" }
  }
}
