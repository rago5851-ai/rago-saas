"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getWorkOrders() {
  try {
    const orders = await prisma.workOrder.findMany({
      include: {
        formula: {
          include: {
            FormulaIngredients: {
              include: { rawMaterial: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, data: orders }
  } catch (error) {
    console.error("Error fetching work orders:", error)
    return { success: false, error: "No se pudieron cargar las órdenes" }
  }
}

export async function createWorkOrder(formulaId: string, targetVolumeLiters: number) {
  try {
    if (!formulaId || targetVolumeLiters <= 0) {
      return { success: false, error: "Datos de orden inválidos." }
    }

    const order = await prisma.workOrder.create({
      data: {
        formulaId,
        targetVolumeLiters,
        status: "PENDING"
      }
    })

    revalidatePath("/production")
    return { success: true, data: order }
  } catch (error) {
    return { success: false, error: "Error al crear la orden de producción" }
  }
}

export async function completeWorkOrder(orderId: string, observations: string = "") {
  try {
    // 1. Obtener la orden y su fórmula con ingredientes
    const order = await prisma.workOrder.findUnique({
      where: { id: orderId },
      include: {
        formula: {
          include: {
            FormulaIngredients: {
              include: { rawMaterial: true }
            }
          }
        }
      }
    })

    if (!order) throw new Error("Orden no encontrada")
    if (order.status === "FINISHED") throw new Error("La orden ya está finalizada")

    // Calcular la escala de la receta original vs la pedida.
    // Ej: Si la receta base daba 10L, y se piden 100L, escalar a 10x.
    const baseLiters = order.formula.FormulaIngredients.reduce(
      (sum: any, ing: any) => sum + (ing.quantityKg / ing.rawMaterial.densityKgL), 0
    )
    
    if (baseLiters === 0) throw new Error("Fórmula base inválida (Volumen 0L)")
    const scaleFactor = order.targetVolumeLiters / baseLiters

    // 2. Transacción atómica: Actualizar stock de todos y marcar orden como finalizada
    await prisma.$transaction(async (tx: any) => {
      for (const ing of order.formula.FormulaIngredients) {
        const requiredKg = ing.quantityKg * scaleFactor
        
        // Descontar inventario validando negativos si es necesario (se restringe en UI previo)
        await tx.rawMaterial.update({
          where: { id: ing.rawMaterialId },
          data: {
            stockKg: { decrement: requiredKg }
          }
        })
      }

      await tx.workOrder.update({
        where: { id: orderId },
        data: { 
          status: "FINISHED",
          completedAt: new Date(),
          observations
        }
      })
    })

    revalidatePath("/production")
    revalidatePath("/inventory")
    return { success: true }
  } catch (error: any) {
    console.error("Error completando orden:", error)
    return { success: false, error: error.message || "No se pudo finalizar la orden y descontar el inventario" }
  }
}

export async function deleteWorkOrder(id: string) {
  try {
    await prisma.workOrder.delete({
      where: { id }
    })
    revalidatePath("/production")
    return { success: true }
  } catch (error) {
    console.error("Error deleting work order:", error)
    return { success: false, error: "No se pudo eliminar el registro histórico del lote." }
  }
}
