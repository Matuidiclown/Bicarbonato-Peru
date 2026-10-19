'use client'

import React from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/useCartStore'
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, Tag, ShieldCheck } from 'lucide-react'

export function CartSidebar() {
  const { items, updateQuantity, removeItem, getCalculatedTotals } = useCartStore()
  const { subtotalBase, totalDiscount, finalTotal, totalCount } = getCalculatedTotals()

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4 text-center sticky top-24">
        <div className="w-12 h-12 bg-blue-50 text-[#1B2A82] rounded-2xl flex items-center justify-center mx-auto">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-black text-sm text-gray-900 uppercase">Pre-Cuenta de Compra</h3>
          <p className="text-xs text-gray-500 font-medium">
            Tu carrito está vacío. Agrega productos para ver tus descuentos por cantidad en vivo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-md border border-blue-100 space-y-5 sticky top-20">
      {/* CABECERA PRE-CUENTA */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#1B2A82] text-white flex items-center justify-center font-black text-xs">
            {totalCount}
          </div>
          <div>
            <h3 className="font-black text-sm text-gray-900 uppercase tracking-tight">Pre-Cuenta</h3>
            <p className="text-[10px] font-bold text-gray-400">Resumen de tu pedido</p>
          </div>
        </div>

        <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase">
          En Vivo
        </span>
      </div>

      {/* LISTA COMPACTA DE PRODUCTOS Y CONTROLADORES DE CANTIDAD */}
      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
        {items.map(item => {
          const tiers = item.price_tiers || []
          const baseTier = tiers.find(t => t.min_quantity === 1) || tiers[0]
          const basePriceUnit = baseTier ? baseTier.unit_price : 0

          const sortedTiers = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity)
          const applicableTier = sortedTiers.find(t => item.quantity >= t.min_quantity) || baseTier
          const actualPriceUnit = applicableTier ? applicableTier.unit_price : basePriceUnit

          const hasDiscount = actualPriceUnit < basePriceUnit

          return (
            <div key={item.id} className="bg-slate-50 p-3 rounded-2xl border border-gray-100 flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl p-1 border border-gray-100 flex items-center justify-center shrink-0">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <ShoppingBag className="w-5 h-5 text-gray-300" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-gray-900 truncate">{item.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-black text-gray-900">
                    S/ {(actualPriceUnit * item.quantity).toFixed(2)}
                  </span>
                  {hasDiscount && (
                    <span className="text-[9px] font-bold text-red-600 line-through">
                      S/ {(basePriceUnit * item.quantity).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* SELECTOR DE CANTIDAD COMPACTO */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shrink-0">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center transition-colors"
                >
                  {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3" />}
                </button>
                <span className="w-5 text-center text-xs font-black text-gray-900">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-6 h-6 rounded-lg bg-[#1B2A82] text-white flex items-center justify-center transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* DESGLOSE DE PRECIOS Y DESCUENTO EN ROJO */}
      <div className="bg-slate-50 p-3.5 rounded-2xl border border-gray-200 space-y-2 text-xs font-semibold">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal Base:</span>
          <span>S/ {subtotalBase.toFixed(2)}</span>
        </div>

        {totalDiscount > 0 ? (
          <div className="flex justify-between items-center text-red-600 font-black bg-red-50 p-2 rounded-xl border border-red-100">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-red-500" />
              <span>Descuento por Volumen:</span>
            </span>
            <span>- S/ {totalDiscount.toFixed(2)}</span>
          </div>
        ) : (
          <p className="text-[10px] text-gray-400 font-medium italic">
            💡 Agrega más unidades del mismo producto para activar descuentos automáticos.
          </p>
        )}

        <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-black text-gray-900">
          <span>Total a Pagar:</span>
          <span className="text-[#1B2A82] text-base">S/ {finalTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* BOTÓN IR AL CARRITO / COMPLETAR PEDIDO */}
      <Link
        href="/carrito"
        className="w-full bg-[#1B2A82] hover:bg-[#142066] text-white font-extrabold rounded-2xl py-3.5 text-xs flex items-center justify-center gap-2 shadow-md transition-all"
      >
        <span>Ver Carrito Completo</span>
        <ArrowRight className="w-4 h-4" />
      </Link>

      <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 font-bold">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Pedido procesado directamente por WhatsApp</span>
      </div>
    </div>
  )
}