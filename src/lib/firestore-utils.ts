/**
 * Converts Firestore Timestamps (and nested ones) to ISO strings so they can
 * be safely serialized by Next.js Server Actions → Client Components.
 *
 * Firestore Timestamps have a `.toDate()` method. Any plain Date is also
 * converted. Everything else is returned as-is.
 */
export function serializeDoc(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value.toDate === "function") {
      // Firestore Timestamp
      result[key] = value.toDate().toISOString()
    } else if (value instanceof Date) {
      result[key] = value.toISOString()
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item && typeof item === "object" && !Array.isArray(item)
          ? serializeDoc(item)
          : item
      )
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = serializeDoc(value)
    } else {
      result[key] = value
    }
  }
  return result
}
