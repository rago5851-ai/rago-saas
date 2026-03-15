"use server"

import { cookies } from "next/headers"
import { db, auth } from "@/lib/firebase"
import { redirect } from "next/navigation"

/** Inicio de sesión / registro con Google: recibe el idToken del cliente y crea la sesión. */
export async function loginWithGoogleAction(idToken: string) {
  if (!idToken?.trim()) return { success: false, error: "Token inválido" }

  if (!auth) {
    console.error("[AUTH] Firebase Auth no disponible en loginWithGoogleAction")
    return { success: false, error: "El servicio de autenticación no está disponible." }
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken)
    const uid = decodedToken.uid
    const email = decodedToken.email ?? ""

    const userDoc = await db.collection("users").doc(uid).get()

    if (userDoc.exists) {
      const userData = userDoc.data()
      if (userData?.isActive === false) {
        return { success: false, error: "Tu cuenta ha sido desactivada. Contacta soporte." }
      }
    } else {
      await db.collection("users").doc(uid).set({
        email,
        role: "CUSTOMER",
        isActive: true,
        createdAt: new Date(),
      })
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn })

    const cookieStore = await cookies()
    cookieStore.set("auth_token", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: expiresIn / 1000,
      path: "/",
      sameSite: "lax",
    })

    return { success: true }
  } catch (error) {
    console.error("[AUTH] loginWithGoogleAction error:", error)
    return { success: false, error: "No se pudo verificar la sesión de Google. Intenta de nuevo." }
  }
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email")?.toString()
  const password = formData.get("password")?.toString()

  if (!email || !password) return { success: false, error: "Faltan credenciales" }

  if (!auth) {
    console.error("[AUTH] Firebase Auth no disponible en loginAction")
    return { success: false, error: "El servicio de autenticación no está disponible. Verifica la configuración del servidor." }
  }

  try {
    // La verificación de contraseña no está en el Admin SDK, la hacemos vía
    // REST API identity toolkit pero usando la API Key que el Admin SDK puede
    // proporcionar automáticamente. Como alternativa, usamos Admin SDK para
    // buscar el usuario por email y verificar vía REST, o usamos signInWithEmailAndPassword
    // en el cliente. La solución más simple y segura del lado servidor es:
    // 1. Verificar que el usuario existe via Admin SDK
    // 2. Usar REST API con la API key (o usar la clave de la service account para generar un custom token)

    // Intentamos primero verificar que el usuario exista
    let firebaseUser
    try {
      firebaseUser = await auth.getUserByEmail(email)
    } catch {
      return { success: false, error: "Usuario no encontrado" }
    }

    // Verificar contraseña vía REST API de Identity Toolkit
    // (El Admin SDK no provee verificación de contraseña directamente)
    const apiKey = process.env.FIREBASE_API_KEY
    if (!apiKey) {
      return { success: false, error: "Configuración del servidor incompleta. Contacta al administrador." }
    }

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    )

    const data = await res.json()

    if (!res.ok) {
      const msg = data.error?.message || ""
      if (msg.includes("INVALID_LOGIN_CREDENTIALS") || msg.includes("INVALID_PASSWORD")) {
        return { success: false, error: "Contraseña incorrecta" }
      }
      return { success: false, error: "Error de autenticación" }
    }

    const idToken = data.idToken
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

    // 3. Crear Session Cookie de Firebase (más seguro que el UID plano)
    // Expira en 5 días (limite de Firebase Session Cookies)
    const expiresIn = 60 * 60 * 24 * 5 * 1000 
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn })

    const cookieStore = await cookies()
    cookieStore.set('auth_token', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: expiresIn / 1000,
      path: "/",
      sameSite: "lax"
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
  redirect("/")
}

export async function registerAction(formData: FormData) {
  const email = formData.get("email")?.toString()
  const password = formData.get("password")?.toString()

  if (!email || !password) return { success: false, error: "Faltan credenciales" }

  if (!auth) {
    console.error("[AUTH] Firebase Auth no disponible en registerAction")
    return { success: false, error: "El servicio de autenticación no está disponible. Verifica la configuración del servidor." }
  }

  try {
    // 1. Crear el usuario directamente con Admin SDK
    // Esto NO necesita una API key web — usa las credenciales de Service Account
    // y NUNCA falla con "unregistered callers"
    let newUser
    try {
      newUser = await auth.createUser({ email, password })
    } catch (err: any) {
      if (err.code === "auth/email-already-exists") {
        return { success: false, error: "El correo ya está registrado" }
      }
      if (err.code === "auth/weak-password") {
        return { success: false, error: "La contraseña debe tener al menos 6 caracteres" }
      }
      if (err.code === "auth/invalid-email") {
        return { success: false, error: "El formato del correo no es válido" }
      }
      throw err
    }

    const uid = newUser.uid

    // 2. Crear documento del usuario en Firestore
    const role = "CUSTOMER"
    await db.collection("users").doc(uid).set({
      email,
      role,
      isActive: true,
      createdAt: new Date(),
    })

    // 3. Generar Session Cookie
    // Como estamos en el servidor y acabamos de crear al usuario, 
    // generamos un custom token y lo cambiamos por un ID token para crear la session cookie.
    const customToken = await auth.createCustomToken(uid)
    const apiKey = process.env.FIREBASE_API_KEY
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      }
    )
    const data = await res.json()
    const idToken = data.idToken

    const expiresIn = 60 * 60 * 24 * 5 * 1000 
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn })

    const cookieStore = await cookies()
    cookieStore.set('auth_token', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: expiresIn / 1000,
      path: "/",
      sameSite: "lax"
    })
    
    return { success: true, role }
  } catch(error) {
    console.error("Register Error:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

