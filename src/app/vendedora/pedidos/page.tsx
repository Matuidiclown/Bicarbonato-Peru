'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Phone,
  MapPin,
  Clock,
  RefreshCw,
  LogOut,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  RotateCcw,
  MessageCircle,
  TrendingUp,
  PackageCheck,
  ShoppingBag
} from 'lucide-react'

export default function VendedoraPedidosPage() {
  const router = useRouter()
  const supabase = createClient()

  const [seller, setSeller] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showTrash, setShowTrash] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [deleteModalOrder, setDeleteModalOrder] = useState<any | null>(null)

  // 1. Validar sesión de vendedora
  useEffect(() => {
    const sessionRaw = localStorage.getItem('seller_session')
    if (!sessionRaw) {
      router.push('/vendedora/login')
      return
    }
    setSeller(JSON.parse(sessionRaw))
  }, [router])

  // 2. Cargar pedidos asignados a la vendedora
  const fetchOrders = async () => {
    if (!seller?.id) return
    setIsLoading(true)

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('seller_id', seller.id)
      .eq('is_deleted', showTrash)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (seller?.id) {
      fetchOrders()
    }
  }, [seller, showTrash])

  // 3. Manejo de estado del pedido
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (!error) {
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
    }
  }

  // 4. Mover a la papelera (Soft delete)
  const confirmSoftDelete = async () => {
    if (!deleteModalOrder) return

    const { error } = await supabase
      .from('orders')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', deleteModalOrder.id)

    if (!error) {
      setOrders(prev => prev.filter(o => o.id !== deleteModalOrder.id))
      setDeleteModalOrder(null)
    }
  }

  // 5. Restaurar pedido de la papelera
  const handleRestoreOrder = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({
        is_deleted: false,
        deleted_at: null
      })
      .eq('id', orderId)

    if (!error) {
      setOrders(prev => prev.filter(o => o.id !== orderId))
    }
  }

  // 6. Copiar enlace personalizado
  const handleCopyLink = () => {
    if (!seller?.ref_code) return
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://bicarbonatoperu.pe'
    const sellerUrl = `${currentOrigin}/?ref=${seller.ref_code}`

    navigator.clipboard.writeText(sellerUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  // 7. Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('seller_session')
    router.push('/vendedora/login')
  }

  // Cálculos de métricas
  const totalConfirmedSales = orders
    .filter(o => o.status === 'confirmed' || o.status === 'dispatched')
    .reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0)

  const pendingCount = orders.filter(o => o.status === 'pending').length

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => (o.status || '').toLowerCase() === statusFilter.toLowerCase())

  if (!seller) return null

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      {/* HEADER DE LA VENDEDORA */}
      <header className="bg-[#1B2A82] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-black text-sm">
              {seller.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-sm font-black leading-none">{seller.name}</h1>
              <span className="text-[10px] text-blue-200 font-semibold">
                Asesora Comercial | Ref: <span className="font-mono text-amber-300">@{seller.ref_code}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? '¡Enlace Copiado!' : 'Mi Link de Ventas'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-500/80 hover:bg-red-600 text-white p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* TARJETAS DE RENDIMIENTO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 block uppercase">Ventas Confirmadas</span>
              <span className="text-xl font-black text-gray-900">S/ {totalConfirmedSales.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 block uppercase">Pendientes de Cierre</span>
              <span className="text-xl font-black text-amber-600">{pendingCount} pedidos</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-[#1B2A82] rounded-xl flex items-center justify-center">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 block uppercase">Total Asignados</span>
              <span className="text-xl font-black text-gray-900">{orders.length} pedidos</span>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTROS Y ESTADOS */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {!showTrash ? (
              [
                { id: 'all', label: 'Todos' },
                { id: 'pending', label: 'Pendientes' },
                { id: 'confirmed', label: 'Confirmados' },
                { id: 'dispatched', label: 'Despachados' },
                { id: 'cancelled', label: 'Cancelados' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    statusFilter === f.id
                      ? 'bg-[#1B2A82] text-white shadow-sm'
                      : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))
            ) : (
              <span className="text-xs font-black text-red-600 uppercase flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> Papelera temporal (Autolimpieza en 30 días)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                setShowTrash(!showTrash)
                setStatusFilter('all')
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                showTrash
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {showTrash ? 'Ver Pedidos Activos' : 'Papelera'}
            </button>

            <button
              onClick={fetchOrders}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl"
              title="Actualizar pedidos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* LISTADO DE PEDIDOS */}
        {isLoading ? (
          <div className="bg-white p-12 rounded-3xl text-center text-xs font-bold text-gray-500">
            Cargando tus pedidos...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center text-xs font-semibold text-gray-500 border border-gray-200">
            {showTrash ? 'La papelera está vacía.' : 'No tienes pedidos en este estado.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOrders.map(order => {
              const numCode = String(order.order_number || order.id.slice(0, 4)).padStart(4, '0')
              const cleanPhone = (order.customer_phone || '').replace(/\D/g, '').slice(-9)
              const waUrl = `https://wa.me/51${cleanPhone}?text=${encodeURIComponent(
                `¡Hola ${order.customer_name}! Te saluda ${seller.name} de Bicarbonato Perú. Recibí tu pedido #${numCode} y te escribo para coordinar la entrega y despacho.`
              )}`

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-sm font-black text-[#1B2A82]">Pedido #{numCode}</span>
                      <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(order.created_at).toLocaleDateString('es-PE')}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <h3 className="font-extrabold text-sm text-gray-900">{order.customer_name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-bold flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#1B2A82]" />
                          {order.customer_phone}
                        </span>

                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>

                      <p className="text-gray-600 font-medium flex items-start gap-1 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#1B2A82] shrink-0 mt-0.5" />
                        <span>{order.district_name || order.delivery_district} - {order.address || order.delivery_address}</span>
                      </p>

                      {(order.notes || order.reference) && (
                        <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl mt-1 font-medium">
                          Ref: {order.notes || order.reference}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase">Detalle:</p>
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs text-gray-700">
                          <span>{item.quantity}x {item.product_name}</span>
                          <span className="font-bold">S/ {Number(item.subtotal || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500">Total a Cobrar:</span>
                      <span className="text-base font-black text-emerald-700">
                        S/ {Number(order.total_amount || 0).toFixed(2)}
                      </span>
                    </div>

                    {!showTrash ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={order.status || 'pending'}
                          onChange={e => handleUpdateStatus(order.id, e.target.value)}
                          className="flex-1 h-10 px-3 rounded-xl border border-gray-300 bg-white text-xs font-extrabold text-gray-800 focus:outline-none"
                        >
                          <option value="pending">🟡 Pendiente</option>
                          <option value="confirmed">🔵 Confirmado</option>
                          <option value="dispatched">🟢 Despachado</option>
                          <option value="cancelled">🔴 Cancelado</option>
                        </select>

                        <button
                          onClick={() => setDeleteModalOrder(order)}
                          className="h-10 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-colors"
                          title="Mover a papelera"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRestoreOrder(order.id)}
                        className="w-full h-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 border border-emerald-200"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Restaurar a Activos</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* MODAL CONFIRMACIÓN PAPELERA */}
        {deleteModalOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-gray-900 text-base">¿Mover pedido a la papelera?</h3>
                <p className="text-xs text-gray-500 font-medium">
                  El pedido de <span className="font-bold text-gray-800">{deleteModalOrder.customer_name}</span> se ocultará de tu lista activa y permanecerá en la papelera durante 30 días antes de su borrado definitivo.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDeleteModalOrder(null)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmSoftDelete}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md"
                >
                  Sí, Mover
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}