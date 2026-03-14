import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Todas las rutas que requieren autenticación
const protectedRoutes = [
  '/',
  '/inventory',
  '/formulas',
  '/production',
  '/ventas',
  '/clientes',
  '/historial',
  '/caja',
  '/cortes',
  '/fabricacion',
  '/reportes',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = pathname === '/' || protectedRoutes.some(route => route !== '/' && pathname.startsWith(route))
  
  const hasSession = request.cookies.has('auth_token')

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si ya hay sesión y entran a login, mandar a Inicio
  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
