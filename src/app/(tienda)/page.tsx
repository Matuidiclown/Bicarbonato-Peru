'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/useCartStore'
import { Header } from '@/components/Header'
import {
  ShoppingBag,
  Plus,
  Minus,
  Sparkles,
  Package,
  ArrowRight,
  ShieldCheck,
  Truck
} from 'lucide-react'

export default function TiendaPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const items = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)

  const { finalTotal, totalDiscount, totalCount } = useMemo(() => {
    let subtotalBase = 0
    let total = 0
    let count = 0

    items.forEach((item) => {
      count += item.quantity
      const tiers = item.price_tiers || []
      const baseTier = tiers.find((t: any) => t.min_quantity === 1) || tiers[0]
      const basePriceUnit = baseTier ? Number(baseTier.unit_price) : 0
      subtotalBase += basePriceUnit * item.quantity

      const sortedTiers = [...tiers].sort((a: any, b: any) => b.min_quantity - a.min_quantity)
      const applicableTier = sortedTiers.find((t: any) => item.quantity >= t.min_quantity) || baseTier
      const actualPriceUnit = applicableTier ? Number(applicableTier.unit_price) : basePriceUnit

      total += actualPriceUnit * item.quantity
    })

    const discount = Math.max(0, subtotalBase - total)

    return {
      finalTotal: total,
      totalDiscount: discount,
      totalCount: count
    }
  }, [items])

  useEffect(() => {
    async function loadCatalog() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*, price_tiers(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setProducts(data)
      }
      setIsLoading(false)
    }

    loadCatalog()
  }, [])

  const packProducts = products.filter(
    (p) => p.category === 'packs' || p.name.toLowerCase().includes('pack') || p.name.toLowerCase().includes('kit')
  )
  const regularProducts = products.filter(
    (p) => p.category !== 'packs' && !p.name.toLowerCase().includes('pack') && !p.name.toLowerCase().includes('kit')
  )

  const getItemQuantityInCart = (productId: string) => {
    const item = items.find((i) => i.id === productId)
    return item ? item.quantity : 0
  }

  const ProductCard = ({ product }: { product: any }) => {
    const qty = getItemQuantityInCart(product.id)
    const tiers = product.price_tiers || []
    const baseTier = tiers.find((t: any) => t.min_quantity === 1) || tiers[0]
    const basePrice = baseTier ? Number(baseTier.unit_price) : 0

    const sortedTiers = [...tiers].sort((a: any, b: any) => b.min_quantity - a.min_quantity)
    const bestTier = sortedTiers.find((t: any) => t.min_quantity > 1)

    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md transition-shadow w-full min-w-0">
        <div className="min-w-0">
          {/* Imagen y Badge */}
          <div className="relative aspect-square w-full bg-slate-50 flex items-center justify-center p-2.5 sm:p-3 overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
                loading="lazy"
              />
            ) : (
              <ShoppingBag className="w-8 h-8 text-gray-300" />
            )}

            {bestTier && (
              <div className="absolute top-2 left-2 bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded-md shadow-sm">
                Lleva {bestTier.min_quantity}+ a S/ {Number(bestTier.unit_price).toFixed(2)}
              </div>
            )}
          </div>

          {/* Información */}
          <div className="p-2.5 sm:p-3 space-y-1 min-w-0">
            <span className="text-[10px] font-black text-[#1B2A82] uppercase block truncate">
              {product.presentation || 'Limpieza'}
            </span>
            <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">
              {product.name}
            </h3>

            <div className="pt-1 flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-black text-gray-900">
                S/ {basePrice.toFixed(2)}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold">c/u</span>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="p-2.5 sm:p-3 pt-0">
          {qty === 0 ? (
            <button
              onClick={() => addItem(product, 1)}
              className="w-full h-8 sm:h-9 bg-[#1B2A82] hover:bg-[#142066] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar</span>
            </button>
          ) : (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-1">
              <button
                onClick={() => updateQuantity(product.id, qty - 1)}
                className="w-7 h-7 bg-white text-gray-800 rounded-lg flex items-center justify-center font-black shadow-sm active:scale-90 transition-transform"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-black text-[#1B2A82]">{qty}</span>
              <button
                onClick={() => updateQuantity(product.id, qty + 1)}
                className="w-7 h-7 bg-[#1B2A82] text-white rounded-lg flex items-center justify-center font-black shadow-sm active:scale-90 transition-transform"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-24 w-full max-w-full overflow-x-hidden">
      <Header />

      <main className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-5 space-y-7 flex-1 min-w-0">
        {/* Banner de Bienvenida */}
        <div className="bg-gradient-to-r from-[#1B2A82] to-[#142066] text-white p-4 sm:p-5 rounded-3xl shadow-md space-y-2 w-full min-w-0">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase">
              Precios por Mayor y Menor
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black leading-tight">
            Insumos y Productos de Limpieza en Lima
          </h1>
          <p className="text-xs text-blue-100 font-medium">
            Descuentos directos por volumen en tu pedido. Coordinación y entrega a domicilio.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-[11px] text-blue-200 font-bold border-t border-blue-800/60">
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-amber-300" /> Despacho en Lima
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Pago Contra Entrega
            </span>
          </div>
        </div>

        {/* Sección: Packs y Combos */}
        {packProducts.length > 0 && (
          <section className="space-y-3 w-full min-w-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#1B2A82]" />
                <span>Packs y Combos Ahorro</span>
              </h2>
              <Link href="/categoria/packs" className="text-xs font-black text-[#1B2A82] hover:underline">
                Ver todos →
              </Link>
            </div>

            {/* CARRUSEL QUE HACE SCROLL DENTRO DE SÍ MISMO SIN ESTIRAR LA PÁGINA */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory w-full min-w-0 touch-pan-x">
              {packProducts.map((p) => (
                <div key={p.id} className="w-[155px] sm:w-[190px] shrink-0 snap-start">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sección: Grilla Móvil (2 Columnas reales por pantalla) */}
        <section className="space-y-3 w-full min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Productos Disponibles</span>
            </h2>
            <span className="text-xs text-gray-400 font-bold">
              {regularProducts.length} productos
            </span>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-xs font-bold text-gray-400">
              Cargando catálogo...
            </div>
          ) : regularProducts.length === 0 ? (
            <div className="py-12 bg-white rounded-2xl text-center text-xs font-semibold text-gray-500 border border-gray-200">
              No se encontraron productos disponibles por el momento.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full min-w-0">
              {regularProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Sticky Bottom Bar */}
      {totalCount > 0 && (
        <aside
          aria-label="Resumen de compra y acceso al carrito"
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl p-3 z-50 animate-in slide-in-from-bottom-3 duration-200"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="leading-tight">
              <span className="text-[11px] font-bold text-gray-500 block">
                {totalCount} {totalCount === 1 ? 'producto' : 'productos'} en carrito
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-gray-900">
                  Total: S/ {finalTotal.toFixed(2)}
                </span>
                {totalDiscount > 0 && (
                  <span className="text-[10px] font-extrabold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md">
                    -S/ {totalDiscount.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <Link
              href="/carrito"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all"
            >
              <span>Ver Carrito</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </aside>
      )}
    </div>
  )
}