/**
 * Converts any value from Firestore to a plain JSON-serializable format
 * safe for passing to Client Components (Server Actions boundary).
 * Handles: Timestamps, Date, nested objects/arrays.
 */
function toPlainValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value !== "object") return value

  // Firestore Timestamp (has toDate)
  if (typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  // Firestore Timestamp serializado ({ _seconds, _nanoseconds })
  const objLike = value as { _seconds?: number; _nanoseconds?: number }
  if (typeof objLike._seconds === "number" && typeof objLike._nanoseconds === "number") {
    return new Date(objLike._seconds * 1000 + objLike._nanoseconds / 1e6).toISOString()
  }
  // Date (toISOString)
  if (typeof (value as Date).toISOString === "function") {
    return (value as Date).toISOString()
  }

  if (Array.isArray(value)) {
    return value.map((item) => toPlainValue(item))
  }

  // Only recurse into plain objects (avoid DocumentReference, class instances)
  const obj = value as Record<string, unknown>
  if (Object.getPrototypeOf(obj) !== Object.prototype && Object.getPrototypeOf(obj) !== null) {
    return Object.prototype.toString.call(obj)
  }

  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    result[k] = toPlainValue(v)
  }
  return result
}

/**
 * Converts a Firestore document (or any object) to a plain serializable object.
 * Use before returning data from Server Actions to Client Components.
 */
export function toPlainObject<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  return toPlainValue(data) as Record<string, unknown>
}

/**
 * Converts a Firestore doc to a plain serializable object (alias for toPlainObject).
 */
export function serializeDoc<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  return toPlainObject(data)
}

/**
 * Wraps Server Action response to ensure `data` is JSON-serializable.
 * Use when returning from actions to Client Components.
 */
export function sanitizeResponse<T>(response: { success: boolean; data?: T; error?: string }) {
  if (response.data !== undefined) {
    return {
      ...response,
      data: toPlainValue(response.data) as T,
    }
  }
  return response
}
