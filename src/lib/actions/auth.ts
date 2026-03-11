"use server"

import { cookies } from "next/headers"
import { db } from "@/lib/firebase"

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || ""

export async function loginAction(formData: FormData) {
  const email = formData.get("email")?.toString()
  const password = formData.get("password")?.toString()

  if (!email || !password) return { success: false, error: "Faltan credenciales" }

  try {
    // 1. Iniciar sesión usando Firebase Auth REST API (Identity Toolkit)
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    )

    const data = await res.json()

    if (!res.ok) {
      if (data.error?.message === "INVALID_LOGIN_CREDENTIALS") {
        return { success: false, error: "Credenciales incorrectas" }
      }
      return { success: false, error: "Error de autenticación" }
    }

    const uid = data.localId

    // 2. Obtener datos del usuario desde Firestore
    const userDoc = await db.collection("users").doc(uid).get()
    
    let role = "CUSTOMER"
    
    // Auto-seed: Si es el primer login del admin, crear el documento en Firestore
    if (!userDoc.exists && email === "admin@rago.com") {
      role = "SUPERADMIN"
      await db.collection("users").doc(uid).set({
        email,
        role: "SUPERADMIN",
        isActive: true,
        createdAt: new Date(),
      })
    } else if (!userDoc.exists) {
      // Por si un usuario fue creado en auth pero no en firestore (edge case)
      await db.collection("users").doc(uid).set({
        email,
        role: "CUSTOMER",
        isActive: true,
        createdAt: new Date(),
      })
    } else {
      const userData = userDoc.data()
      if (userData?.isActive === false) {
         return { success: false, error: "Tu cuenta ha sido desactivada. Contacta soporte." }
      }
      role = userData?.role || "CUSTOMER"
    }

    // 3. Setear cookie con el ID (uid de Firebase)
    const cookieStore = await cookies()
    cookieStore.set('auth_token', uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 dias de persistencia
      path: "/",
    })
    
    return { success: true, role }
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
    // 1. Registrar usuario usando Firebase Auth REST API 
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    )

    const data = await res.json()

    if (!res.ok) {
      if (data.error?.message === "EMAIL_EXISTS") {
         return { success: false, error: "El correo ya está registrado" }
      }
      return { success: false, error: "Error de registro: " + (data.error?.message || "") }
    }

    const uid = data.localId

    // 2. Crear documento del usuario en Firestore
    const role = "CUSTOMER"
    await db.collection("users").doc(uid).set({
        email,
        role,
        isActive: true,
        createdAt: new Date(),
    })

    // 3. Establecer cookie predeterminada
    const cookieStore = await cookies()
    cookieStore.set('auth_token', uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 dias de persistencia
      path: "/",
    })
    
    return { success: true, role }
  } catch(error) {
    console.error("Register Error:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

