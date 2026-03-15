"use client"

import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

/** Requiere en .env: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_APP_ID */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

function getFirebaseApp() {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig)
  }
  return getApp()
}

/** Auth del cliente: solo para login con Google (popup). No usar en servidor. */
export function getAuthClient() {
  return getAuth(getFirebaseApp())
}
