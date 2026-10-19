import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface PriceTier {
  id?: string
  min_quantity: number
  unit_price: number
}

export interface CartItem {
  id: string
  name: string
  presentation?: string
  category?: string
  subcategory?: string
  image_url?: string
  price_tiers: PriceTier[]
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (product: any, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  
  // Helpers de cálculos
  getCalculatedTotals: () => {
    subtotalBase: number
    totalDiscount: number
    finalTotal: number
    totalCount: number
  }
  getTotalAmount: () => number
  getTotalSavings: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        const currentItems = get().items
        const existingItemIndex = currentItems.findIndex(i => i.id === product.id)

        if (existingItemIndex > -1) {
          const updated = [...currentItems]
          updated[existingItemIndex].quantity += quantity
          set({ items: updated })
        } else {
          set({
            items: [
              ...currentItems,
              {
                id: product.id,
                name: product.name,
                presentation: product.presentation,
                category: product.category,
                subcategory: product.subcategory,
                image_url: product.image_url,
                price_tiers: product.price_tiers || [],
                quantity: quantity
              }
            ]
          })
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter(i => i.id !== productId) })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map(item =>
            item.id === productId ? { ...item, quantity } : item
          )
        })
      },

      clearCart: () => set({ items: [] }),

      getCalculatedTotals: () => {
        const items = get().items
        let subtotalBase = 0
        let finalTotal = 0
        let totalCount = 0

        items.forEach(item => {
          totalCount += item.quantity
          const tiers = item.price_tiers || []
          
          // Precio base (1 unidad)
          const baseTier = tiers.find(t => t.min_quantity === 1) || tiers[0]
          const basePriceUnit = baseTier ? baseTier.unit_price : 0
          subtotalBase += basePriceUnit * item.quantity

          // Buscar la mejor escala según la cantidad acumulada
          const sortedTiers = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity)
          const applicableTier = sortedTiers.find(t => item.quantity >= t.min_quantity) || baseTier
          const actualPriceUnit = applicableTier ? applicableTier.unit_price : basePriceUnit

          finalTotal += actualPriceUnit * item.quantity
        })

        const totalDiscount = subtotalBase - finalTotal

        return {
          subtotalBase,
          totalDiscount: totalDiscount > 0 ? totalDiscount : 0,
          finalTotal,
          totalCount
        }
      },

      getTotalAmount: () => {
        return get().getCalculatedTotals().finalTotal
      },

      getTotalSavings: () => {
        return get().getCalculatedTotals().totalDiscount
      }
    }),
    {
      name: 'bicarbonato-peru-cart',
      storage: createJSONStorage(() => localStorage)
    }
  )
)