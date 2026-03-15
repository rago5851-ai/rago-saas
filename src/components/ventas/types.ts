export type Product = {
  id: string
  name: string
  stockLiters: number
  salePrice: number
  costPerLiter?: number
  unit?: "L" | "pz"
  barcode?: string
}

export type Cart = Record<string, { product: Product; qty: number }>
