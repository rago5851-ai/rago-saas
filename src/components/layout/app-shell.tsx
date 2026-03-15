"use client"

import { usePathname } from "next/navigation"
import { DesktopSidebar } from "./desktop-sidebar"
import { MobileNav } from "./mobile-nav"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === "/login"

  if (isLogin) {
    return <>{children}</>
  }

  return (
    <>
      <DesktopSidebar />
      <div className="lg:pl-72 min-h-screen flex flex-col bg-slate-50/50">
        {children}
      </div>
      <MobileNav />
    </>
  )
}
