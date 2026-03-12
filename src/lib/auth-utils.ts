import { auth } from "./firebase"
import { cookies } from "next/headers"

export async function getUserId() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('auth_token')?.value
  if (!sessionCookie) return null

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true)
    console.log("[AUTH-AUDIT] User verified:", decodedToken.uid)
    return decodedToken.uid
  } catch (error) {
    console.error("[AUTH-AUDIT] Auth error:", error)
    return null
  }
}
