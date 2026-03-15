"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { loginWithGoogleAction } from "@/lib/actions/auth"
import { getAuthClient } from "@/lib/firebase-client"
import { Button } from "@/components/ui/button"
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleGoogleSignIn() {
    setLoading(true)
    setError(null)

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    if (!apiKey || !authDomain) {
      setError("Configuración de Google no disponible. Revisa las variables de entorno.")
      setLoading(false)
      return
    }

    try {
      const auth = getAuthClient()
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()
      if (!idToken) {
        setError("No se pudo obtener la sesión de Google.")
        setLoading(false)
        return
      }

      const res = await loginWithGoogleAction(idToken)
      if (res.success) {
        router.push("/")
        router.refresh()
      } else {
        setError(res.error ?? "Error al iniciar sesión con Google")
        setLoading(false)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al conectar con Google"
      if (message.includes("popup-closed-by-user") || message.includes("cancelled-popup-request")) {
        setError(null)
      } else {
        setError("No se pudo iniciar sesión con Google. Intenta de nuevo.")
      }
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 px-6 pb-20">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden -mt-20">
        <div className="bg-blue-600 px-6 py-8 text-center text-white space-y-2 relative overflow-hidden">
          <div className="relative z-10">
            <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" aria-hidden>
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black tracking-tight">Acceso Rago</h1>
            <p className="text-blue-100 text-sm font-medium">
              Inicia sesión o regístrate con tu cuenta de Google
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5 bg-gray-50/50">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold text-center border border-red-100 shadow-sm">
              {error}
            </div>
          )}

          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-14 text-base font-bold text-slate-800 bg-white hover:bg-gray-100 border-2 border-slate-200 rounded-xl shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? "Conectando..." : "Continuar con Google"}
          </Button>

          <p className="text-center text-xs text-slate-500">
            Al continuar, te registras o inicias sesión con tu cuenta de Google. No compartimos tu
            información con terceros.
          </p>
        </div>
      </div>
    </div>
  )
}
