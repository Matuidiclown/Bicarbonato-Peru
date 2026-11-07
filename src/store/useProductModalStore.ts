import { create } from 'zustand'

interface ProductModalState {
  selectedProduct: any | null
  isOpen: boolean
  openModal: (product: any) => void
  closeModal: () => void
}

export const useProductModalStore = create<ProductModalState>((set) => ({
  selectedProduct: null,
  isOpen: false,
  openModal: (product) => set({ selectedProduct: product, isOpen: true }),
  closeModal: () => set({ selectedProduct: null, isOpen: false }),
}))