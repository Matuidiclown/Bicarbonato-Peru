export interface PriceTier {
  id?: string
  product_id?: string
  min_quantity: number
  unit_price: number
}

export interface Product {
  id: string
  name: string
  slug: string
  description?: string | null
  presentation: string // Ej: "5 Litros", "1 Kg"
  image_url?: string
  category_name?: string
  price_tiers: PriceTier[]
}

export interface CartItem {
  product: Product
  quantity: number
  appliedUnitPrice: number
  subtotal: number
  savings: number
}
