'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldCheck, FileText, BookOpen, Lock, MapPin, Phone, Mail } from 'lucide-react'

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.891h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  )
}

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function TikTokIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-1.39h.09V9.1a6.33 6.33 0 1 0 6.33 6.33V9a8.16 8.16 0 0 0 5-1.68z"/>
    </svg>
  )
}

export function Footer() {
  const [currentYear, setCurrentYear] = useState<number>(2026)

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  return (
    <footer id="contacto" className="bg-[#101952] text-slate-200 text-xs border-t border-blue-900/80 mt-auto scroll-mt-10">
      {/* SECCIÓN SUPERIOR: DATOS, ENLACES Y REDES */}
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* COLUMNA 1: LOGO Y REDES SOCIALES */}
        <div className="space-y-4">
          <Link href="/" className="inline-block bg-white px-3 py-1.5 rounded-2xl shadow-sm">
            <img
              src="/logo.jpeg"
              alt="Bicarbonato Perú Logo"
              className="h-9 w-auto object-contain"
            />
          </Link>
          <p className="text-slate-300 text-xs leading-relaxed font-medium">
            Venta al por mayor y menor de insumos y productos de limpieza para el hogar y la industria en Lima, Perú.
          </p>
          
          {/* REDES SOCIALES OFICIALES */}
          <div className="pt-1 space-y-2">
            <span className="text-[11px] font-black uppercase text-blue-200 tracking-wider block">
              Síguenos en redes:
            </span>
            <div className="flex items-center gap-2.5">
              <a
                href="https://www.facebook.com/p/Bicarbonato-Per%C3%BA-100063732362462/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#1B2A82] hover:bg-blue-600 text-white flex items-center justify-center transition-colors shadow-sm"
                aria-label="Facebook Bicarbonato Perú"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>

              <a
                href="https://www.instagram.com/bicarbonato_peru/?hl=es"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#1B2A82] hover:bg-pink-600 text-white flex items-center justify-center transition-colors shadow-sm"
                aria-label="Instagram Bicarbonato Perú"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>

              <a
                href="https://www.tiktok.com/@bicarbonatoperu"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#1B2A82] hover:bg-black text-white flex items-center justify-center transition-colors shadow-sm"
                aria-label="TikTok Bicarbonato Perú"
              >
                <TikTokIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* COLUMNA 2: CATEGORÍAS PRINCIPALES */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-sm text-white uppercase tracking-wider border-b border-blue-900 pb-2">
            Catálogo
          </h4>
          <ul className="space-y-2 font-medium text-slate-300">
            <li>
              <Link href="/categoria/packs" className="hover:text-blue-300 transition-colors">
                Packs y Combos Ahorro
              </Link>
            </li>
            <li>
              <Link href="/categoria/insumos-base" className="hover:text-blue-300 transition-colors">
                Insumos Base / Naturales
              </Link>
            </li>
            <li>
              <Link href="/categoria/lavanderia" className="hover:text-blue-300 transition-colors">
                Lavandería y Cuidado Ropa
              </Link>
            </li>
            <li>
              <Link href="/categoria/cocina" className="hover:text-blue-300 transition-colors">
                Cocina y Desengrasantes
              </Link>
            </li>
            <li>
              <Link href="/categoria/bano-pisos" className="hover:text-blue-300 transition-colors">
                Baño, Pisos y Cerámicas
              </Link>
            </li>
          </ul>
        </div>

        {/* COLUMNA 3: ATENCIÓN Y CONTACTO */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-sm text-white uppercase tracking-wider border-b border-blue-900 pb-2">
            Atención y Contacto
          </h4>
          <div className="space-y-3 font-medium text-slate-300">
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-slate-400">Coordinación y WhatsApp</p>
                <a href="https://wa.me/51924428558" target="_blank" rel="noopener noreferrer" className="font-extrabold text-white hover:text-emerald-300 transition-colors">
                  +51 924 428 558
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-slate-400">Correo Electrónico</p>
                <a href="mailto:contacto@bicarbonatoperu.com" className="font-bold text-white hover:text-blue-300 transition-colors">
                  gabriel_ar@live.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-slate-400">Zona de Cobertura</p>
                <p className="font-semibold text-white">Envíos a todo Lima Metropolitana</p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA 4: COMPLIANCE LEGAL Y LIBRO DE RECLAMACIONES */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-sm text-white uppercase tracking-wider border-b border-blue-900 pb-2">
            Legales y Garantía
          </h4>
          <ul className="space-y-2 font-semibold text-slate-300">
            <li>
              <Link href="/terminos" className="hover:text-blue-300 transition-colors flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Términos y Condiciones</span>
              </Link>
            </li>
            <li>
              <Link href="/privacidad" className="hover:text-blue-300 transition-colors flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Política de Privacidad</span>
              </Link>
            </li>
            <li>
              <Link href="/reclamaciones" className="hover:text-amber-300 text-amber-400 transition-colors flex items-center gap-1.5 font-extrabold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Libro de Reclamaciones Virtual</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: COPYRIGHT Y BADGE DE COMPRA SEGURA */}
      <div className="bg-[#0b1138] border-t border-blue-950 py-4 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-semibold text-slate-400">
          <div>
            <p>© {currentYear} BICARBONATO PERÚ. Todos los derechos reservados.</p>
            <p className="text-[10px] text-slate-500">Lima, Perú</p>
          </div>

          <div className="flex items-center gap-2 bg-[#1B2A82]/60 px-3.5 py-1.5 rounded-full border border-blue-800/50 text-white font-extrabold">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="tracking-wide">COMPRA 100% SEGURA</span>
          </div>
        </div>
      </div>
    </footer>
  )
}