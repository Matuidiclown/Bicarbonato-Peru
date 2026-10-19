'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/useCartStore'
import { ShoppingCart, ChevronDown, ChevronRight, Menu, X, Sparkles, Layers } from 'lucide-react'

export const CATALOG_CATEGORIES = [
  {
    id: 'packs',
    label: 'Packs y Combos Ahorro',
    subcategories: ['Kits de Desinfección', 'Kits de Lavado y Ropa', 'Kits de Cocina', 'Kits de Limpieza General']
  },
  {
    id: 'insumos-base',
    label: 'Insumos Base / Naturales',
    subcategories: ['Bicarbonato de Sodio', 'Percarbonato de Sodio', 'Vinagre Blanco']
  },
  {
    id: 'lavanderia',
    label: 'Lavandería y Cuidado Ropa',
    subcategories: ['Detergentes Líquidos y en Polvo', 'Desmanchadores y Blanqueadores', 'Suavizantes de Ropa', 'Perfumes y Plancha Fácil']
  },
  {
    id: 'cocina',
    label: 'Cocina y Desengrasantes',
    subcategories: ['Lavavajillas Líquidos', 'Limpiadores Desengrasantes 3en1']
  },
  {
    id: 'bano-pisos',
    label: 'Baño, Pisos y Cerámicas',
    subcategories: ['Quita Sarro y Óxido', 'Limpiadores de Pisos (Total Clean)']
  },
  {
    id: 'vidrios-superficies',
    label: 'Vidrios, Tapices y Mascotas',
    subcategories: ['Limpia Vidrios Multiusos', 'Limpiatapices y Alfombras', 'Eliminadores de Olor (Neutro-Pet)']
  },
  {
    id: 'aromatizadores',
    label: 'Aromatizadores y Perfumes Hogar',
    subcategories: ['Perfumes Hogar 1L']
  },
  {
    id: 'utensilios',
    label: 'Utensilios y Accesorios',
    subcategories: ['Esponjas y Fibras', 'Guantes de Limpieza', 'Trapeadores de Microfibra', 'Bolsas de Basura']
  }
]

interface HeaderProps {
  activeCategory?: string
}

export function Header({ activeCategory }: HeaderProps) {
  const router = useRouter()
  const items = useCartStore(state => state.items)
  const totalCartCount = items.reduce((acc, item) => acc + item.quantity, 0)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string>('insumos-base')
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null)

  const navigateToCategory = (catId: string, subcategory?: string) => {
    setIsMenuOpen(false)
    if (subcategory) {
      router.push(`/categoria/${catId}?sub=${encodeURIComponent(subcategory)}`)
    } else {
      router.push(`/categoria/${catId}`)
    }
  }

  const activeCategoryData = CATALOG_CATEGORIES.find(c => c.id === hoveredCategory)

  return (
    <header className="bg-[#1B2A82] text-white sticky top-0 z-40 shadow-lg border-b border-blue-900">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* LOGO OFICIAL */}
        <Link href="/" className="flex items-center gap-3 shrink-0 bg-white px-3 py-1.5 rounded-2xl shadow-sm hover:opacity-95 transition-opacity">
          <img
            src="/logo.jpeg"
            alt="Bicarbonato Perú Logo"
            className="h-8 sm:h-9 w-auto object-contain"
          />
        </Link>

        {/* NAVEGACIÓN ESCRITORIO */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-bold">
          <div
            className="relative"
            onMouseLeave={() => setIsMenuOpen(false)}
          >
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              onMouseEnter={() => setIsMenuOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#142066] hover:bg-[#0f174a] text-white transition-colors shadow-inner text-xs font-extrabold border border-blue-800/50"
            >
              <Sparkles className="w-4 h-4 text-blue-300" />
              <span>Categorías</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* MEGAMENÚ DESPLEGABLE */}
            {isMenuOpen && (
              <div className="absolute top-full left-0 mt-1 flex bg-white text-gray-800 rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 min-w-[580px]">
                {/* COLUMNA IZQUIERDA: CATEGORÍAS */}
                <div className="w-64 bg-slate-50 p-3 border-r border-gray-100 space-y-1 shrink-0">
                  <div className="px-3 py-1 text-[10px] font-black text-blue-900/60 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#1B2A82]" />
                    <span>Secciones de Limpieza</span>
                  </div>

                  {CATALOG_CATEGORIES.map(cat => {
                    const isHovered = hoveredCategory === cat.id
                    const isActive = activeCategory === cat.id

                    return (
                      <button
                        key={cat.id}
                        onMouseEnter={() => setHoveredCategory(cat.id)}
                        onClick={() => navigateToCategory(cat.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-between transition-all ${
                          isHovered
                            ? 'bg-[#1B2A82] text-white shadow-sm'
                            : isActive
                            ? 'bg-blue-100 text-[#1B2A82] font-black'
                            : 'hover:bg-slate-200/70 text-gray-700'
                        }`}
                      >
                        <span className="line-clamp-1">{cat.label}</span>
                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isHovered ? 'text-white' : 'text-gray-400'}`} />
                      </button>
                    )
                  })}
                </div>

                {/* COLUMNA DERECHA: SUB-PRODUCTOS */}
                <div className="flex-1 p-5 bg-white flex flex-col justify-between">
                  <div>
                    <div className="pb-2 border-b border-gray-100 mb-3">
                      <h4 className="text-xs font-black text-[#1B2A82] uppercase tracking-wider">
                        {activeCategoryData?.label}
                      </h4>
                      <p className="text-[11px] font-semibold text-gray-400 mt-0.5">
                        Selecciona un sub-producto para filtrar:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      {activeCategoryData?.subcategories.map(sub => (
                        <button
                          key={sub}
                          onClick={() => navigateToCategory(activeCategoryData.id, sub)}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between hover:bg-blue-50 text-gray-700 hover:text-[#1B2A82]"
                        >
                          <span>{sub}</span>
                          <span className="text-[10px] font-bold text-[#1B2A82] uppercase bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            Ir
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => navigateToCategory(hoveredCategory)}
                    className="mt-4 w-full bg-[#1B2A82] hover:bg-[#142066] text-white text-xs font-extrabold py-2.5 rounded-xl transition-all text-center shadow-md"
                  >
                    Ver Todo en {activeCategoryData?.label}
                  </button>
                </div>
              </div>
            )}
          </div>

          <Link href="/quienes-somos" className="hover:text-blue-200 transition-colors py-2">
            Quiénes Somos
          </Link>
          <a href="#contacto" className="hover:text-blue-200 transition-colors py-2">
            Contacto
          </a>
        </nav>

        {/* CARRITO Y MENÚ MÓVIL */}
        <div className="flex items-center gap-2">
          <Link
            href="/carrito"
            className="bg-[#101952] hover:bg-black text-white px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs font-extrabold shadow-md transition-all border border-blue-800/40"
          >
            <ShoppingCart className="w-4 h-4 text-blue-300" />
            <span className="hidden sm:inline">Mi Carrito</span>
            {totalCartCount > 0 && (
              <span className="bg-amber-400 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full shadow-sm">
                {totalCartCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-[#142066] text-white hover:bg-[#0f174a]"
            aria-label="Abrir Menú"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MENÚ MÓVIL */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#142066] border-t border-blue-900 px-4 py-4 space-y-3 text-white max-h-[80vh] overflow-y-auto">
          <div className="text-xs font-extrabold text-blue-200 uppercase tracking-wider pb-1 border-b border-blue-800">
            Navegación
          </div>

          <div className="flex flex-col gap-2 pb-2 border-b border-blue-800 text-xs font-extrabold">
            <Link
              href="/quienes-somos"
              onClick={() => setIsMenuOpen(false)}
              className="px-3 py-2 rounded-xl bg-[#1B2A82] text-white hover:bg-blue-900"
            >
              Quiénes Somos
            </Link>
            <a
              href="#contacto"
              onClick={() => setIsMenuOpen(false)}
              className="px-3 py-2 rounded-xl bg-[#1B2A82] text-white hover:bg-blue-900"
            >
              Contacto
            </a>
          </div>

          <div className="text-xs font-extrabold text-blue-200 uppercase tracking-wider pb-1 border-b border-blue-800">
            Categorías del Catálogo
          </div>

          <div className="space-y-1">
            {CATALOG_CATEGORIES.map(cat => {
              const isExpanded = expandedMobileCategory === cat.id

              return (
                <div key={cat.id} className="rounded-xl overflow-hidden bg-[#1B2A82]/80 border border-blue-800/50">
                  <div className="flex items-center justify-between p-2.5">
                    <button
                      onClick={() => navigateToCategory(cat.id)}
                      className="text-left text-xs font-extrabold text-white flex-1"
                    >
                      {cat.label}
                    </button>
                    {cat.subcategories.length > 0 && (
                      <button
                        onClick={() => setExpandedMobileCategory(isExpanded ? null : cat.id)}
                        className="p-1 text-blue-200 hover:text-white"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>

                  {isExpanded && cat.subcategories.length > 0 && (
                    <div className="bg-[#0e1647] p-2 space-y-1 border-t border-blue-800/80">
                      {cat.subcategories.map(sub => (
                        <button
                          key={sub}
                          onClick={() => navigateToCategory(cat.id, sub)}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-blue-100 hover:bg-[#1B2A82]"
                        >
                          • {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}