'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ShoppingBag,
  Phone,
  MessageCircle,
  Copy,
  Check,
  LogOut,
  RefreshCw,
  Trash2,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Calendar,
  AlertCircle
} from 'lucide-react'

interface OrderItem {
  id: string
  product_name: string
  presentation: string
  quantity: number
  applied_unit_price: number
  subtotal: number
}

interface Order {
  id: string
  order_number: number
  created_at: string
  customer_name: string
  customer_phone: string
  district_name: string | null
  address: string
  reference: string | null
  total_amount: number
  status: 'pending' | 'confirmed' | 'dispatched' | 'cancelled'
  seller_id: string | null
  is_deleted: boolean
  order_items: OrderItem[]
}

interface SellerSession {
  id: string
  name: string
  phone_number: string
  ref_code: string | null
}

export default function VendedoraPedidosPage() {
  const router = useRouter()
  const supabase = createClient()

  const [seller, setSeller] = useState<SellerSession | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [copiedLink, setCopiedLink] = useState(false)
  const [actionSuccess, setActionSuccess] = useState('')

  // 1. Validar autenticación de sesión de la asesora
  useEffect(() => {
    // Compatibilidad para ambas claves
    const rawSession =
      localStorage.getItem('seller_session') ||
      localStorage.getItem('vendedora_session')

    if (!rawSession) {
      router.push('/vendedora/login')
      return
    }

    try {
      const parsedSession: SellerSession = JSON.parse(rawSession)
      if (!parsedSession.id) {
        router.push('/vendedora/login')
        return
      }
      setSeller(parsedSession)
    } catch {
      router.push('/vendedora/login')
    }
  }, [router])

  // 2. Cargar pedidos asignados a esta asesora
  const fetchMyOrders = async (sellerId: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('seller_id', sellerId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error al cargar pedidos:', error.message)
      } else if (data) {
        setOrders(data as Order[])
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (seller?.id) {
      fetchMyOrders(seller.id)
    }
  }, [seller])

  // 3. Cambiar estado del pedido
  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (!error) {
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
      setActionSuccess('Estado del pedido actualizado.')
      setTimeout(() => setActionSuccess(''), 2500)
    }
  }

  // 4. Mover a papelera temporal (30 días de retención)
  const handleMoveToTrash = async (orderId: string, orderNumber: number) => {
    const confirmDelete = confirm(
      `¿Mover el Pedido #${String(orderNumber).padStart(4, '0')} a la papelera? Se conservará por 30 días.`
    )
    if (!confirmDelete) return

    const { error } = await supabase
      .from('orders')
      .update({ is_deleted: true })
      .eq('id', orderId)

    if (!error) {
      setOrders(prev => prev.filter(o => o.id !== orderId))
      setActionSuccess('Pedido enviado a la papelera temporal.')
      setTimeout(() => setActionSuccess(''), 2500)
    }
  }

  // 5. Copiar enlace único de campaña
  const handleCopyMyLink = () => {
    if (!seller) return
    const refCode = seller.ref_code || seller.name.toLowerCase().trim().replace(/\s+/g, '')
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bicarbonatoperu.pe'
    const fullUrl = `${origin}/?ref=${refCode}`

    navigator.clipboard.writeText(fullUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleLogout = () => {
    localStorage.removeItem('seller_session')
    localStorage.removeItem('vendedora_session')
    router.push('/vendedora/login')
  }

  // Filtros y Métricas
  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus)

  const totalVentas = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
  const pendingCount = orders.filter(o => o.status === 'pending').length

  if (!seller) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-xs font-bold text-gray-500">Verificando sesión...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-16">
      {/* HEADER EXCLUSIVO VENDEDORA */}
      <header className="bg-[#1B2A82] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white text-[#1B2A82] rounded-2xl flex items-center justify-center font-black text-sm shadow-sm">
              BP
            </div>
            <div>
              <span className="text-xs font-black block leading-none">Portal Comercial</span>
              <span className="text-[11px] text-blue-200 font-bold block">{seller.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchMyOrders(seller.id)}
              className="p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title="Actualizar pedidos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors border border-white/10"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6 flex-1 w-full">
        {/* BANNER DE BIENVENIDA Y LINK DE CAMPAÑA */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-black text-gray-900 leading-tight">
              Mis Pedidos Asignados
            </h1>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              Aquí recibes los pedidos que entran por tu enlace de publicidad o por turno rotativo.
            </p>
          </div>

          {/* BOTÓN COPIAR ENLACE PERSONALIZADO */}
          <button
            onClick={handleCopyMyLink}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-sm ${
              copiedLink
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-50 text-[#1B2A82] hover:bg-blue-100 border border-blue-200'
            }`}
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? '¡Enlace Copiado!' : `Copiar mi link (?ref=${seller.ref_code || seller.name.toLowerCase()})`}</span>
          </button>
        </div>

        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* MÉTRICAS RÁPIDAS */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Total Ventas</span>
            <span className="text-lg sm:text-xl font-black text-gray-900">S/ {totalVentas.toFixed(2)}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Total Pedidos</span>
            <span className="text-lg sm:text-xl font-black text-[#1B2A82]">{orders.length}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Por Atender</span>
            <span className="text-lg sm:text-xl font-black text-amber-600">{pendingCount}</span>
          </div>
        </div>

        {/* FILTROS POR ESTADO */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'pending', label: 'Pendientes' },
            { id: 'confirmed', label: 'Confirmados' },
            { id: 'dispatched', label: 'Despachados' },
            { id: 'cancelled', label: 'Cancelados' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                filterStatus === f.id
                  ? 'bg-[#1B2A82] text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* LISTADO DE PEDIDOS */}
        {isLoading ? (
          <div className="py-16 text-center text-xs font-bold text-gray-400">
            Cargando tus pedidos...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center text-xs font-semibold text-gray-500 border border-gray-200 space-y-2">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-bold text-gray-700">No hay pedidos registrados en este estado.</p>
            <p>Comparte tu enlace de campaña en tus redes o WhatsApp para recibir ventas directas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const codeStr = String(order.order_number || 0).padStart(4, '0')
              const rawCustPhone = (order.customer_phone || '').replace(/\D/g, '').slice(-9)
              const waCustUrl = `https://api.whatsapp.com/send?phone=51${rawCustPhone}&text=${encodeURIComponent(
                `Hola ${order.customer_name}, te saluda ${seller.name} de Bicarbonato Perú sobre tu pedido #${codeStr}.`
              )}`

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-5 border border-gray-200/90 shadow-sm space-y-4 hover:shadow-md transition-shadow"
                >
                  {/* CABECERA DEL PEDIDO */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm bg-blue-50 text-[#1B2A82] px-2.5 py-1 rounded-xl border border-blue-200">
                        #{codeStr}
                      </span>
                      <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(order.created_at).toLocaleString('es-PE', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>

                    {/* SELECTOR DE ESTADO */}
                    <div className="flex items-center gap-2">
                      <select
                        value={order.status}
                        onChange={e => handleUpdateStatus(order.id, e.target.value as Order['status'])}
                        className={`text-xs font-black px-3 py-1.5 rounded-xl border focus:outline-none ${
                          order.status === 'pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : order.status === 'confirmed'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : order.status === 'dispatched'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-red-50 text-red-800 border-red-300'
                        }`}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="dispatched">Despachado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>

                      <button
                        onClick={() => handleMoveToTrash(order.id, order.order_number)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Mover a papelera temporal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* DATOS DEL CLIENTE Y CONTACTO */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
                    <div className="space-y-1">
                      <span className="font-black text-gray-900 text-sm block">{order.customer_name}</span>
                      <span className="text-gray-600 block">
                        📍 {order.district_name} - {order.address}
                      </span>
                      {order.reference && (
                        <span className="text-gray-400 text-[11px] block italic">
                          Ref: {order.reference}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:items-end justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-800 text-sm">{order.customer_phone}</span>
                        <a
                          href={waCustUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Abrir WhatsApp</span>
                        </a>
                      </div>

                      <span className="text-base font-black text-gray-900">
                        Total: S/ {Number(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* DESGLOSE DE PRODUCTOS COMPRADOS */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-2xl border border-gray-100 text-xs space-y-1">
                      <span className="text-[10px] font-black uppercase text-gray-400 block pb-1">
                        Detalle de Productos:
                      </span>
                      {order.order_items.map((item, idx) => (
                        <div key={item.id || idx} className="flex justify-between text-gray-700 font-medium">
                          <span>
                            • {item.quantity} x {item.product_name} ({item.presentation})
                          </span>
                          <span className="font-bold text-gray-900">
                            S/ {Number(item.subtotal || item.applied_unit_price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}