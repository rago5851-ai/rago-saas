"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { loginAction, registerAction } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, User } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)

  async function handleAuth(formData: FormData) {
    setLoading(true)
    setError(null)
    const action = isRegister ? registerAction : loginAction
    const res = await action(formData)
    if (res.success) {
      router.push("/")
      router.refresh()
    } else {
      setError(res.error || (isRegister ? "Error al registrarse" : "Credenciales incorrectas"))
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 px-6 pb-20">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden -mt-20">
        <div className="bg-blue-600 px-6 py-8 text-center text-white space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lock className="h-48 w-48 text-white -mt-10 -mr-10" />
          </div>
          <div className="relative z-10">
            <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
               <User className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Acceso Rago</h1>
            <p className="text-blue-100 text-sm font-medium">Sistema de Producción y Costeo</p>
          </div>
        </div>
        
        <form action={handleAuth} className="p-6 space-y-5 bg-gray-50/50">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold text-center border border-red-100 shadow-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <Input 
                name="email" 
                type="email" 
                placeholder="admin@rago.com" 
                className="pl-10 h-12 text-base font-bold bg-white border-gray-300 text-black placeholder:text-gray-300 shadow-sm focus-visible:ring-blue-600"
                required 
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <Input 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                className="pl-10 h-12 text-base font-bold bg-white border-gray-300 text-black placeholder:text-gray-300 shadow-sm focus-visible:ring-blue-600"
                required 
              />
            </div>
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-14 text-lg font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transition-transform active:scale-95"
            >
              {loading ? "Procesando..." : (isRegister ? "Crear Cuenta" : "Iniciar Sesión")}
            </Button>
            
            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => setIsRegister(!isRegister)}
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
