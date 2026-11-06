'use client'

import React from 'react'
import { useCartStore, calculateUnitPrice } from '@/store/useCartStore'
import { ShoppingBag, Plus, Minus } from 'lucide-react'

interface Props {
  product: any
}

export function TarjetaProducto({ product }: Props) {
  const items = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)

  // Búsqueda en la estructura plana del carrito
  const cartItem = items.find((i) => i.id === product.id)
  const currentQuantity = cartItem ? cartItem.quantity : 0

  // Precio base y ofertas
  const tiers = product.price_tiers || []
  const basePrice = calculateUnitPrice(tiers, 1)

  const sortedTiers = [...tiers].sort((a: any, b: any) => b.min_quantity - a.min_quantity)
  const bestTier = sortedTiers.find((t: any) => t.min_quantity > 1)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        {/* Imagen y Badge */}
        <div className="relative aspect-square bg-slate-50 flex items-center justify-center p-4 overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="object-contain max-h-full max-w-full"
              loading="lazy"
            />
          ) : (
            <ShoppingBag className="w-8 h-8 text-gray-300" />
          )}

          {bestTier && (
            <span className="absolute top-2.5 left-2.5 bg-red-600 text-white font-black text-[10px] px-2.5 py-1 rounded-md shadow-sm">
              Lleva {bestTier.min_quantity}+ a S/ {Number(bestTier.unit_price).toFixed(2)} c/u
            </span>
          )}
        </div>

        {/* Detalles del Producto */}
        <div className="p-4 space-y-1">
          <span className="text-[10px] font-black text-[#1B2A82] uppercase tracking-wider block">
            {product.presentation || 'Limpieza'}
          </span>
          <h3 className="text-sm font-extrabold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          <div className="pt-2 flex items-baseline gap-1.5">
            <span className="text-base font-black text-gray-900">
              S/ {basePrice.toFixed(2)}
            </span>
            <span className="text-xs text-gray-400 font-semibold">c/u</span>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="p-4 pt-0">
        {currentQuantity === 0 ? (
          <button
            onClick={() => addItem(product, 1)}
            className="w-full h-10 bg-[#1B2A82] hover:bg-[#142066] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        ) : (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-1">
            <button
              onClick={() => updateQuantity(product.id, currentQuantity - 1)}
              className="w-8 h-8 bg-white text-gray-800 rounded-lg flex items-center justify-center font-black shadow-sm active:scale-90 transition-transform"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-black text-[#1B2A82]">{currentQuantity}</span>
            <button
              onClick={() => updateQuantity(product.id, currentQuantity + 1)}
              className="w-8 h-8 bg-[#1B2A82] text-white rounded-lg flex items-center justify-center font-black shadow-sm active:scale-90 transition-transform"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}