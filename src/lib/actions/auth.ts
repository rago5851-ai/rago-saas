"use server"

import { cookies } from "next/headers"

import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function loginAction(formData: FormData) {
  const email = formData.get("email")?.toString()
  const password = formData.get("password")?.toString()

  if (!email || !password) return { success: false, error: "Faltan credenciales" }

  try {
    // 1. Auto-seed: Si no hay ningún usuario en el sistema y se intenta loguear rago, crearlo
    const userCount = await prisma.user.count()
    if (userCount === 0 && email === "admin@rago.com") {
      const hashedPassword = await bcrypt.hash(password, 10)
      await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          role: "SUPERADMIN"
        }
      })
    }

    // 2. Buscar usuario
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return { success: false, error: "Usuario no encontrado" }

    if (!user.isActive) return { success: false, error: "Tu cuenta ha sido desactivada. Contacta soporte." }

    // 3. Validar contraseña
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) return { success: false, error: "Contraseña incorrecta" }

    // 4. Setear cookie con el ID (como token simple)
    const cookieStore = await cookies()
    cookieStore.set('auth_token', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 dias de persistencia
      path: "/",
    })
    
    return { success: true, role: user.role }
  } catch(error) {
    console.error("Login Error:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function logoutAction(formData?: FormData) {
  const cookieStore = await cookies()
  cookieStore.delete('auth_token')
}

export async function registerAction(formData: FormData) {
  const email = formData.get("email")?.toString()
  const password = formData.get("password")?.toString()

  if (!email || !password) return { success: false, error: "Faltan credenciales" }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) return { success: false, error: "El correo ya está registrado" }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: "CUSTOMER" // Or whatever default makes sense
      }
    })

    const cookieStore = await cookies()
    cookieStore.set('auth_token', newUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 dias de persistencia
      path: "/",
    })
    
    return { success: true, role: newUser.role }
  } catch(error) {
    console.error("Register Error:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

