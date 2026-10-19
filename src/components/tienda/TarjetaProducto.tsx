'use client'

import React from 'react'
import { Product } from '@/types'
import { useCartStore, calculateUnitPrice } from '@/store/useCartStore'
import { ShoppingBag, Plus, Minus, Check } from 'lucide-react'

interface Props {
  product: Product
}

export function TarjetaProducto({ product }: Props) {
  const { items, addItem, updateQuantity } = useCartStore()

  // Buscar si el producto ya está en el carrito
  const cartItem = items.find(i => i.product.id === product.id)
  const currentQuantity = cartItem ? cartItem.quantity : 0

  // Precio base (1 unidad) y mejor precio promocional
  const basePrice = calculateUnitPrice(product.price_tiers, 1)
  
  // Encontrar la mejor oferta posible (mayor min_quantity)
  const bestTier = [...product.price_tiers].sort((a, b) => b.min_quantity - a.min_quantity)[0]
  const hasPromo = bestTier && bestTier.min_quantity > 1

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        {/* Imagen y Badges */}
        <div className="relative aspect-square bg-gray-50 flex items-center justify-center p-4">
          <img
            src={product.image_url || 'https://via.placeholder.com/300x300?text=Producto+Limpieza'}
            alt={product.name}
            className="object-contain max-h-full max-w-full"
          />
          
          {hasPromo && (
            <span className="absolute top-3 left-3 bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-sm">
              Lleva {bestTier.min_quantity} a S/ {bestTier.unit_price.toFixed(2)} c/u
            </span>
          )}
        </div>

        {/* Detalles del Producto */}
        <div className="p-4">
          <div className="text-xs font-semibold text-emerald-700 tracking-wide uppercase mb-1">
            {product.presentation}
          </div>
          <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2">
            {product.name}
          </h3>

          {/* Precios y Escalas */}
          <div className="bg-emerald-50/60 p-3 rounded-xl mb-4 border border-emerald-100">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs text-gray-600 font-medium">Precio normal (1 ud):</span>
              <span className="text-base font-bold text-gray-900">S/ {basePrice.toFixed(2)}</span>
            </div>

            {/* Listado de escalas */}
            {product.price_tiers.length > 1 && (
              <div className="space-y-1 mt-2 pt-2 border-t border-emerald-200/50">
                {product.price_tiers
                  .filter(t => t.min_quantity > 1)
                  .map((tier, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-emerald-900">
                      <span>Desde {tier.min_quantity} unidades:</span>
                      <span className="font-bold">S/ {tier.unit_price.toFixed(2)} c/u</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botones de Acción (Grandes y Táctiles) */}
      <div className="p-4 pt-0">
        {currentQuantity === 0 ? (
          <button
            onClick={() => addItem(product, 1)}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-base transition-colors shadow-sm"
          >
            <ShoppingBag className="w-5 h-5" />
            Agregar al carrito
          </button>
        ) : (
          <div className="flex items-center justify-between bg-gray-100 rounded-xl p-1.5 border border-gray-200">
            <button
              onClick={() => updateQuantity(product.id, currentQuantity - 1)}
              className="w-10 h-10 bg-white hover:bg-gray-200 text-gray-800 font-bold rounded-lg flex items-center justify-center shadow-sm text-lg active:scale-95 transition-transform"
              aria-label="Disminuir cantidad"
            >
              <Minus className="w-5 h-5" />
            </button>

            <div className="text-center">
              <span className="block text-xs text-gray-500 font-medium">En el carrito</span>
              <span className="text-base font-extrabold text-emerald-700">{currentQuantity} ud</span>
            </div>

            <button
              onClick={() => updateQuantity(product.id, currentQuantity + 1)}
              className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center shadow-sm text-lg active:scale-95 transition-transform"
              aria-label="Aumentar cantidad"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
