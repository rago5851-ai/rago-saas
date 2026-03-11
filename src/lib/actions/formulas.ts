"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getFormulas() {
  try {
    const formulas = await prisma.formula.findMany({
      include: {
        FormulaIngredients: {
          include: {
            rawMaterial: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    })
    return { success: true, data: formulas }
  } catch (error) {
    console.error("Error fetching formulas:", error)
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

    const newFormula = await prisma.formula.create({
      data: {
        name,
        instructions,
        FormulaIngredients: {
          create: ingredients.map(ing => ({
            rawMaterialId: ing.rawMaterialId,
            quantityKg: ing.quantityKg
          }))
        }
      }
    })

    revalidatePath("/formulas")
    return { success: true, data: newFormula }
  } catch (error) {
    console.error("Error creating formula:", error)
    return { success: false, error: "Hubo un error al guardar la fórmula" }
  }
}
