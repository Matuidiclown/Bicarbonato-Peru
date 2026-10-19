'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Lock, Mail, AlertCircle, ShieldCheck } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      })

      if (error) {
        console.error('Error detallado de Supabase Auth:', error)
        // Mostramos el mensaje exacto que devuelve la API de Supabase
        setErrorMessage(`Error de Supabase: ${error.message}`)
        setIsLoading(false)
        return
      }

      if (data.user) {
        router.push('/admin/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado al conectar.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Panel de Administración</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Gestión de Pedidos y Catálogo</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
              <input
                type="email"
                required
                placeholder="dsebastiansm1210@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Contraseña</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold rounded-xl shadow-lg disabled:opacity-50 transition-all text-base mt-2"
          >
            {isLoading ? 'Verificando acceso...' : 'Ingresar al Panel'}
          </button>
        </form>
      </div>
    </div>
  )
}
