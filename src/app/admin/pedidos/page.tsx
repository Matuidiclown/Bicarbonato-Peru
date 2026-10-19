'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/Header'
import { RefreshCw, UserCheck, Trash2, RotateCcw, AlertTriangle } from 'lucide-react'

export default function AdminPedidosPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [loading, setLoading] = useState(true)

  // Cargar pedidos con la relación de la vendedora asignada
  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        whatsapp_sellers ( name, phone_number ),
        order_items ( id, product_name, quantity, subtotal )
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    setOrders(orders.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)))
  }

  const handleSoftDelete = async (orderId: string) => {
    if (confirm('¿Estás seguro de mover este pedido a la papelera? Se eliminará definitivamente tras 30 días.')) {
      await supabase
        .from('orders')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', orderId)

      setOrders(orders.filter(o => o.id !== orderId))
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'todos') return true
    return order.status.toLowerCase() === filterStatus.toLowerCase()
  })

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200">
          <div className="flex flex-wrap gap-2">
            {['todos', 'pendiente', 'confirmado', 'despachado', 'cancelado'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-4 py-2 rounded-xl text-xs font-black capitalize transition-all ${
                  filterStatus === st
                    ? 'bg-[#1B2A82] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st === 'todos' ? 'Todos' : st + 's'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-gray-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* LISTADO DE TARJETAS DE PEDIDOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-xs font-black text-emerald-700">Pedido #{order.id.slice(0, 6)}</span>
                  <span className="text-[10px] font-bold text-gray-400">
                    {new Date(order.created_at).toLocaleDateString('es-PE')}
                  </span>
                </div>

                {/* BADGE DE VENDEDORA ASIGNADA */}
                <div className="bg-blue-50 border border-blue-100 p-2 rounded-xl flex items-center justify-between text-xs font-bold text-[#1B2A82]">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Vendedora:</span>
                  </span>
                  <span>{order.whatsapp_sellers?.name || 'Gabriel (Asignada)'}</span>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{order.customer_name}</h3>
                  <p className="text-xs text-gray-500 font-medium">📞 {order.customer_phone}</p>
                  <p className="text-xs text-gray-500 font-medium">📍 {order.delivery_district} - {order.delivery_address}</p>
                </div>

                {/* DETALLE PRODUCTOS */}
                <div className="pt-2 border-t border-gray-100 space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Productos:</p>
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-xs font-semibold text-gray-700">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span>S/ {item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-sm font-black text-gray-900">
                  <span>Total:</span>
                  <span className="text-emerald-700 text-base">S/ {Number(order.total_amount).toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={order.status}
                    onChange={e => handleStatusChange(order.id, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold bg-white text-gray-800"
                  >
                    <option value="pendiente">🟡 Pendiente</option>
                    <option value="confirmado">🔵 Confirmado</option>
                    <option value="despachado">🟢 Despachado</option>
                    <option value="cancelado">🔴 Cancelado</option>
                  </select>

                  <button
                    onClick={() => handleSoftDelete(order.id)}
                    className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                    title="Mover a Papelera"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}