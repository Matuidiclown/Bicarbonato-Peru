'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { Trash2, RefreshCw, Clock, Phone, MapPin } from 'lucide-react'

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const supabase = createClient()

  // Obtener solo los pedidos activos (que no estén eliminados)
  const fetchOrders = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Actualizar estado del pedido
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

  // Eliminar pedido (Mover a la papelera con borrado suave)
  const handleDeleteOrder = async (orderId: string, orderNumber: any) => {
    const formattedNum = String(orderNumber || '').padStart(4, '0')
    if (!confirm(`¿Estás seguro de eliminar el Pedido #${formattedNum}?`)) return

    const { error } = await supabase
      .from('orders')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (!error) {
      setOrders(prev => prev.filter(o => o.id !== orderId))
    } else {
      alert('Ocurrió un error al intentar eliminar el pedido.')
    }
  }

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => (o.status || '').toLowerCase() === statusFilter.toLowerCase())

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Barra de Filtros y Recarga */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <span className="text-xs font-black text-gray-500 uppercase">ESTADO:</span>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pending', label: 'Pendientes' },
              { id: 'confirmed', label: 'Confirmados' },
              { id: 'dispatched', label: 'Despachados' },
              { id: 'cancelled', label: 'Cancelados' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  statusFilter === f.id
                    ? 'bg-[#1B2A82] text-white shadow-sm'
                    : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors w-full sm:w-auto justify-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Lista de Pedidos */}
        {isLoading ? (
          <div className="bg-white p-12 rounded-2xl text-center text-xs font-bold text-gray-500">
            Cargando pedidos...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center text-xs font-medium text-gray-500 border border-slate-200">
            No se encontraron pedidos en este estado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOrders.map(order => {
              const numCode = String(order.order_number || order.id.slice(0, 4)).padStart(4, '0')

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Encabezado Pedido */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className="text-base font-black text-[#1B2A82]">
                        Pedido #{numCode}
                      </span>
                      <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(order.created_at).toLocaleDateString('es-PE')}
                      </span>
                    </div>

                    {/* Datos del Cliente */}
                    <div className="space-y-1 text-xs text-gray-700">
                      <p className="font-extrabold text-sm text-gray-900">{order.customer_name}</p>
                      <p className="flex items-center gap-1.5 text-gray-600 font-bold">
                        <Phone className="w-3.5 h-3.5 text-[#1B2A82]" />
                        {order.customer_phone}
                      </p>
                      <p className="flex items-start gap-1.5 text-gray-600 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-[#1B2A82] shrink-0 mt-0.5" />
                        <span>{order.district_name || order.delivery_district} - {order.address || order.delivery_address}</span>
                      </p>
                    </div>

                    {/* Ítems del Pedido */}
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase">Productos:</p>
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs text-gray-800 font-medium">
                          <span>{item.quantity}x {item.product_name}</span>
                          <span className="font-bold">S/ {Number(item.subtotal || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer con Total, Estado y Botón Eliminar */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500">Total:</span>
                      <span className="text-base font-black text-emerald-700">
                        S/ {Number(order.total_amount || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={order.status || 'pending'}
                        onChange={e => handleUpdateStatus(order.id, e.target.value)}
                        className="flex-1 h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs font-extrabold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B2A82]/20"
                      >
                        <option value="pending">🟡 Pendiente</option>
                        <option value="pending">🟡 Pendiente</option>
                        <option value="confirmed">🔵 Confirmado</option>
                        <option value="dispatched">🟢 Despachado</option>
                        <option value="cancelled">🔴 Cancelado</option>
                      </select>

                      <button
                        onClick={() => handleDeleteOrder(order.id, order.order_number)}
                        className="h-10 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors border border-red-200 flex items-center justify-center shrink-0"
                        title="Eliminar pedido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}