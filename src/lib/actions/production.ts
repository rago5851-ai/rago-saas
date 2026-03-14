"use server"

import { db, auth } from "@/lib/firebase"
import { serializeDoc } from "@/lib/firestore-utils"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { getUserId } from "@/lib/auth-utils"

export async function getWorkOrders() {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    // 1. Obtener órdenes del usuario (sin orderBy para evitar índice compuesto)
    const ordersSnapshot = await db.collection("workOrders")
      .where("userId", "==", userId)
      .get()

    // 2. Para popular la fórmula e insumos, necesitamos buscarlos
    const formulasSnapshot = await db.collection("formulas").where("userId", "==", userId).get()
    const rawMaterialsSnapshot = await db.collection("rawMaterials").where("userId", "==", userId).get()
    
    const rawMaterialsMap = new Map()
    rawMaterialsSnapshot.docs.forEach(doc => rawMaterialsMap.set(doc.id, serializeDoc({ id: doc.id, ...doc.data() })))

    const formulasMap = new Map()
    formulasSnapshot.docs.forEach(doc => {
      const data = doc.data()
      const serialized = serializeDoc({ id: doc.id, ...data })
      formulasMap.set(doc.id, {
        ...serialized,
        FormulaIngredients: (data.ingredients || []).map((ing: any) => ({
          rawMaterialId: ing.rawMaterialId,
          quantityKg: ing.quantityKg,
          rawMaterial: rawMaterialsMap.get(ing.rawMaterialId) || null
        }))
      })
    })

    const orders = ordersSnapshot.docs
      .map(doc => {
        const data = doc.data()
        const serialized = serializeDoc({ id: doc.id, ...data })
        return {
          ...serialized,
          formula: formulasMap.get(data.formulaId) || null
        }
      })
      // Sort in-memory by createdAt ISO string (desc)
      .sort((a: any, b: any) => {
        const aStr = a.createdAt || ""
        const bStr = b.createdAt || ""
        return bStr.localeCompare(aStr)
      })

    return { success: true, data: orders }
  } catch (error: any) {
    console.error("Error fetching work orders:", error?.message || error)
    return { success: false, error: "No se pudieron cargar las órdenes" }
  }
}

export async function createWorkOrder(formulaId: string, targetVolumeLiters: number, salePrice: number = 0) {
  try {
    if (!formulaId || targetVolumeLiters <= 0) {
      return { success: false, error: "Datos de orden inválidos." }
    }

    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    const orderData = {
      userId: userId,
      formulaId,
      targetVolumeLiters,
      salePrice: salePrice || 0,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const orderRef = await db.collection("workOrders").add(orderData)

    revalidatePath("/production")
    revalidatePath("/")
    return {
      success: true,
      data: {
        id: orderRef.id,
        ...orderData,
        createdAt: orderData.createdAt.toISOString(),
        updatedAt: orderData.updatedAt.toISOString(),
      },
    }
  } catch (error) {
    return { success: false, error: "Error al crear la orden de producción" }
  }
}

export async function completeWorkOrder(orderId: string, observations: string = "") {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    // 1. Obtener la orden
    const orderDoc = await db.collection("workOrders").doc(orderId).get()
    if (!orderDoc.exists) throw new Error("Orden no encontrada")
    
    const orderData = orderDoc.data()
    if (orderData?.userId !== userId) throw new Error("Acceso denegado")
    if (orderData?.status === "FINISHED") throw new Error("La orden ya está finalizada")

    // 2. Obtener fórmula con su tipo
    const formulaDoc = await db.collection("formulas").doc(orderData?.formulaId).get()
    if (!formulaDoc.exists) throw new Error("Fórmula no encontrada")
    
    const formulaData = formulaDoc.data()
    const formulaType = formulaData?.type || "TERMINADO"   // default backwards-compat
    const ingredients = formulaData?.ingredients || []

    // 3. Obtener insumos para cálculos (densidad, precio)
    const rawMaterialRefs = ingredients.map((ing: any) => db.collection("rawMaterials").doc(ing.rawMaterialId))
    const rawMaterialDocs = rawMaterialRefs.length > 0 ? await db.getAll(...rawMaterialRefs) : []

    let baseLiters = 0
    let totalCostBase = 0
    const stockUpdates: { ref: any, requiredKg: number }[] = []

    for (let i = 0; i < ingredients.length; i++) {
      const ing = ingredients[i]
      const rmDoc = rawMaterialDocs.find((d: any) => d.id === ing.rawMaterialId)
      if (!rmDoc || !rmDoc.exists) throw new Error("Insumo no encontrado: " + ing.rawMaterialId)

      const rmData = rmDoc.data()
      baseLiters += (ing.quantityKg / rmData?.densityKgL)
      totalCostBase += (ing.quantityKg * rmData?.pricePerKg)

      stockUpdates.push({ ref: rmDoc.ref, requiredKg: 0 })
    }

    if (baseLiters === 0) throw new Error("Fórmula base inválida (Volumen 0L)")
    const scaleFactor = orderData!.targetVolumeLiters / baseLiters

    // Totales escalados para este lote
    let totalKgProducidos = 0
    let totalCostProduccion = 0

    for (let i = 0; i < ingredients.length; i++) {
      stockUpdates[i].requiredKg = ingredients[i].quantityKg * scaleFactor
      totalKgProducidos += stockUpdates[i].requiredKg
      const rmData = rawMaterialDocs.find((d: any) => d.id === ingredients[i].rawMaterialId)?.data()
      if (rmData) totalCostProduccion += stockUpdates[i].requiredKg * rmData.pricePerKg
    }

    const costPerKg = totalKgProducidos > 0 ? totalCostProduccion / totalKgProducidos : 0
    const costPerLiter = orderData!.targetVolumeLiters > 0 ? totalCostProduccion / orderData!.targetVolumeLiters : 0

    // 4. Transacción: descontar materias primas y cerrar orden
    await db.runTransaction(async (transaction: any) => {
      // Leer stocks actuales dentro de la transacción
      const currentStocks: number[] = []
      for (const su of stockUpdates) {
        const doc = await transaction.get(su.ref)
        currentStocks.push(doc.data().stockKg)
      }

      // Descontar inventario de ingredientes
      for (let i = 0; i < stockUpdates.length; i++) {
        const newStock = Math.max(0, currentStocks[i] - stockUpdates[i].requiredKg)
        transaction.update(stockUpdates[i].ref, { stockKg: newStock, updatedAt: new Date() })
      }

      // Cerrar la orden
      transaction.update(db.collection("workOrders").doc(orderId), {
        status: "FINISHED",
        completedAt: new Date(),
        observations,
        updatedAt: new Date(),
        totalCost: totalCostProduccion,
        costPerLiter,
      })
    })

    // 5. Post-transacción: crear/actualizar el resultado según el tipo de fórmula
    if (formulaType === "SEMIELABORADO") {
      // Buscar si ya existe un rawMaterial con el mismo nombre para este usuario
      const existingSnap = await db.collection("rawMaterials")
        .where("userId", "==", userId)
        .where("name", "==", formulaData?.name)
        .get()

      const densityKgL = totalKgProducidos > 0 ? orderData!.targetVolumeLiters / totalKgProducidos : 1

      if (!existingSnap.empty) {
        // Actualizar stock existente (sumar) y recalcular precio ponderado
        const existingDoc = existingSnap.docs[0]
        const existingData = existingDoc.data()
        const oldKg = existingData.stockKg || 0
        const oldPricePerKg = existingData.pricePerKg || 0
        const newKg = oldKg + totalKgProducidos
        // Promedio ponderado del costo
        const newPricePerKg = newKg > 0 ? ((oldKg * oldPricePerKg) + totalCostProduccion) / newKg : costPerKg

        await db.collection("rawMaterials").doc(existingDoc.id).update({
          stockKg: newKg,
          pricePerKg: Math.round(newPricePerKg * 1000) / 1000,
          densityKgL: Math.round(densityKgL * 1000) / 1000,
          updatedAt: new Date(),
        })
      } else {
        // Crear nuevo insumo semielaborado en el inventario
        await db.collection("rawMaterials").add({
          userId: userId,
          name: formulaData?.name,
          stockKg: Math.round(totalKgProducidos * 1000) / 1000,
          concentrationPercent: 100,
          densityKgL: Math.round(densityKgL * 1000) / 1000,
          pricePerKg: Math.round(costPerKg * 1000) / 1000,
          esSemielaborado: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
      revalidatePath("/inventory")
    } else {
      // TERMINADO → upsert en productInventory (un doc por producto)
      const existingSnap = await db.collection("productInventory")
        .where("userId", "==", userId)
        .where("name", "==", formulaData?.name)
        .get()

      const salePricePerLiter = orderData?.salePrice || 0

      if (!existingSnap.empty) {
        // Sumar al stock existente, actualizar precio de venta si se pasa
        const existingDoc = existingSnap.docs[0]
        const existingData = existingDoc.data()
        const newStock = (existingData.stockLiters || 0) + orderData!.targetVolumeLiters
        await db.collection("productInventory").doc(existingDoc.id).update({
          stockLiters: Math.round(newStock * 100) / 100,
          costPerLiter: Math.round(costPerLiter * 100) / 100,
          ...(salePricePerLiter > 0 ? { salePrice: salePricePerLiter } : {}),
          updatedAt: new Date(),
        })
      } else {
        // Crear producto nuevo en el catálogo de ventas
        await db.collection("productInventory").add({
          userId: userId,
          formulaId: orderData?.formulaId,
          name: formulaData?.name,
          stockLiters: Math.round(orderData!.targetVolumeLiters * 100) / 100,
          costPerLiter: Math.round(costPerLiter * 100) / 100,
          salePrice: salePricePerLiter,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
      revalidatePath("/ventas")
      revalidatePath("/inventory")
    }

    revalidatePath("/production")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("Error completando orden:", error)
    return { success: false, error: error.message || "No se pudo finalizar la orden y descontar el inventario" }
  }
}

export async function deleteWorkOrder(id: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { success: false, error: "No autorizado" }

    const doc = await db.collection("workOrders").doc(id).get()
    if (!doc.exists || doc.data()?.userId !== userId) {
      return { success: false, error: "No tienes permiso para eliminar este recurso" }
    }

    await db.collection("workOrders").doc(id).delete()
    revalidatePath("/production")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting work order:", error)
    return { success: false, error: "No se pudo eliminar el registro histórico del lote." }
  }
}
