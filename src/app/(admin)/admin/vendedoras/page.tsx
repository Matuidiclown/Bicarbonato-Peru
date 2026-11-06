'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/admin/AdminHeader'
import {
  Users,
  Plus,
  Phone,
  KeyRound,
  Link as LinkIcon,
  Check,
  Copy,
  Edit2,
  Trash2,
  Power,
  ShieldCheck,
  AlertCircle,
  X
} from 'lucide-react'

interface Seller {
  id: string
  name: string
  phone_number: string
  ref_code: string | null
  pin: string | null
  is_active: boolean
  order_position: number
  last_assigned_at: string | null
}

export default function AdminVendedorasPage() {
  const router = useRouter()
  const supabase = createClient()

  const [sellers, setSellers] = useState<Seller[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Estado para modal de creación / edición
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    ref_code: '',
    pin: '1234'
  })

  // 1. Cargar lista de vendedoras
  const fetchSellers = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('whatsapp_sellers')
      .select('*')
      .order('order_position', { ascending: true })

    if (error) {
      setErrorMessage(`Error al cargar vendedoras: ${error.message}`)
    } else if (data) {
      setSellers(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchSellers()
  }, [])

  // 2. Abrir modal para crear
  const handleOpenCreateModal = () => {
    setEditingSellerId(null)
    setFormData({
      name: '',
      phone_number: '',
      ref_code: '',
      pin: '1234'
    })
    setErrorMessage('')
    setIsModalOpen(true)
  }

  // 3. Abrir modal para editar
  const handleOpenEditModal = (seller: Seller) => {
    setEditingSellerId(seller.id)
    setFormData({
      name: seller.name,
      phone_number: seller.phone_number,
      ref_code: seller.ref_code || '',
      pin: seller.pin || '1234'
    })
    setErrorMessage('')
    setIsModalOpen(true)
  }

  // 4. Guardar (Insertar o Actualizar)
  const handleSaveSeller = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const cleanRef = formData.ref_code.trim().toLowerCase().replace(/\s+/g, '')
    const cleanPhone = formData.phone_number.trim()
    const cleanName = formData.name.trim()
    const cleanPin = formData.pin.trim()

    if (!cleanName || !cleanPhone || !cleanRef || !cleanPin) {
      setErrorMessage('Todos los campos son obligatorios.')
      return
    }

    try {
      if (editingSellerId) {
        // Actualizar
        const { error } = await supabase
          .from('whatsapp_sellers')
          .update({
            name: cleanName,
            phone_number: cleanPhone,
            ref_code: cleanRef,
            pin: cleanPin
          })
          .eq('id', editingSellerId)

        if (error) throw error
        setSuccessMessage('Vendedora actualizada correctamente.')
      } else {
        // Crear
        const nextPosition = sellers.length + 1
        const { error } = await supabase
          .from('whatsapp_sellers')
          .insert({
            name: cleanName,
            phone_number: cleanPhone,
            ref_code: cleanRef,
            pin: cleanPin,
            is_active: true,
            order_position: nextPosition
          })

        if (error) throw error
        setSuccessMessage('Vendedora registrada con éxito.')
      }

      setIsModalOpen(false)
      fetchSellers()
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar la vendedora.')
    }
  }

  // 5. Conmutar estado activo / inactivo
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('whatsapp_sellers')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (!error) {
      setSellers(prev =>
        prev.map(s => (s.id === id ? { ...s, is_active: !currentStatus } : s))
      )
    }
  }

  // 6. Eliminar vendedora
  const handleDeleteSeller = async (id: string, name: string) => {
    if (!confirm(`¿Seguro que deseas eliminar a ${name}? Esta acción no se puede deshacer.`)) {
      return
    }

    const { error } = await supabase
      .from('whatsapp_sellers')
      .delete()
      .eq('id', id)

    if (!error) {
      setSellers(prev => prev.filter(s => s.id !== id))
      setSuccessMessage(`Vendedora ${name} eliminada.`)
    } else {
      setErrorMessage(`No se pudo eliminar: ${error.message}`)
    }
  }

  // 7. Copiar link de campaña individual
  const handleCopyLink = (seller: Seller) => {
    const ref = seller.ref_code || seller.name.toLowerCase().trim()
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://bicarbonatoperu.pe'
    const sellerUrl = `${currentOrigin}/?ref=${ref}`

    navigator.clipboard.writeText(sellerUrl)
    setCopiedId(seller.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-16">
      <AdminHeader />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6 flex-1 w-full">
        {/* ENCABEZADO DE SECCIÓN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-[#1B2A82]" />
              <span>Equipo de Vendedoras</span>
            </h1>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              Administra los enlaces de publicidad de Meta Ads, credenciales PIN y rotación de WhatsApp.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="bg-[#1B2A82] hover:bg-[#142066] text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Vendedora</span>
          </button>
        </div>

        {/* MENSAJES DE ESTADO */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-2xl flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TABLA DE ASESORAS */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs font-bold text-gray-400">
              Cargando lista de vendedoras...
            </div>
          ) : sellers.length === 0 ? (
            <div className="p-12 text-center text-xs font-semibold text-gray-500">
              No hay vendedoras registradas. Haz clic en "Nueva Vendedora" para comenzar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-gray-200 text-gray-400 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Asesora</th>
                    <th className="px-5 py-3.5">WhatsApp</th>
                    <th className="px-5 py-3.5">Código Enlace (ref)</th>
                    <th className="px-5 py-3.5">PIN</th>
                    <th className="px-5 py-3.5">Estado Rotación</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                  {sellers.map((seller) => (
                    <tr key={seller.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-extrabold text-sm text-gray-900">{seller.name}</div>
                        <span className="text-[10px] text-gray-400 font-medium">Turno #{seller.order_position}</span>
                      </td>

                      <td className="px-5 py-4 font-mono font-bold text-gray-800">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{seller.phone_number}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="bg-blue-50 text-[#1B2A82] border border-blue-200 px-2 py-1 rounded-lg font-mono font-extrabold text-[11px]">
                          ?ref={seller.ref_code || 'no-asignado'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="bg-slate-100 text-gray-700 px-2 py-1 rounded-lg font-mono font-extrabold text-[11px] flex items-center gap-1 w-max">
                          <KeyRound className="w-3 h-3 text-gray-400" />
                          <span>{seller.pin || '1234'}</span>
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleActive(seller.id, seller.is_active)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 transition-all ${
                            seller.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{seller.is_active ? 'Activa en Turno' : 'En Pausa'}</span>
                        </button>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copiar enlace */}
                          <button
                            onClick={() => handleCopyLink(seller)}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors border border-emerald-200"
                            title="Copiar enlace personalizado de campaña"
                          >
                            {copiedId === seller.id ? (
                              <Check className="w-4 h-4 text-emerald-700" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => handleOpenEditModal(seller)}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-[#1B2A82] rounded-xl transition-colors border border-blue-200"
                            title="Editar datos y PIN"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => handleDeleteSeller(seller.id, seller.name)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors border border-red-200"
                            title="Eliminar vendedora"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL CREAR / EDITAR */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#1B2A82]" />
                  <span>{editingSellerId ? 'Editar Vendedora' : 'Registrar Nueva Vendedora'}</span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSeller} className="space-y-3.5 text-xs font-semibold">
                <div>
                  <label className="block text-gray-700 mb-1 font-bold">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Ana Morales"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-[#1B2A82]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1 font-bold">Número Celular WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    value={formData.phone_number}
                    onChange={e => setFormData({ ...formData, phone_number: e.target.value.replace(/\D/g, '') })}
                    placeholder="Ej. 999999999 o 51999999999"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-[#1B2A82]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Número donde le llegarán los mensajes automáticos de pedido de los clientes.
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-1 font-bold">Código de Enlace (`ref_code`) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-gray-400 text-xs">?ref=</span>
                    <input
                      type="text"
                      required
                      value={formData.ref_code}
                      onChange={e => setFormData({ ...formData, ref_code: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      placeholder="ana"
                      className="w-full pl-14 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-[#1B2A82]"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Palabra corta y única en minúsculas para sus campañas de Meta Ads (ej. <code>ana</code>, <code>gabriel</code>).
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-1 font-bold">PIN de Acceso al Panel Comercial *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.pin}
                    onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                    placeholder="1234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-[#1B2A82] tracking-widest font-mono"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Clave numérica de 4 a 6 dígitos con la que ingresa a <code>/vendedora/login</code>.
                  </p>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#1B2A82] hover:bg-[#142066] text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
                  >
                    {editingSellerId ? 'Guardar Cambios' : 'Crear Vendedora'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
