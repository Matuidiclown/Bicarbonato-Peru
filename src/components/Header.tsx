'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/useCartStore'
import { createClient } from '@/lib/supabase/client'
import {
  ShoppingBag,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Layers,
  Search,
  Plus,
  Loader2
} from 'lucide-react'

// Estructura oficial de categorías compartida con /categoria/[slug]
export const CATALOG_CATEGORIES = [
  {
    id: 'packs',
    slug: 'packs',
    label: 'Packs y Combos Ahorro',
    emoji: '🎁',
    subcategories: ['Kits de Desinfección', 'Kits de Lavado y Ropa', 'Kits de Cocina', 'Kits de Limpieza General']
  },
  {
    id: 'insumos-base',
    slug: 'insumos-base',
    label: 'Insumos Base / Naturales',
    emoji: '✨',
    subcategories: ['Bicarbonato de Sodio', 'Percarbonato de Sodio', 'Vinagre Blanco']
  },
  {
    id: 'lavanderia',
    slug: 'lavanderia',
    label: 'Lavandería y Cuidado Ropa',
    emoji: '🧼',
    subcategories: ['Detergentes Líquidos y en Polvo', 'Desmanchadores y Blanqueadores', 'Suavizantes de Ropa', 'Perfumes y Plancha Fácil']
  },
  {
    id: 'cocina',
    slug: 'cocina',
    label: 'Cocina y Desengrasantes',
    emoji: '🍳',
    subcategories: ['Lavavajillas Líquidos', 'Limpiadores Desengrasantes 3en1']
  },
  {
    id: 'bano-pisos',
    slug: 'bano-pisos',
    label: 'Baño, Pisos y Cerámicas',
    emoji: '🚿',
    subcategories: ['Quita Sarro y Óxido', 'Limpiadores de Pisos (Total Clean)']
  },
  {
    id: 'vidrios-superficies',
    slug: 'vidrios-superficies',
    label: 'Vidrios, Tapices y Mascotas',
    emoji: '🧴',
    subcategories: ['Limpia Vidrios Multiusos', 'Limpiatapices y Alfombras', 'Eliminadores de Olor (Neutro-Pet)']
  },
  {
    id: 'aromatizadores',
    slug: 'aromatizadores',
    label: 'Aromatizadores y Perfumes Hogar',
    emoji: '🌸',
    subcategories: ['Perfumes Hogar 1L']
  },
  {
    id: 'utensilios',
    slug: 'utensilios',
    label: 'Utensilios y Accesorios',
    emoji: '🧽',
    subcategories: ['Esponjas y Fibras', 'Guantes de Limpieza', 'Trapeadores de Microfibra', 'Bolsas de Basura']
  }
]

interface HeaderProps {
  activeCategory?: string
}

export function Header({ activeCategory }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const items = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const totalCount = items.reduce((acc, i) => acc + i.quantity, 0)

  // Estados de navegación
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Estados de búsqueda en vivo
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Debounce para consultar en Supabase al escribir
  useEffect(() => {
    const cleanTerm = searchQuery.trim()

    if (cleanTerm.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timeoutId = setTimeout(async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, price_tiers(*)')
        .eq('is_active', true)
        .ilike('name', `%${cleanTerm}%`)
        .limit(6)

      if (!error && data) {
        setSearchResults(data)
      } else {
        setSearchResults([])
      }
      setIsSearching(false)
    }, 250)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, supabase])

  // Cerrar el buscador al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNavigateCategory = (slug: string) => {
    setIsMenuOpen(false)
    setDropdownOpen(false)
    router.push(`/categoria/${slug}`)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowSearchDropdown(false)
  }

  return (
    <header className="bg-[#1B2A82] text-white sticky top-0 z-40 shadow-md w-full max-w-full">
      {/* BARRA PRINCIPAL SUPERIOR */}
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 sm:gap-4 w-full">
        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl shadow-sm hover:opacity-95 transition-opacity shrink-0"
        >
          <img src="/logo.jpeg" alt="Bicarbonato Perú Logo" className="h-7 w-auto object-contain" />
        </Link>

        {/* BUSCADOR EN VIVO (ESCRITORIO / TABLET) */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setShowSearchDropdown(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearchDropdown(true)
              }}
              placeholder="Buscar productos (ej. bicarbonato, lejía, jabón)..."
              className="w-full h-10 pl-10 pr-9 rounded-2xl bg-white text-gray-900 placeholder:text-gray-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
            />
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin absolute right-3 top-3" />
            ) : searchQuery ? (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-2.5 p-0.5 text-gray-400 hover:text-gray-600 rounded-full"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* DESPLEGABLE FLOTANTE DE RESULTADOS (ESCRITORIO) */}
          {showSearchDropdown && searchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 text-gray-800 z-50 overflow-hidden max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-xs font-bold text-gray-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#1B2A82]" />
                  <span>Buscando coincidencias...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs font-semibold text-gray-500">
                  No encontramos productos con "{searchQuery}".
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {searchResults.map((product) => {
                    const tiers = product.price_tiers || []
                    const baseTier = tiers.find((t: any) => t.min_quantity === 1) || tiers[0]
                    const price = baseTier ? Number(baseTier.unit_price) : 0

                    return (
                      <div
                        key={product.id}
                        className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 bg-slate-50 rounded-xl p-1.5 border border-gray-100 flex items-center justify-center shrink-0">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <ShoppingBag className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-black text-[#1B2A82] uppercase block truncate">
                              {product.presentation || 'Limpieza'}
                            </span>
                            <h4 className="font-extrabold text-xs text-gray-900 truncate">
                              {product.name}
                            </h4>
                            <span className="text-xs font-black text-gray-900">
                              S/ {price.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            addItem(product, 1)
                            handleClearSearch()
                          }}
                          className="bg-[#1B2A82] hover:bg-[#142066] text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm shrink-0 active:scale-95 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* NAVEGACIÓN ESCRITORIO */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-extrabold">
          <Link href="/" className="hover:text-blue-200 transition-colors">
            Inicio
          </Link>

          {/* DROPDOWN CATEGORÍAS */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              onMouseEnter={() => setDropdownOpen(true)}
              className="flex items-center gap-1 hover:text-blue-200 transition-colors focus:outline-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Categorías</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div
                onMouseLeave={() => setDropdownOpen(false)}
                className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 text-gray-800 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="px-4 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#1B2A82]" />
                  <span>Secciones de Limpieza</span>
                </div>
                {CATALOG_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleNavigateCategory(cat.slug)}
                    className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-blue-50 hover:text-[#1B2A82] flex items-center gap-2 transition-colors ${
                      activeCategory === cat.slug ? 'bg-blue-50 text-[#1B2A82] font-black' : ''
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link href="/quienes-somos" className="hover:text-blue-200 transition-colors">
            Quiénes Somos
          </Link>
        </nav>

        {/* ACCIONES DERECHA */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/carrito"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Carrito</span>
            <span className="bg-white text-emerald-800 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center">
              {totalCount}
            </span>
          </Link>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-white hover:bg-[#142066] rounded-xl transition-colors"
            aria-label="Abrir menú"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* BUSCADOR EXCLUSIVO PARA MÓVILES (FILA DEDICADA) */}
      <div className="sm:hidden px-3 pb-2.5 pt-0.5">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setShowSearchDropdown(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSearchDropdown(true)
            }}
            placeholder="Buscar productos de limpieza..."
            className="w-full h-9 pl-9 pr-8 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 text-xs font-semibold focus:outline-none shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-2 p-0.5 text-gray-400 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* RESULTADOS FLOTANTES EN MÓVIL */}
        {showSearchDropdown && searchQuery.trim().length >= 2 && (
          <div className="mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 text-gray-800 overflow-hidden max-h-80 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-xs font-bold text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#1B2A82]" />
                <span>Buscando productos...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-xs font-semibold text-gray-500">
                No hay coincidencias para "{searchQuery}".
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {searchResults.map((product) => {
                  const tiers = product.price_tiers || []
                  const baseTier = tiers.find((t: any) => t.min_quantity === 1) || tiers[0]
                  const price = baseTier ? Number(baseTier.unit_price) : 0

                  return (
                    <div
                      key={product.id}
                      className="p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 bg-slate-50 rounded-lg p-1 border border-gray-100 flex items-center justify-center shrink-0">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs text-gray-900 truncate">
                            {product.name}
                          </h4>
                          <span className="text-xs font-black text-[#1B2A82]">
                            S/ {price.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          addItem(product, 1)
                          handleClearSearch()
                        }}
                        className="bg-[#1B2A82] text-white px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* BARRA DESLIZABLE HORIZONTAL DE CATEGORÍAS (PILLS) */}
      <div className="bg-[#142066] border-t border-blue-900/50 py-2 px-3 overflow-x-auto scrollbar-none flex items-center gap-2 shadow-inner w-full min-w-0 touch-pan-x">
        <Link
          href="/"
          className="shrink-0 bg-white/10 hover:bg-white/20 text-white text-[11px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/15 transition-all"
        >
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>Ofertas & Packs</span>
        </Link>

        {CATALOG_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleNavigateCategory(cat.slug)}
            className={`shrink-0 text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 border active:scale-95 transition-all ${
              activeCategory === cat.slug
                ? 'bg-[#1B2A82] border-white/40 shadow-sm'
                : 'bg-white/10 hover:bg-white/20 border-white/10'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* MENÚ MÓVIL DESPLEGABLE */}
      {isMenuOpen && (
        <div className="lg:hidden bg-[#1B2A82] border-t border-blue-900 px-4 py-4 space-y-3 animate-in fade-in duration-200">
          <Link
            href="/"
            onClick={() => setIsMenuOpen(false)}
            className="block text-xs font-black text-white hover:text-blue-200 py-1"
          >
            Inicio
          </Link>
          <Link
            href="/quienes-somos"
            onClick={() => setIsMenuOpen(false)}
            className="block text-xs font-black text-white hover:text-blue-200 py-1"
          >
            Quiénes Somos
          </Link>
          <Link
            href="/vendedora/login"
            onClick={() => setIsMenuOpen(false)}
            className="block text-xs font-black text-amber-300 hover:text-amber-200 py-1"
          >
            Portal Vendedoras
          </Link>
        </div>
      )}
    </header>
  )
}