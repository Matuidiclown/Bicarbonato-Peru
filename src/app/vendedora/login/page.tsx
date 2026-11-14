'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock, Mail, UserCheck, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function VendedoraLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error || !data.user) {
        setErrorMessage('Correo o contraseña incorrectos.')
        return
      }

      // Solo las cuentas marcadas como vendedora pueden entrar a este portal.
      if (data.user.app_metadata?.role !== 'seller') {
        await supabase.auth.signOut()
        setErrorMessage('Esta cuenta no tiene acceso al portal de ventas.')
        return
      }

      router.push('/vendedora/pedidos')
      router.refresh()
    } catch (err) {
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
              Correo electrónico *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-[#1B2A82] focus:ring-2 focus:ring-[#1B2A82]/20"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Usa el correo con el que te creó tu acceso el administrador.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Contraseña *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-[#1B2A82] focus:ring-2 focus:ring-[#1B2A82]/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#1B2A82] hover:bg-[#142066] text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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