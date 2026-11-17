'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/useCartStore'
import { useProductModalStore } from '@/store/useProductModalStore'
import { Header, CATALOG_CATEGORIES } from '@/components/Header'
import {
  ShoppingBag,
  Plus,
  Minus,
  Sparkles,
  Package,
  ArrowRight,
  ShieldCheck,
  Truck,
  Eye,
  Gift,
  Flame,
  LayoutGrid,
  Shirt,
  Utensils,
  Droplets,
  SprayCan,
  Flower2,
  Brush,
  FlaskConical
} from 'lucide-react'

const FREE_SHIPPING_THRESHOLD = 85.0

// Identidad visual temática y amigable para cada categoría (sin repetir fotos de productos)
const CATEGORY_VISUAL_THEMES: Record<
  string,
  {
    bgGradient: string
    iconBg: string
    iconColor: string
    badgeBg: string
    badgeText: string
    Icon: React.ElementType
    subtitle: string
  }
> = {
  'nuevos-productos': {
    bgGradient: 'from-amber-50 via-orange-50/70 to-amber-100/50',
    iconBg: 'bg-amber-400 text-slate-950 shadow-amber-200',
    iconColor: 'text-slate-950',
    badgeBg: 'bg-red-600',
    badgeText: 'text-white',
    Icon: Flame,
    subtitle: 'Últimos lanzamientos'
  },
  packs: {
    bgGradient: 'from-blue-50 via-indigo-50/80 to-sky-100/50',
    iconBg: 'bg-[#1B2A82] text-white shadow-blue-200',
    iconColor: 'text-white',
    badgeBg: 'bg-white/95 border border-blue-100',
    badgeText: 'text-[#1B2A82]',
    Icon: Gift,
    subtitle: 'Kits con precio especial'
  },
  'insumos-base': {
    bgGradient: 'from-sky-50 via-cyan-50/80 to-blue-100/40',
    iconBg: 'bg-sky-600 text-white shadow-sky-200',
    iconColor: 'text-white',
    badgeBg: 'bg-white/95 border border-sky-100',
    badgeText: 'text-sky-800',
    Icon: FlaskConical,
    subtitle: 'Bicarbonato, percarbonato y más'
  },
  lavanderia: {
    bgGradient: 'from-indigo-50 via-blue-50/80 to-violet-100/50',
    iconBg: 'bg-indigo-600 text-white shadow-indigo-200',
    iconColor: 'text-white',
    badgeBg: 'bg-white/95 border border-indigo-100',
    badgeText: 'text-indigo-800',
    Icon: Shirt,
    subtitle: 'Detergentes, suavizantes y ropa'
  },
  cocina: {
    bgGradient: 'from-emerald-50 via-teal-50/80 to-green-100/50',
    iconBg: 'bg-emerald-600 text-white shadow-emerald-200',
    iconColor: 'text-white',
    badgeBg: 'bg-white/95 border border-emerald-100',
    badgeText: 'text-emerald-800',
    Icon: Utensils,
    subtitle: 'Lavavajillas y desengrasantes'
  },
  'bano-pisos': {
    bgGradient: 'from-cyan-50 via-teal-50/70 to-sky-100/50',
    iconBg: 'bg-cyan-600 text-white shadow-cyan-200',
    iconColor: 'text-white',
    badgeBg: 'bg-white/95 border border-cyan-100',
    badgeText: 'text-cyan-800',
    Icon: Droplets,
    subtitle: 'Quita sarro y limpiapisos'
  },
  'vidrios-superficies': {
    bgGradient: 'from-violet-50 via-purple-50/70 to-indigo-100/50',
    iconBg: 'bg-violet-600 text-white shadow-violet-200',
    iconColor: 'text-white',
    badgeBg: 'bg-white/95 border border-violet-100',
    badgeText: 'text-violet-800',
    Icon: SprayCan,
    subtitle: 'Vidrios, tapices y mascotas'
  },
  aromatizadores: {
    bgGradient: 'from-rose-50 via-pink-50/80 to-fuchsia-100/40',
    iconBg: 'bg-rose-500 text-white shadow-rose-200',
    iconColor: 'text-white',
    badgeBg: 'bg-white/95 border border-rose-100',
    badgeText: 'text-rose-800',
    Icon: Flower2,
    subtitle: 'Fragancias duraderas para el hogar'
  },
  utensilios: {
    bgGradient: 'from-amber-50 via-yellow-50/70 to-orange-100/40',
    iconBg: 'bg-amber-500 text-white shadow-amber-200',
    iconColor: 'text-white',
    badgeBg: 'bg-white/95 border border-amber-100',
    badgeText: 'text-amber-800',
    Icon: Brush,
    subtitle: 'Esponjas, guantes y accesorios'
  }
}

export default function TiendaPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Carrito Zustand
  const items = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)

  // Modal Flotante de Detalle
  const openModal = useProductModalStore((state) => state.openModal)

  // Cálculos reactivos de compra
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
    async function loadCatalog() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*, price_tiers(*)')
        .eq('is_active', true)
        .order('featured_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (!error && data) {
        setProducts(data)
      }
      setIsLoading(false)
    }

    loadCatalog()
  }, [supabase])

  // Tarjetas de categorías con diseño gráfico limpio y conteo real de productos
  const visualCategories = useMemo(() => {
    return CATALOG_CATEGORIES.map((cat) => {
      const catProducts = products.filter((p) => {
        if (cat.slug === 'packs') {
          return (
            p.category === 'packs' ||
            p.name?.toLowerCase().includes('pack') ||
            p.name?.toLowerCase().includes('kit')
          )
        }
        return p.category?.toLowerCase().includes(cat.slug.toLowerCase())
      })

      const theme = CATEGORY_VISUAL_THEMES[cat.slug] || {
        bgGradient: 'from-slate-50 to-blue-50/60',
        iconBg: 'bg-[#1B2A82] text-white shadow-blue-200',
        iconColor: 'text-white',
        badgeBg: 'bg-white/95 border border-blue-100',
        badgeText: 'text-[#1B2A82]',
        Icon: Sparkles,
        subtitle: cat.subcategories.slice(0, 2).join(', ')
      }

      return {
        ...cat,
        count: catProducts.length,
        theme
      }
    }).filter((cat) => cat.slug !== 'nuevos-productos' || cat.count > 0)
  }, [products])

  // Productos destacados en portada
  const featuredProducts = useMemo(() => {
    const featured = products.filter((p) => p.is_featured)
    return featured.length > 0 ? featured : products
  }, [products])

  // 1. Nuevos Productos / Lanzamientos
  const newProducts = featuredProducts.filter((p) => p.category === 'nuevos-productos')

  // 2. Packs y Combos
  const packProducts = featuredProducts.filter(
    (p) =>
      p.category !== 'nuevos-productos' &&
      (p.category === 'packs' ||
        p.name.toLowerCase().includes('pack') ||
        p.name.toLowerCase().includes('kit'))
  )

  // 3. Productos Disponibles regulares
  const regularProducts = featuredProducts.filter(
    (p) =>
      p.category !== 'nuevos-productos' &&
      p.category !== 'packs' &&
      !p.name.toLowerCase().includes('pack') &&
      !p.name.toLowerCase().includes('kit')
  )

  const getItemQuantityInCart = (productId: string) => {
    const item = items.find((i) => i.id === productId)
    return item ? item.quantity : 0
  }

  const ProductCard = ({
    product,
    isHorizontalCarousel = false,
    isNewBadge = false
  }: {
    product: any
    isHorizontalCarousel?: boolean
    isNewBadge?: boolean
  }) => {
    const qty = getItemQuantityInCart(product.id)
    const tiers = product.price_tiers || []
    const baseTier = tiers.find((t: any) => t.min_quantity === 1) || tiers[0]
    const basePrice = baseTier ? Number(baseTier.unit_price) : 0

    const sortedTiers = [...tiers].sort((a: any, b: any) => b.min_quantity - a.min_quantity)
    const bestTier = sortedTiers.find((t: any) => t.min_quantity > 1)

    return (
      <div
        className={`bg-white rounded-2xl border shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md transition-shadow w-full min-w-0 group ${
          isNewBadge ? 'border-amber-300 ring-1 ring-amber-200/70' : 'border-gray-200/80'
        }`}
      >
        {/* Zona Táctil para abrir el detalle */}
        <div
          onClick={() => openModal(product)}
          className={`cursor-pointer select-none ${
            isHorizontalCarousel ? 'touch-auto' : 'touch-pan-y'
          }`}
          role="button"
          tabIndex={0}
        >
          {/* Imagen y Badges */}
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

            <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
              {isNewBadge && (
                <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-md shadow-sm uppercase">
                  ¡NUEVO!
                </span>
              )}
              {bestTier && (
                <span className="bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded-md shadow-sm">
                  Lleva {bestTier.min_quantity}+ a S/ {Number(bestTier.unit_price).toFixed(2)}
                </span>
              )}
            </div>

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
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-24 w-full max-w-full overflow-x-clip">
      <Header />

      <main className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-5 space-y-7 flex-1 min-w-0">
        {/* Banner de Bienvenida + Envío Gratis */}
        <div className="bg-gradient-to-r from-[#1B2A82] to-[#142066] text-white p-4 sm:p-5 rounded-3xl shadow-md space-y-3 w-full min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase">
              Precios por Mayor y Menor
            </span>
            <span className="bg-red-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-sm">
              <Gift className="w-3 h-3" />
              <span>Envío GRATIS desde S/ 85</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black leading-tight">
            Insumos y Productos de Limpieza en Lima
          </h1>
          <p className="text-xs text-blue-100 font-medium">
            Pide desde 1 unidad (medio kilo) o aprovecha descuentos por volumen. ¡Delivery GRATIS en compras desde S/ 85.00!
          </p>

          <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-blue-200 font-bold border-t border-blue-800/60">
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-amber-300" /> Lima S/ 7 y S/ 10 (Gratis ≥ S/ 85)
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Pago Contra Entrega
            </span>
            <span className="flex items-center gap-1 text-blue-100">
              <Package className="w-3.5 h-3.5 text-sky-300" /> Provincias por Shalom (desde S/ 65)
            </span>
          </div>
        </div>

        {/* SECCIÓN VISUAL DE CATEGORÍAS (ILUSTRACIÓN LIMPIA POR SECCIÓN SIN RUIDO VISUAL) */}
        <section className="space-y-3 w-full min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-[#1B2A82]" />
              <span>Explora por Categoría</span>
            </h2>
            <span className="text-[11px] font-extrabold text-[#1B2A82] bg-blue-50 px-2.5 py-1 rounded-full">
              {products.length} productos en total
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
            {visualCategories.map((cat) => {
              const IconComponent = cat.theme.Icon
              return (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.slug}`}
                  className="bg-white rounded-2xl border border-gray-200/90 shadow-sm hover:shadow-md hover:border-[#1B2A82]/40 transition-all overflow-hidden flex flex-col justify-between group active:scale-[0.98]"
                >
                  {/* Cabecera gráfica ilustrada por tema (cero fotos repetidas de productos) */}
                  <div
                    className={`relative h-24 sm:h-28 w-full bg-gradient-to-br ${cat.theme.bgGradient} flex items-center justify-center p-3 overflow-hidden`}
                  >
                    {/* Círculo decorativo de fondo */}
                    <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/40 pointer-events-none" />
                    <div className="absolute -left-3 -top-3 w-12 h-12 rounded-full bg-white/30 pointer-events-none" />

                    {/* Ícono ilustrativo central */}
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${cat.theme.iconBg} shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                    >
                      <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>

                    {cat.count > 0 && (
                      <span
                        className={`absolute top-2 right-2 ${cat.theme.badgeBg} ${cat.theme.badgeText} text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm`}
                      >
                        {cat.count} {cat.count === 1 ? 'item' : 'items'}
                      </span>
                    )}
                  </div>

                  {/* Título grande + subtítulo explicativo */}
                  <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between gap-2 flex-1">
                    <div className="min-w-0 space-y-0.5">
                      <h3 className="font-black text-xs sm:text-sm text-gray-900 leading-snug line-clamp-2 group-hover:text-[#1B2A82] transition-colors">
                        {cat.label}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 line-clamp-1">
                        {cat.theme.subtitle}
                      </p>
                    </div>
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-[#1B2A82] flex items-center justify-center shrink-0 group-hover:bg-[#1B2A82] group-hover:text-white transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Sección 0: Nuevos Productos / Lanzamientos */}
        {newProducts.length > 0 && (
          <section className="space-y-3 w-full min-w-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-600 fill-amber-400" />
                <span>Nuevos Productos</span>
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Lanzamiento
                </span>
              </h2>
              <Link
                href="/categoria/nuevos-productos"
                className="text-xs font-black text-[#1B2A82] hover:underline"
              >
                Ver todos →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full min-w-0">
              {newProducts.map((p) => (
                <ProductCard key={p.id} product={p} isNewBadge />
              ))}
            </div>
          </section>
        )}

        {/* Sección 1: Packs y Combos */}
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

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory w-full min-w-0 touch-auto">
              {packProducts.map((p) => (
                <div key={p.id} className="w-[155px] sm:w-[190px] shrink-0 snap-start">
                  <ProductCard product={p} isHorizontalCarousel />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sección 2: Catálogo Destacado */}
        <section className="space-y-3 w-full min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Productos Destacados</span>
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