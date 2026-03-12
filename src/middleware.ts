import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Mapeamos las rutas principales que queremos proteger
const protectedRoutes = ['/inventory', '/formulas', '/production']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Protect specific routes and the root dashboard
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route)) || pathname === '/'
  
  const hasSession = request.cookies.has('auth_token')

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect from login to home/inventory if session exists
  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/inventory', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
}
