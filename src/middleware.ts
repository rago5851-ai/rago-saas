import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Mapeamos las rutas principales que queremos proteger
const protectedRoutes = ['/inventory', '/formulas', '/production']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Si intenta entrar al dashboard raíz, redigirir a login si no hay ref
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route)) || pathname === '/'
  
  const isAuthenticated = request.cookies.has('auth_token')

  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirigir de login a home si ya está autenticado
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/inventory', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
}
