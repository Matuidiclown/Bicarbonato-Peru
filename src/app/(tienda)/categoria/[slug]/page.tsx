'use client'

import React, { Suspense, useEffect, useState, useMemo } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCartStore, calculateUnitPrice } from '@/store/useCartStore'
import { Header, CATALOG_CATEGORIES } from '@/components/Header'
import {
  ShoppingBag,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react'

function CategoriaContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const slug = (params?.slug as string) || ''
  const subcategoryParam = searchParams.get('sub')

  const categoryInfo = CATALOG_CATEGORIES.find((c) => c.slug === slug)

  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(subcategoryParam)

  const items = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)

  // Cálculo de totales derivado para la barra flotante
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
    async function loadCategoryProducts() {
      if (!slug) return
      setIsLoading(true)

      let query = supabase
        .from('products')
        .select('*, price_tiers(*)')
        .eq('is_active', true)

      if (slug === 'packs') {
        query = query.or('category.eq.packs,name.ilike.%pack%,name.ilike.%kit%')
      } else {
        query = query.ilike('category', `%${slug}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (!error && data) {
        setProducts(data)
      } else {
        setProducts([])
      }
      setIsLoading(false)
    }

    loadCategoryProducts()
  }, [slug, supabase])

  // Filtro de subcategorías
  const filteredProducts = selectedSubcategory
    ? products.filter((p) => p.subcategory?.toLowerCase() === selectedSubcategory.toLowerCase())
    : products

  const getItemQuantityInCart = (productId: string) => {
    const item = items.find((i) => i.id === productId)
    return item ? item.quantity : 0
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-24 w-full max-w-full overflow-x-hidden">
      <Header activeCategory={slug} />

      <main className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-5 space-y-6 flex-1 min-w-0">
        {/* NAVEGACIÓN Y TÍTULO */}
        <div className="space-y-3">
          <Link
            href="/"
            className="text-xs font-extrabold text-[#1B2A82] hover:underline flex items-center gap-1.5 self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Portada</span>
          </Link>

          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{categoryInfo?.emoji || '🧼'}</span>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
                  {categoryInfo?.label || 'Categoría de Limpieza'}
                </h1>
                <p className="text-xs text-gray-500 font-semibold">
                  Precios por mayor y menor con escala automática
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-gray-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-gray-100 self-start sm:self-auto">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>
        </div>

        {/* FILTROS DE SUBCATEGORÍA (PILLS) */}
        {categoryInfo?.subcategories && categoryInfo.subcategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
            <button
              onClick={() => setSelectedSubcategory(null)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                selectedSubcategory === null
                  ? 'bg-[#1B2A82] text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-slate-50'
              }`}
            >
              Todos
            </button>
            {categoryInfo.subcategories.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubcategory(sub)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  selectedSubcategory === sub
                    ? 'bg-[#1B2A82] text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-slate-50'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* GRILLA DE PRODUCTOS (2 COLUMNAS EN CELULAR) */}
        {isLoading ? (
          <div className="py-20 text-center text-xs font-bold text-gray-400">
            Cargando catálogo de {categoryInfo?.label || 'productos'}...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 bg-white rounded-3xl text-center text-xs font-semibold text-gray-500 border border-gray-200 p-8 space-y-2">
            <p className="font-bold text-gray-700">No hay productos disponibles en esta sección por el momento.</p>
            <p>Revisa otras categorías o regresa a ver nuestras ofertas principales.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full min-w-0">
            {filteredProducts.map((product) => {
              const qty = getItemQuantityInCart(product.id)
              const tiers = product.price_tiers || []
              const basePrice = calculateUnitPrice(tiers, 1)

              const sortedTiers = [...tiers].sort((a: any, b: any) => b.min_quantity - a.min_quantity)
              const bestTier = sortedTiers.find((t: any) => t.min_quantity > 1)

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md transition-shadow w-full min-w-0"
                >
                  <div className="min-w-0">
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
            })}
          </div>
        )}
      </main>

      {/* STICKY BOTTOM BAR */}
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

export default function CategoriaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
          <div className="text-xs font-bold text-gray-400">Cargando categoría...</div>
        </div>
      }
    >
      <CategoriaContent />
    </Suspense>
  )
}