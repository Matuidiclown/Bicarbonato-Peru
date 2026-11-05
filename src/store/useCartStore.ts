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

interface CartTotals {
  subtotalBase: number
  totalDiscount: number
  finalTotal: number
  totalCount: number
}

interface CartStore {
  items: CartItem[]
  referralCode: string | null
  setReferralCode: (code: string) => void
  addItem: (product: any, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getCalculatedTotals: () => CartTotals
  getTotalAmount: () => number
  getTotalSavings: () => number
  getTotalItemsCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      referralCode: null,

      // Guarda el código de la vendedora en minúsculas y sin espacios
      setReferralCode: (code: string) => {
        set({ referralCode: code.toLowerCase().trim() })
      },

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
          
          // Precio base para 1 unidad
          const baseTier = tiers.find(t => t.min_quantity === 1) || tiers[0]
          const basePriceUnit = baseTier ? Number(baseTier.unit_price) : 0
          subtotalBase += basePriceUnit * item.quantity

          // Escala aplicable según volumen acumulado
          const sortedTiers = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity)
          const applicableTier = sortedTiers.find(t => item.quantity >= t.min_quantity) || baseTier
          const actualPriceUnit = applicableTier ? Number(applicableTier.unit_price) : basePriceUnit

          finalTotal += actualPriceUnit * item.quantity
        })

        const totalDiscount = Math.max(0, subtotalBase - finalTotal)

        return {
          subtotalBase,
          totalDiscount,
          finalTotal,
          totalCount
        }
      },

      getTotalAmount: () => {
        return get().getCalculatedTotals().finalTotal
      },

      getTotalSavings: () => {
        return get().getCalculatedTotals().totalDiscount
      },

      getTotalItemsCount: () => {
        return get().getCalculatedTotals().totalCount
      }
    }),
    {
      name: 'bicarbonato-peru-cart',
      storage: createJSONStorage(() => localStorage)
    }
  )
)