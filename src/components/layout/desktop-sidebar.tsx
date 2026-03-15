"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  ShoppingBag,
  History,
  Calculator,
  Factory,
  Package,
  PackageOpen,
  Users,
  BarChart3,
  LogOut,
  LayoutDashboard,
} from "lucide-react"
import { logoutAction } from "@/lib/actions/auth"

const navItems = [
  { href: "/", label: "Inicio", Icon: Home },
  { href: "/ventas", label: "Ventas", Icon: ShoppingBag },
  { href: "/productos", label: "Productos", Icon: PackageOpen },
  { href: "/historial", label: "Historial", Icon: History },
  { href: "/caja", label: "Caja", Icon: Calculator },
  { href: "/fabricacion", label: "Fabricación", Icon: Factory },
  { href: "/inventory", label: "Inventario", Icon: Package },
  { href: "/clientes", label: "Clientes", Icon: Users },
  { href: "/reportes", label: "Reportes", Icon: BarChart3 },
]

export function DesktopSidebar() {
  const pathname = usePathname()

  const handleLogout = async () => {
    await logoutAction()
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:z-40 bg-white border-r border-slate-200/80 shadow-sm">
      <div className="flex items-center gap-4 px-5 py-6 border-b border-slate-100">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
          <LayoutDashboard className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-black text-slate-800 tracking-tight">Rago POS</h1>
          <p className="text-xs font-medium text-slate-500">Punto de venta</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${active ? "text-blue-600" : "text-slate-500"}`} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
