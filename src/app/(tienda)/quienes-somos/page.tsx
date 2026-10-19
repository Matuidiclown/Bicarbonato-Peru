'use client'

import React from 'react'
import { Header } from '@/components/Header'
import { ShieldCheck, Truck, Sparkles, Award, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function QuienesSomosPage() {
  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <Link
          href="/"
          className="text-xs font-extrabold text-[#1B2A82] hover:underline flex items-center gap-1.5 self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la Portada</span>
        </Link>

        {/* HERO HEADER */}
        <div className="bg-[#1B2A82] text-white rounded-3xl p-8 shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Empresa Peruana de Limpieza & Mayorista</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">¿Quiénes Somos?</h1>
          <p className="text-sm text-blue-100 font-medium leading-relaxed max-w-2xl">
            En <span className="font-bold text-white">Bicarbonato Perú</span> nos dedicamos a la distribución directa de insumos químicos base y productos de limpieza industrial y del hogar con cobertura en todo Lima Metropolitana.
          </p>
        </div>

        {/* TARJETAS DE VALOR Y PROPÓSITO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200 space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1B2A82] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-gray-900">Calidad e Insumos</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Formulaciones de alta concentración que garantizan máxima desinfección y limpieza profunda.
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200 space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1B2A82] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-gray-900">Precios por Mayor</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Descuentos automáticos por cantidad para hogares, negocios, lavanderías y empresas de mantenimiento.
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200 space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1B2A82] flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-gray-900">Atención Personalizada</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Gestión directa de tus pedidos vía WhatsApp con rotación rápida para una atención fluida y sin esperas.
            </p>
          </div>
        </div>

        {/* DETALLES DE LA EMPRESA */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Nuestra Historia y Compromiso</h2>
          <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
            Surgimos con el compromiso de ofrecer alternativas de limpieza eficientes, ecológicas y accesibles en el Perú. Desde nuestros productos estrella como el <strong className="text-gray-900">Bicarbonato de Sodio</strong> y <strong className="text-gray-900">Percarbonato de Sodio</strong>, hasta soluciones listas para usar en cocina, lavandería y desinfección general, acompañamos a miles de familias y negocios limeños día a día.
          </p>
        </div>
      </main>
    </div>
  )
}