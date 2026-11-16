'use client'

import React, { Suspense, useEffect, useState, useMemo } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/useCartStore'
import { useProductModalStore } from '@/store/useProductModalStore'
import { Header, CATALOG_CATEGORIES } from '@/components/Header'
import {
  ShoppingBag,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  Layers,
  Tag,
  Eye,
  Gift
} from 'lucide-react'

const FREE_SHIPPING_THRESHOLD = 85.0

function CategoriaContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const slug = (params?.slug as string) || ''
  const subcategoryParam = searchParams.get('sub')

  const categoryInfo = CATALOG_CATEGORIES.find((c) => c.slug === slug) || {
    id: slug,
    slug,
    label: slug ? slug.replace(/-/g, ' ').toUpperCase() : 'Categoría',
    emoji: '✨',
    subcategories: []
  }

  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(subcategoryParam)

  // Carrito Zustand
  const items = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)

  // Modal Flotante de Vista Previa (idéntico a la página principal)
  const openModal = useProductModalStore((state) => state.openModal)

  // Sincronizar subcategoría si cambia la URL (?sub=...)
  useEffect(() => {
    setSelectedSubcategory(subcategoryParam)
  }, [subcategoryParam])

  // Cálculos reactivos para la barra inferior flotante
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

  const isFreeShipping = finalTotal >= FREE_SHIPPING_THRESHOLD
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - finalTotal)

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

      const { data, error } = await query
        .order('featured_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (!error && data) {
        setProducts(data)
      } else {
        setProducts([])
      }
      setIsLoading(false)
    }

    loadCategoryProducts()
  }, [slug, supabase])

  const filteredProducts = selectedSubcategory
    ? products.filter((p) => p.subcategory?.toLowerCase() === selectedSubcategory.toLowerCase())
    : products

  const getItemQuantityInCart = (productId: string) => {
    const item = items.find((i) => i.id === productId)
    return item ? item.quantity : 0
  }

  const handleSelectSubcategory = (sub: string | null) => {
    setSelectedSubcategory(sub)
    if (sub) {
      router.push(`/categoria/${slug}?sub=${encodeURIComponent(sub)}`, { scroll: false })
    } else {
      router.push(`/categoria/${slug}`, { scroll: false })
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-24 w-full max-w-full overflow-x-clip">
      <Header activeCategory={slug} />

      <main className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-5 space-y-6 flex-1 min-w-0">
        {/* Volver al inicio */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1B2A82] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la Portada</span>
        </Link>

        {/* Cabecera de la Categoría */}
        <div className="bg-gradient-to-r from-[#1B2A82] to-[#142066] text-white p-5 rounded-3xl shadow-md space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-blue-200">
              <Layers className="w-3.5 h-3.5" />
              <span>Sección de Catálogo</span>
            </span>

            <span className="bg-red-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-sm">
              <Gift className="w-3 h-3" />
              <span>Envío GRATIS desde S/ 85</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2">
            <span>{categoryInfo.emoji}</span>
            <span>{categoryInfo.label}</span>
          </h1>
          <p className="text-xs text-blue-100 font-medium">
            Toca cualquier producto para ver su descripción detallada, foto ampliada y descuentos por volumen.
          </p>
        </div>

        {/* Filtro de Subcategorías */}
        {categoryInfo.subcategories.length > 0 && (
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 shadow-sm space-y-2.5">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#1B2A82]" />
              <span>Filtrar por tipo de producto:</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleSelectSubcategory(null)}
                className={`text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition-all ${
                  !selectedSubcategory
                    ? 'bg-[#1B2A82] text-white shadow-sm'
                    : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
                }`}
              >
                Todos ({products.length})
              </button>
              {categoryInfo.subcategories.map((sub) => (
                <button
                  type="button"
                  key={sub}
                  onClick={() => handleSelectSubcategory(sub)}
                  className={`text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition-all ${
                    selectedSubcategory?.toLowerCase() === sub.toLowerCase()
                      ? 'bg-[#1B2A82] text-white shadow-sm'
                      : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grilla de Productos con Vista Previa (Modal) */}
        <section className="space-y-3 w-full min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-black text-gray-900">
              {selectedSubcategory ? selectedSubcategory : `Catálogo: ${categoryInfo.label}`}
            </h2>
            <span className="text-xs text-gray-400 font-bold">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-xs font-bold text-gray-400">
              Cargando productos...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 bg-white rounded-2xl text-center text-xs font-semibold text-gray-500 border border-gray-200 space-y-2">
              <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto" />
              <p>No hay productos disponibles en esta sección por el momento.</p>
              {selectedSubcategory && (
                <button
                  type="button"
                  onClick={() => handleSelectSubcategory(null)}
                  className="text-xs font-extrabold text-[#1B2A82] hover:underline"
                >
                  Ver todos los productos de {categoryInfo.label}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full min-w-0">
              {filteredProducts.map((product) => {
                const qty = getItemQuantityInCart(product.id)
                const tiers = product.price_tiers || []
                const baseTier = tiers.find((t: any) => t.min_quantity === 1) || tiers[0]
                const basePrice = baseTier ? Number(baseTier.unit_price) : 0

                const sortedTiers = [...tiers].sort((a: any, b: any) => b.min_quantity - a.min_quantity)
                const bestTier = sortedTiers.find((t: any) => t.min_quantity > 1)

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md transition-shadow w-full min-w-0 group"
                  >
                    {/* Zona Táctil para abrir el Modal de Vista Previa */}
                    <div
                      onClick={() => openModal(product)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openModal(product)
                        }
                      }}
                      className="cursor-pointer select-none touch-pan-y"
                      role="button"
                      tabIndex={0}
                    >
                      {/* Imagen y Badge */}
                      <div className="relative aspect-square w-full bg-slate-50 flex items-center justify-center p-2.5 sm:p-3 overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            draggable={false}
                            className="max-h-full max-w-full object-contain pointer-events-none group-hover:scale-105 transition-transform duration-200"
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

                        <span className="absolute bottom-2 right-2 bg-slate-900/60 text-white p-1 rounded-md opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      {/* Información del Producto */}
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

                    {/* Botones de Acción (Carrito rápido) */}
                    <div className="p-2.5 sm:p-3 pt-0">
                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            addItem(product, 1)
                          }}
                          className="w-full h-8 sm:h-9 bg-[#1B2A82] hover:bg-[#142066] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateQuantity(product.id, qty - 1)
                            }}
                            className="w-7 h-7 bg-white text-gray-800 rounded-lg flex items-center justify-center font-black shadow-sm active:scale-90 transition-transform"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-[#1B2A82]">{qty}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateQuantity(product.id, qty + 1)
                            }}
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
        </section>
      </main>

      {/* Barra Flotante Inferior de Pre-cuenta */}
      {totalCount > 0 && (
        <aside
          aria-label="Resumen de compra y acceso al carrito"
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl p-3 z-30 animate-in slide-in-from-bottom-3 duration-200"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="leading-tight">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-500">
                  {totalCount} {totalCount === 1 ? 'producto' : 'productos'}
                </span>
                {isFreeShipping ? (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                    ¡Envío GRATIS!
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[#1B2A82] bg-blue-50 px-1.5 py-0.5 rounded-md">
                    Faltan S/ {remainingForFreeShipping.toFixed(2)} p/ envío gratis
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-base font-black text-gray-900">
                  Subtotal: S/ {finalTotal.toFixed(2)}
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all shrink-0"
            >
              <span>Ver Pre-cuenta</span>
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
        <div className="min-h-screen bg-slate-100 flex items-center justify-center text-xs font-bold text-gray-500">
          Cargando sección...
        </div>
      }
    >
      <CategoriaContent />
    </Suspense>
  )
}