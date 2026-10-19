'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { Phone, UserCheck, UserX, Plus, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function AdminVendedorasPage() {
  const [sellers, setSellers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('51')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const supabase = createClient()

  const fetchSellers = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('whatsapp_sellers')
      .select('*')
      .order('order_position', { ascending: true })

    if (!error && data) {
      setSellers(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchSellers()
  }, [])

  const handleAddSeller = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!name.trim() || phone.length < 9) {
      setErrorMessage('Ingrese un nombre válido y un número con formato 519XXXXXXXX')
      return
    }

    const { error } = await supabase.from('whatsapp_sellers').insert({
      name: name.trim(),
      phone_number: phone.trim(),
      is_active: true,
      order_position: sellers.length + 1
    })

    if (!error) {
      setName('')
      setPhone('51')
      setSuccessMessage('¡Vendedora agregada exitosamente!')
      fetchSellers()
    } else {
      console.error('Error Supabase Vendedoras:', error)
      setErrorMessage(`Error de BD: ${error.message}`)
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('whatsapp_sellers')
      .update({ is_active: !currentActive })
      .eq('id', id)

    if (!error) {
      setSellers(prev =>
        prev.map(s => (s.id === id ? { ...s, is_active: !currentActive } : s))
      )
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      <AdminHeader />

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-base font-extrabold text-gray-900 mb-1">Rotación de Vendedoras por WhatsApp</h2>
          <p className="text-xs text-gray-500 mb-4">
            El sistema distribuye los pedidos en orden equitativo (Round-Robin) entre las vendedoras en estado activo.
          </p>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Formulario con Alto Contraste Visual */}
          <form onSubmit={handleAddSeller} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 bg-slate-50 p-4 rounded-xl border">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nombre o Turno *</label>
              <input
                type="text"
                required
                placeholder="Ej: Ana (Turno Mañana)"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Celular WhatsApp (Con 51) *</label>
              <input
                type="tel"
                required
                placeholder="51987654321"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Vendedora</span>
              </button>
            </div>
          </form>

          {/* Lista de Vendedoras */}
          {isLoading ? (
            <div className="py-8 text-center text-xs text-gray-500 font-medium">Cargando vendedoras...</div>
          ) : sellers.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500 border rounded-xl bg-slate-50">
              No hay vendedoras registradas aún. Agrega la primera arriba.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sellers.map((seller, index) => (
                <div key={seller.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-extrabold text-xs">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{seller.name}</p>
                      <p className="text-xs text-gray-500 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        +{seller.phone_number}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleActive(seller.id, seller.is_active)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      seller.is_active
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                    }`}
                  >
                    {seller.is_active ? (
                      <>
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>Activa</span>
                      </>
                    ) : (
                      <>
                        <UserX className="w-4 h-4 text-rose-600" />
                        <span>Inactiva</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
