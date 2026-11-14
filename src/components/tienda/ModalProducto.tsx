'use client'

import React, { useState, useEffect } from 'react'
import { useProductModalStore } from '@/store/useProductModalStore'
import { useCartStore, calculateUnitPrice } from '@/store/useCartStore'
import { X, Plus, Minus, ShoppingBag, ShieldCheck, Sparkles, Check } from 'lucide-react'

export function ModalProducto() {
  const { selectedProduct, isOpen, closeModal } = useProductModalStore()
  const addItem = useCartStore((state) => state.addItem)
  const [quantity, setQuantity] = useState(1)
  const [addedAnimation, setAddedAnimation] = useState(false)

  // Permitir cerrar con la tecla Escape en PC
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeModal])

  const handleClose = () => {
    setQuantity(1)
    setAddedAnimation(false)
    closeModal()
  }

  if (!isOpen || !selectedProduct) return null

  const tiers = selectedProduct.price_tiers || []
  const unitPrice = calculateUnitPrice(tiers, quantity)
  const subtotal = unitPrice * quantity

  // Detectar si tiene descuento por volumen
  const sortedTiers = [...tiers].sort((a: any, b: any) => a.min_quantity - b.min_quantity)
  const promoTiers = sortedTiers.filter((t: any) => t.min_quantity > 1)

  const handleAddToCart = () => {
    addItem(selectedProduct, quantity)
    setAddedAnimation(true)
    setTimeout(() => {
      handleClose()
    }, 700)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={selectedProduct.name}
    >
      {/* Fondo oscuro para cerrar al tocar afuera */}
      <div className="fixed inset-0" onClick={handleClose} />

      {/* Tarjeta Flotante (Bottom Sheet en Celular / Modal en Desktop) */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-[110] max-h-[88dvh] flex flex-col animate-in slide-in-from-bottom duration-200">
        
        {/* Cabecera fija con botón de cerrar grande y visible */}
        <div className="shrink-0 bg-white px-5 py-3.5 border-b border-gray-200 flex items-center justify-between gap-3">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#1B2A82] bg-blue-50 px-2.5 py-1 rounded-lg truncate">
            {selectedProduct.presentation || 'Detalle del Producto'}
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-gray-800 border border-slate-200 text-xs font-extrabold transition-colors"
            aria-label="Cerrar ventana"
          >
            <span>Cerrar</span>
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Contenido con scroll interno */}
        <div className="overflow-y-auto p-5 space-y-5 flex-1">
          {/* FOTOGRAFÍA EN ALTA DEFINICIÓN (Sin recortar ni distorsionar) */}
          <div className="w-full aspect-square sm:aspect-video max-h-64 bg-gradient-to-b from-slate-50 to-white rounded-2xl p-4 border border-slate-100 flex items-center justify-center relative overflow-hidden">
            {selectedProduct.image_url ? (
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.name}
                className="max-h-full max-w-full object-contain filter drop-shadow-md"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-300">
                <ShoppingBag className="w-14 h-14 stroke-1" />
                <span className="text-xs font-semibold">Foto referencial no disponible</span>
              </div>
            )}
            
            {promoTiers.length > 0 && (
              <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Precios x Mayor</span>
              </div>
            )}
          </div>

          {/* INFORMACIÓN DEL PRODUCTO */}
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug">
              {selectedProduct.name}
            </h2>
            
            {selectedProduct.description ? (
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {selectedProduct.description}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">
                Producto garantizado de alta calidad para limpieza y desinfección profunda.
              </p>
            )}
          </div>

          {/* ESCALAS DE PRECIO POR VOLUMEN */}
          {promoTiers.length > 0 && (
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2">
              <span className="text-[11px] font-black text-emerald-950 uppercase tracking-wide block">
                Ahorra comprando por cantidad:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-gray-500 font-bold block">1 Unidad</span>
                  <span className="font-extrabold text-gray-900">
                    S/ {calculateUnitPrice(tiers, 1).toFixed(2)} c/u
                  </span>
                </div>
                {promoTiers.map((t: any) => (
                  <div key={t.id || t.min_quantity} className="bg-emerald-600 text-white p-2 rounded-xl shadow-xs">
                    <span className="text-[10px] text-emerald-100 font-bold block">Desde {t.min_quantity} unidades</span>
                    <span className="font-black text-sm">
                      S/ {Number(t.unit_price).toFixed(2)} c/u
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BENEFICIOS RÁPIDOS */}
          <div className="flex items-center gap-4 text-[11px] text-gray-500 font-semibold pt-1 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#1B2A82]" />
              <span>Garantía de Fábrica</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Atención Directa WhatsApp</span>
            </div>
          </div>
        </div>

        {/* PIE DE ACCIÓN FIJO (SELECTOR DE CANTIDAD Y BOTONES) */}
        <div className="shrink-0 bg-white border-t border-gray-200 p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Total a pagar:</span>
              <span className="text-xl font-black text-[#1B2A82]">
                S/ {subtotal.toFixed(2)}
              </span>
              {quantity > 1 && (
                <span className="text-[11px] text-emerald-700 font-bold ml-1.5">
                  (S/ {unitPrice.toFixed(2)} c/u)
                </span>
              )}
            </div>

            {/* Selector de cantidad */}
            <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="w-8 h-8 rounded-lg bg-white text-gray-800 flex items-center justify-center font-black shadow-xs active:scale-95 transition-transform"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center text-sm font-extrabold text-gray-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="w-8 h-8 rounded-lg bg-[#1B2A82] text-white flex items-center justify-center font-black shadow-xs active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="h-12 px-4 rounded-2xl font-extrabold text-xs text-gray-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shrink-0"
            >
              Seguir viendo
            </button>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addedAnimation}
              className={`flex-1 h-12 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 ${
                addedAnimation
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#1B2A82] hover:bg-[#142066] text-white'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>¡Agregado al carrito!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Agregar al Carrito</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}