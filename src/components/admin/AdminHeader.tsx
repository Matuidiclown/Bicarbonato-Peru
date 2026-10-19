'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Users, Package, LogOut, ExternalLink } from 'lucide-react'

export function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const navItems = [
    { label: 'Pedidos', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Vendedoras', href: '/admin/vendedoras', icon: Users },
    { label: 'Productos', href: '/admin/productos', icon: Package }
  ]

  return (
    <header className="bg-[#1B2A82] text-white shadow-md border-b border-blue-900 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* LOGO CORPORATIVO MÁS BADGE ADMIN */}
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="bg-white px-3 py-1.5 rounded-2xl shadow-sm hover:opacity-95 transition-opacity">
            <img src="/logo.jpeg" alt="Bicarbonato Perú Logo" className="h-7 w-auto object-contain" />
          </Link>
          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm hidden sm:inline-block">
            Panel Admin
          </span>
        </div>

        {/* NAVEGACIÓN ADMINISTRATIVA */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-white text-[#1B2A82] shadow-sm'
                    : 'text-blue-100 hover:bg-[#142066]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* DERECHA: IR A TIENDA Y SALIR */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#142066] hover:bg-[#0f174a] text-blue-100 text-xs font-bold flex items-center gap-1.5 border border-blue-800/40"
            title="Ver tienda de clientes"
          >
            <ExternalLink className="w-4 h-4 text-blue-300" />
            <span className="hidden md:inline">Ver Tienda</span>
          </Link>

          <button
            onClick={handleLogout}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-red-600/80 hover:bg-red-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors shadow-sm"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  )
}
