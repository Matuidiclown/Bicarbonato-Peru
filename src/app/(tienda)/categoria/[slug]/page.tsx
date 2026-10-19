'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/useCartStore'
import { Header, CATALOG_CATEGORIES } from '@/components/Header'
import { CartSidebar } from '@/components/CartSidebar'
import { Plus, Minus, ArrowLeft, Tag, Layers, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default function CategoriaPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const slug = params?.slug as string
  const activeSub = searchParams.get('sub')

  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { items, addItem, updateQuantity } = useCartStore()
  const supabase = createClient()

  const categoryMeta = CATALOG_CATEGORIES.find(c => c.id === slug) || {
    id: slug,
    label: slug ? slug.replace('-', ' ').toUpperCase() : 'Categoría',
    subcategories: []
  }

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setIsLoading(true)

      let query = supabase
        .from('products')
        .select('*, price_tiers(*)')
        .eq('is_active', true)
        .eq('category', slug)
        .order('created_at', { ascending: false })

      if (activeSub) {
        query = query.eq('subcategory', activeSub)
      }

      const { data, error } = await query

      if (!error && data) {
        setProducts(data)
      }
      setIsLoading(false)
    }

    if (slug) {
      fetchCategoryProducts()
    }
  }, [slug, activeSub])

  const renderProductControls = (product: any) => {
    const cartItem = items.find(i => i.id === product.id)
    const currentQty = cartItem ? cartItem.quantity : 0

    if (currentQty > 0) {
      return (
        <div className="flex items-center justify-between bg-blue-50 p-1.5 rounded-2xl border border-blue-200">
          <button
            onClick={() => updateQuantity(product.id, currentQty - 1)}
            className="w-9 h-9 rounded-xl bg-white hover:bg-gray-100 text-gray-800 flex items-center justify-center font-black shadow-sm transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="text-center">
            <span className="text-xs font-black text-[#1B2A82] block">{currentQty} en carrito</span>
            <span className="text-[9px] font-extrabold text-blue-600 uppercase">Modificar</span>
          </div>
          <button
            onClick={() => updateQuantity(product.id, currentQty + 1)}
            className="w-9 h-9 rounded-xl bg-[#1B2A82] hover:bg-[#142066] text-white flex items-center justify-center font-black shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )
    }

    return (
      <button
        onClick={() => addItem(product, 1)}
        className="w-full bg-[#1B2A82] hover:bg-[#142066] text-white font-extrabold rounded-2xl py-3 text-sm flex items-center justify-center gap-2 shadow-md transition-all"
      >
        <Plus className="w-5 h-5 stroke-[3]" />
        <span>Agregar al Carrito</span>
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <Header activeCategory={slug} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: PRODUCTOS DE LA CATEGORÍA */}
          <div className="lg:col-span-2 space-y-6">
            <Link
              href="/"
              className="text-xs font-extrabold text-[#1B2A82] hover:underline flex items-center gap-1.5 self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la Portada (Ofertas y Packs)</span>
            </Link>

            <div className="bg-[#1B2A82] text-white rounded-3xl p-6 shadow-md space-y-2">
              <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                <span>Sección de Catálogo</span>
              </div>
              <h1 className="text-2xl font-black">{categoryMeta.label}</h1>
              <p className="text-xs text-blue-100 font-medium">
                Explora los productos y aprovecha los precios con descuento automático por cantidad.
              </p>
            </div>

            {categoryMeta.subcategories.length > 0 && (
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-2">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-[#1B2A82]" />
                  <span>Filtrar por Sub-Producto:</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => router.push(`/categoria/${slug}`)}
                    className={`text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition-all ${
                      !activeSub
                        ? 'bg-[#1B2A82] text-white shadow-sm'
                        : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
                    }`}
                  >
                    Todos en {categoryMeta.label}
                  </button>
                  {categoryMeta.subcategories.map(sub => (
                    <button
                      key={sub}
                      onClick={() => router.push(`/categoria/${slug}?sub=${encodeURIComponent(sub)}`)}
                      className={`text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition-all ${
                        activeSub === sub
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

            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">
                  {activeSub ? `Subcategoría: ${activeSub}` : `Productos de ${categoryMeta.label}`}
                </h2>
                <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                  {products.length} productos
                </span>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-xs font-bold text-gray-500">
                  Cargando productos de {categoryMeta.label}...
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl text-center text-gray-500 font-medium border border-gray-200 space-y-3">
                  <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm font-bold text-gray-700">No hay productos registrados en esta sección aún.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {products.map(product => {
                    const tiers = product.price_tiers || []
                    const baseTier = tiers.find((t: any) => t.min_quantity === 1) || tiers[0]
                    const promoTier = tiers.find((t: any) => t.min_quantity > 1)

                    const basePrice = baseTier ? baseTier.unit_price : 0
                    const promoPrice = promoTier ? promoTier.unit_price : 0
                    const promoMinQty = promoTier ? promoTier.min_quantity : 2

                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between space-y-4 relative overflow-hidden"
                      >
                        <div className="aspect-square bg-slate-50 rounded-2xl p-4 flex items-center justify-center border border-gray-100 overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="max-h-48 w-auto object-contain" />
                          ) : (
                            <span className="text-xs text-gray-400 font-bold">Producto Limpieza</span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs font-black tracking-wider text-[#1B2A82] uppercase block">
                            {product.presentation}
                          </span>
                          <h3 className="text-base font-black text-gray-900 leading-snug">{product.name}</h3>
                          {product.subcategory && (
                            <span className="text-[10px] font-bold text-gray-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                              {product.subcategory}
                            </span>
                          )}
                        </div>

                        <div className="bg-slate-50 p-3 rounded-2xl border border-gray-100 space-y-1 text-xs font-semibold">
                          <div className="flex justify-between text-gray-700">
                            <span>Precio 1 ud:</span>
                            <span className="font-extrabold text-gray-900">S/ {basePrice?.toFixed(2)}</span>
                          </div>
                          {promoTier && (
                            <div className="flex justify-between text-[#1B2A82] bg-blue-50 p-1.5 rounded-xl font-bold">
                              <span>Desde {promoMinQty} uds:</span>
                              <span className="font-black text-[#1B2A82]">S/ {promoPrice?.toFixed(2)} c/u</span>
                            </div>
                          )}
                        </div>

                        {renderProductControls(product)}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          {/* COLUMNA DERECHA: PRE-CUENTA LATERAL */}
          <div className="lg:col-span-1">
            <CartSidebar />
          </div>

        </div>
      </main>
    </div>
  )
}