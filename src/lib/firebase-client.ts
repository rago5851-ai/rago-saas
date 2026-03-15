"use client"

import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

/**
 * Configuración Firebase para el cliente (login con Google).
 * Requiere en Vercel/local: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
 * NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_APP_ID.
 * En producción: en Firebase Console → Authentication → Settings → Authorized domains
 * agrega tu dominio (ej. tu-proyecto.vercel.app).
 */
function getFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  if (!apiKey || !authDomain || !projectId || !appId) {
    return null
  }
  return { apiKey, authDomain, projectId, appId }
}

function getFirebaseApp() {
  if (getApps().length > 0) return getApp()
  const config = getFirebaseConfig()
  if (!config) {
    throw new Error(
      "Configuración Firebase no disponible. En Vercel, añade NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID y NEXT_PUBLIC_FIREBASE_APP_ID en Environment Variables."
    )
  }
  return initializeApp(config)
}

/** Auth del cliente: solo para login con Google (popup/redirect). No usar en servidor. */
export function getAuthClient() {
  return getAuth(getFirebaseApp())
}

/** Devuelve true si las variables de entorno del cliente están definidas (para mostrar u ocultar el botón de Google). */
export function isFirebaseClientConfigured() {
  return getFirebaseConfig() !== null
}
