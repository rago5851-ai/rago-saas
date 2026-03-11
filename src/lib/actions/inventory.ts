"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function getRawMaterials() {
  try {
    const materials = await prisma.rawMaterial.findMany({
      orderBy: { name: "asc" }
    })
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
    }

    if (!data.name || isNaN(data.stockKg) || isNaN(data.densityKgL) || isNaN(data.pricePerKg)) {
      return { success: false, error: "Por favor revisa que todos los campos numéricos sean válidos." }
    }

    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_token')
    if (!authCookie?.value) return { success: false, error: "No autorizado" }

    const newMaterial = await prisma.rawMaterial.create({
      data: {
        ...data,
        userId: authCookie.value
      }
    })

    revalidatePath("/inventory")
    return { success: true, data: newMaterial }
  } catch (error) {
    console.error("Error creating material:", error)
    return { success: false, error: "Hubo un error al guardar el insumo" }
  }
}

export async function updateRawMaterialStock(id: string, newStock: number) {
  try {
    await prisma.rawMaterial.update({
      where: { id },
      data: { stockKg: newStock }
    })
    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    return { success: false, error: "No se pudo actualizar el inventario" }
  }
}

export async function deleteRawMaterial(id: string) {
  try {
    await prisma.rawMaterial.delete({ where: { id } })
    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    return { success: false, error: "No se pudo eliminar el insumo (puede estar en uso)." }
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
    }

    if (!id || !data.name || isNaN(data.stockKg) || isNaN(data.densityKgL) || isNaN(data.pricePerKg)) {
      return { success: false, error: "Revisa los campos numéricos y el ID." }
    }

    await prisma.rawMaterial.update({
      where: { id },
      data
    })

    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Hubo un error al actualizar." }
  }
}
