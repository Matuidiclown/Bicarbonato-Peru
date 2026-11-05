'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock, Phone, UserCheck, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function VendedoraLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [identifier, setIdentifier] = useState('')
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    try {
      const cleanInput = identifier.trim().toLowerCase()
      const cleanPin = pin.trim()

      // Buscar coincidencia por ref_code o por número de teléfono
      const { data: seller, error } = await supabase
        .from('whatsapp_sellers')
        .select('*')
        .or(`ref_code.eq.${cleanInput},phone_number.ilike.%${cleanInput}%`)
        .eq('is_active', true)
        .maybeSingle()

      if (error || !seller) {
        setErrorMessage('Vendedora no encontrada o inactiva en el sistema.')
        setIsLoading(false)
        return
      }

      // Validar PIN (si no tiene PIN asignado, el por defecto es 1234)
      const validPin = seller.pin || '1234'
      if (cleanPin !== validPin) {
        setErrorMessage('El PIN ingresado es incorrecto.')
        setIsLoading(false)
        return
      }

      // Guardar sesión en localStorage para persistencia móvil
      localStorage.setItem('seller_session', JSON.stringify({
        id: seller.id,
        name: seller.name,
        phone_number: seller.phone_number,
        ref_code: seller.ref_code
      }))

      router.push('/vendedora/pedidos')
    } catch (err: any) {
      console.error('Error login vendedora:', err)
      setErrorMessage('Ocurrió un error al verificar credenciales.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-50 text-[#1B2A82] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <UserCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Portal de Ventas</h1>
          <p className="text-xs text-gray-500 font-semibold">
            Ingreso exclusivo para asesoras comerciales
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Código de Asesora o Celular *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Ej. gabriel o 924428558"
                className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-[#1B2A82] focus:ring-2 focus:ring-[#1B2A82]/20"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Ingresa tu nombre de enlace (ref_code) o tu número de WhatsApp.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              PIN de Acceso *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                maxLength={6}
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="••••"
                className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 bg-white tracking-widest focus:outline-none focus:border-[#1B2A82] focus:ring-2 focus:ring-[#1B2A82]/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#1B2A82] hover:bg-[#142066] text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? 'Verificando...' : 'Ingresar a mi Panel'}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-gray-100">
          <Link href="/" className="text-xs font-bold text-gray-400 hover:text-gray-600">
            ← Volver a la Tienda
          </Link>
        </div>
      </div>
    </div>
  )
}