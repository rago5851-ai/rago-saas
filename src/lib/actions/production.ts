"use server"

import { db } from "@/lib/firebase"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function getWorkOrders() {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_token')
    if (!authCookie?.value) return { success: false, error: "No autorizado" }

    // 1. Obtener órdenes del usuario
    const ordersSnapshot = await db.collection("workOrders")
      .where("userId", "==", authCookie.value)
      .orderBy("createdAt", "desc")
      .get()

    // 2. Para popular la fórmula e insumos, necesitamos buscarlos
    // Esto se puede optimizar, pero por ahora obtenemos todo del user para cruzar en memoria.
    const formulasSnapshot = await db.collection("formulas").where("userId", "==", authCookie.value).get()
    const rawMaterialsSnapshot = await db.collection("rawMaterials").where("userId", "==", authCookie.value).get()
    
    const rawMaterialsMap = new Map()
    rawMaterialsSnapshot.docs.forEach(doc => rawMaterialsMap.set(doc.id, { id: doc.id, ...doc.data() }))

    const formulasMap = new Map()
    formulasSnapshot.docs.forEach(doc => {
      const data = doc.data()
      formulasMap.set(doc.id, {
        id: doc.id,
        ...data,
        FormulaIngredients: (data.ingredients || []).map((ing: any) => ({
          rawMaterialId: ing.rawMaterialId,
          quantityKg: ing.quantityKg,
          rawMaterial: rawMaterialsMap.get(ing.rawMaterialId) || null
        }))
      })
    })

    const orders = ordersSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        formula: formulasMap.get(data.formulaId) || null
      }
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

    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_token')
    if (!authCookie?.value) return { success: false, error: "No autorizado" }

    const orderData = {
      userId: authCookie.value,
      formulaId,
      targetVolumeLiters,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const orderRef = await db.collection("workOrders").add(orderData)

    revalidatePath("/production")
    return { success: true, data: { id: orderRef.id, ...orderData } }
  } catch (error) {
    return { success: false, error: "Error al crear la orden de producción" }
  }
}

export async function completeWorkOrder(orderId: string, observations: string = "") {
  try {
    // 1. Obtener la orden
    const orderDoc = await db.collection("workOrders").doc(orderId).get()
    if (!orderDoc.exists) throw new Error("Orden no encontrada")
    
    const orderData = orderDoc.data()
    if (orderData?.status === "FINISHED") throw new Error("La orden ya está finalizada")

    // 2. Obtener fórmula y recalcular la escala
    const formulaDoc = await db.collection("formulas").doc(orderData?.formulaId).get()
    if (!formulaDoc.exists) throw new Error("Fórmula no encontrada")
    
    const formulaData = formulaDoc.data()
    const ingredients = formulaData?.ingredients || []

    // Obtener información de los insumos implicados (para densidades)
    const rawMaterialRefs = ingredients.map((ing: any) => db.collection("rawMaterials").doc(ing.rawMaterialId))
    const rawMaterialDocs = rawMaterialRefs.length > 0 ? await db.getAll(...rawMaterialRefs) : []

    let baseLiters = 0;
    const stockUpdates: { ref: any, requiredKg: number, name: string }[] = []

    for (let i = 0; i < ingredients.length; i++) {
        const ing = ingredients[i]
        const rmDoc = rawMaterialDocs.find(d => d.id === ing.rawMaterialId)
        if (!rmDoc || !rmDoc.exists) throw new Error("Insumo no encontrado: " + ing.rawMaterialId)

        const rmData = rmDoc.data()
        baseLiters += (ing.quantityKg / rmData?.densityKgL)

        // Preparamos los updates para la transacción
        stockUpdates.push({
            ref: rmDoc.ref,
            requiredKg: 0, // se calcula tras tener el scaleFactor
            name: rmData?.name || "Insumo desconocido"
        })
    }
    
    if (baseLiters === 0) throw new Error("Fórmula base inválida (Volumen 0L)")
    const scaleFactor = orderData!.targetVolumeLiters / baseLiters

    // Asignamos la resta de stock requerida final
    for (let i = 0; i < ingredients.length; i++) {
        stockUpdates[i].requiredKg = ingredients[i].quantityKg * scaleFactor
    }

    // 3. Transacción de Firestore: Actualizar stock de todos y marcar orden como finalizada
    await db.runTransaction(async (transaction: any) => {
        // En Firestore, todas las lecturas deben ser antes de escrituras en transacción,
        // pero arriba ya leímos. Necesitamos re-leer en transacción si queremos asegurar atomicidad pura
        // por ahora, usando db.runTransaction.

        // Re-leemos stocks usando la transaccion
        const currentStocks = []
        for(const su of stockUpdates) {
             const doc = await transaction.get(su.ref)
             currentStocks.push(doc.data().stockKg)
        }

        // Ejecutar descuentos de inventario y verificar negativos
        for(let i=0; i < stockUpdates.length; i++) {
             const newStock = currentStocks[i] - stockUpdates[i].requiredKg
             // Opcional: Validar newStock < 0 si es necesario
             transaction.update(stockUpdates[i].ref, { stockKg: newStock, updatedAt: new Date() })
        }

        transaction.update(db.collection("workOrders").doc(orderId), { 
          status: "FINISHED",
          completedAt: new Date(),
          observations,
          updatedAt: new Date()
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
    await db.collection("workOrders").doc(id).delete()
    revalidatePath("/production")
    return { success: true }
  } catch (error) {
    console.error("Error deleting work order:", error)
    return { success: false, error: "No se pudo eliminar el registro histórico del lote." }
  }
}
