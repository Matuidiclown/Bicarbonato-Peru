'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/useCartStore'
import { Header } from '@/components/Header'
import { CartSidebar } from '@/components/CartSidebar'
import { Plus, Minus, Flame, Package, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function TiendaHomePage() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { items, addItem, updateQuantity } = useCartStore()
  const supabase = createClient()

  useEffect(() => {
    const fetchCatalog = async () => {
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

    fetchCatalog()
  }, [])

  const offerProducts = products.filter(p =>
    (p.price_tiers || []).some((t: any) => t.min_quantity > 1)
  )

  const packProducts = products.filter(
    p => p.category === 'packs' || p.presentation?.toLowerCase().includes('pack') || p.name?.toLowerCase().includes('pack')
  )

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
        className="w-full bg-[#1B2A82] hover:bg-[#142066] text-white font-extrabold rounded-2xl py-2.5 text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
      >
        <Plus className="w-4 h-4 stroke-[3]" />
        <span>Agregar Producto</span>
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <Header />

      <div className="bg-emerald-50 border-b border-emerald-200 py-2.5 px-4 text-center">
        <p className="text-xs sm:text-sm font-black text-emerald-900 flex items-center justify-center gap-2">
          <span>¡Compra más y paga menos! Descuentos automáticos por cantidad en tu carrito.</span>
        </p>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* LAYOUT DIVIDIDO: CATÁLOGO A LA IZQUIERDA Y PRE-CUENTA A LA DERECHA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* SECCIONES DE PRODUCTOS (COLUMNA IZQUIERDA - 2 COLS EN DESKTOP) */}
          <div className="lg:col-span-2 space-y-10">
            {/* SECCIÓN 1: OFERTAS DESTACADAS */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-sm">
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">OFERTAS DESTACADAS</h2>
                  <p className="text-xs font-semibold text-gray-500">Selecciona o modifica tus unidades directamente 👉</p>
                </div>
              </div>

              {isLoading ? (
                <div className="py-8 text-center text-xs font-bold text-gray-400">Cargando ofertas...</div>
              ) : offerProducts.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl text-center text-xs text-gray-500 border">
                  Aún no hay ofertas registradas.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {offerProducts.map(product => {
                    const tiers = product.price_tiers || []
                    const baseTier = tiers.find((t: any) => t.min_quantity === 1) || tiers[0]
                    const promoTier = tiers.find((t: any) => t.min_quantity > 1)

                    const basePrice = baseTier ? baseTier.unit_price : 0
                    const promoPrice = promoTier ? promoTier.unit_price : 0
                    const promoMinQty = promoTier ? promoTier.min_quantity : 2

                    return (
                      <div
                        key={`offer-${product.id}`}
                        className="bg-white rounded-3xl p-4 shadow-sm border border-amber-200 flex flex-col justify-between space-y-3 relative overflow-hidden border-t-4 border-t-amber-500"
                      >
                        {promoTier && (
                          <div className="bg-amber-500 text-white font-extrabold text-[11px] px-3 py-1 rounded-full shadow-sm self-start">
                            Lleva {promoMinQty} a S/ {promoPrice?.toFixed(2)} c/u
                          </div>
                        )}

                        <div className="aspect-square bg-slate-50 rounded-2xl p-3 flex items-center justify-center border border-gray-100 overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="max-h-40 w-auto object-contain" />
                          ) : (
                            <span className="text-xs text-gray-400 font-bold">Producto Limpieza</span>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] font-black tracking-wider text-[#1B2A82] uppercase block">
                            {product.presentation}
                          </span>
                          <h3 className="text-sm font-extrabold text-gray-900 leading-tight line-clamp-1">{product.name}</h3>
                        </div>

                        <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100 text-xs font-semibold space-y-1">
                          <div className="flex justify-between text-gray-600">
                            <span>1 unidad:</span>
                            <span className="font-bold text-gray-900">S/ {basePrice?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-amber-900 font-extrabold bg-amber-100 p-1 rounded-lg">
                            <span>Desde {promoMinQty} uds:</span>
                            <span>S/ {promoPrice?.toFixed(2)} c/u</span>
                          </div>
                        </div>

                        {renderProductControls(product)}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* SECCIÓN 2: PACKS Y COMBOS AHORRO */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#1B2A82] text-white flex items-center justify-center font-black shadow-sm">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">PACKS Y COMBOS AHORRO</h2>
                    <p className="text-xs font-semibold text-gray-500">Combos especiales con descuento integrado</p>
                  </div>
                </div>

                <Link
                  href="/categoria/packs"
                  className="text-xs font-black text-[#1B2A82] hover:underline flex items-center gap-1"
                >
                  <span>Ver Todos los Packs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {isLoading ? (
                <div className="py-8 text-center text-xs font-bold text-gray-400">Cargando packs...</div>
              ) : packProducts.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl text-center text-xs text-gray-500 border">
                  Aún no hay packs registrados.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {packProducts.map(product => {
                    const tiers = product.price_tiers || []
                    const baseTier = tiers.find((t: any) => t.min_quantity === 1) || tiers[0]
                    const basePrice = baseTier ? baseTier.unit_price : 0

                    return (
                      <div
                        key={`pack-${product.id}`}
                        className="bg-white rounded-3xl p-4 shadow-sm border border-blue-200 flex flex-col justify-between space-y-3 relative overflow-hidden border-t-4 border-t-[#1B2A82]"
                      >
                        <span className="text-[10px] font-black tracking-wider text-[#1B2A82] uppercase bg-blue-50 px-2.5 py-1 rounded-full self-start">
                          {product.presentation}
                        </span>

                        <div className="aspect-square bg-slate-50 rounded-2xl p-3 flex items-center justify-center border border-gray-100 overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="max-h-36 w-auto object-contain" />
                          ) : (
                            <span className="text-xs text-gray-400 font-bold">Pack Limpieza</span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-sm font-extrabold text-gray-900 leading-tight line-clamp-1">{product.name}</h3>
                          <p className="text-xs font-black text-[#1B2A82] mt-1">Precio Pack: S/ {basePrice?.toFixed(2)}</p>
                        </div>

                        {renderProductControls(product)}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          {/* PRE-CUENTA PERMANENTE A LA DERECHA (COLUMNA 3) */}
          <div className="lg:col-span-1">
            <CartSidebar />
          </div>

        </div>
      </main>
    </div>
  )
}