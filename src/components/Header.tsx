'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/useCartStore'
import { ShoppingBag, ChevronDown, Menu, X, Sparkles, Layers } from 'lucide-react'

// Estructura oficial exportada para consumo del Header y de /categoria/[slug]
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
  const items = useCartStore((state) => state.items)
  const totalCount = items.reduce((acc, i) => acc + i.quantity, 0)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleNavigateCategory = (slug: string) => {
    setIsMenuOpen(false)
    setDropdownOpen(false)
    router.push(`/categoria/${slug}`)
  }

  return (
    <header className="bg-[#1B2A82] text-white sticky top-0 z-40 shadow-md w-full max-w-full overflow-hidden">
      {/* BARRA PRINCIPAL SUPERIOR */}
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4 w-full">
        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl shadow-sm hover:opacity-95 transition-opacity shrink-0"
        >
          <img src="/logo.jpeg" alt="Bicarbonato Perú Logo" className="h-7 w-auto object-contain" />
        </Link>

        {/* NAVEGACIÓN ESCRITORIO */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-extrabold">
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
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
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
          <a href="#contacto" className="hover:text-blue-200 transition-colors">
            Contacto
          </a>
        </nav>

        {/* ACCIONES DERECHA */}
        <div className="flex items-center gap-2.5 shrink-0">
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
            className="md:hidden p-2 text-white hover:bg-[#142066] rounded-xl transition-colors"
            aria-label="Abrir menú"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* BARRA DESLIZABLE HORIZONTAL DE CATEGORÍAS (MOBILE FIRST - PILLS) */}
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
        <div className="md:hidden bg-[#1B2A82] border-t border-blue-900 px-4 py-4 space-y-3 animate-in fade-in duration-200">
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
          <a
            href="#contacto"
            onClick={() => setIsMenuOpen(false)}
            className="block text-xs font-black text-white hover:text-blue-200 py-1"
          >
            Contacto
          </a>
        </div>
      )}
    </header>
  )
}