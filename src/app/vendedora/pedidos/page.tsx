'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/Header'
import { RefreshCw, Trash2, AlertTriangle, Archive, CheckCircle2 } from 'lucide-react'

export default function VendedoraPanelPage() {
  const supabase = createClient()

  const [sellers, setSellers] = useState<any[]>([])
  const [selectedSellerId, setSelectedSellerId] = useState<string>('')
  const [orders, setOrders] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [loading, setLoading] = useState(false)
  const [viewTrash, setViewTrash] = useState(false)

  // Modal confirmación eliminación
  const [deleteModalOrder, setDeleteModalOrder] = useState<any | null>(null)

  useEffect(() => {
    const fetchSellers = async () => {
      const { data } = await supabase.from('whatsapp_sellers').select('*').eq('is_active', true)
      if (data && data.length > 0) {
        setSellers(data)
        setSelectedSellerId(data[0].id)
      }
    }
    fetchSellers()
  }, [])

  const fetchSellerOrders = async () => {
    if (!selectedSellerId) return
    setLoading(true)

    const query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('is_deleted', viewTrash)
      .order('created_at', { ascending: false })

    if (selectedSellerId !== 'all') {
      query.eq('seller_id', selectedSellerId)
    }

    const { data } = await query
    if (data) setOrders(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchSellerOrders()
  }, [selectedSellerId, viewTrash])

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    setOrders(orders.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)))
  }

  const confirmSoftDelete = async () => {
    if (!deleteModalOrder) return

    await supabase
      .from('orders')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', deleteModalOrder.id)

    setOrders(orders.filter(o => o.id !== deleteModalOrder.id))
    setDeleteModalOrder(null)
  }

  const restoreOrder = async (orderId: string) => {
    await supabase
      .from('orders')
      .update({ is_deleted: false, deleted_at: null })
      .eq('id', orderId)

    setOrders(orders.filter(o => o.id !== orderId))
  }

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'todos') return true
    return o.status.toLowerCase() === filterStatus.toLowerCase()
  })

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* SELECTOR DE VENDEDORA Y NAVEGACIÓN */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-black text-gray-900">Panel de Atención - Vendedoras</h1>
            <p className="text-xs text-gray-500 font-semibold">
              Gestión exclusiva de pedidos y seguimiento por WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedSellerId}
              onChange={e => setSelectedSellerId(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-white text-gray-800"
            >
              {sellers.map(s => (
                <option key={s.id} value={s.id}>
                  👤 Vendedora: {s.name} ({s.phone_number})
                </option>
              ))}
            </select>

            <button
              onClick={() => setViewTrash(!viewTrash)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                viewTrash
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>{viewTrash ? 'Ver Pedidos Activos' : 'Papelera (30 días)'}</span>
            </button>
          </div>
        </div>

        {/* FILTROS DE ESTADO */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200">
          <div className="flex flex-wrap gap-2">
            {['todos', 'pendiente', 'confirmado', 'despachado', 'cancelado'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-4 py-2 rounded-xl text-xs font-black capitalize ${
                  filterStatus === st ? 'bg-[#1B2A82] text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {st === 'todos' ? 'Todos' : st + 's'}
              </button>
            ))}
          </div>

          <button onClick={fetchSellerOrders} className="p-2 bg-gray-100 rounded-xl">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* LISTADO DE PEDIDOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-xs font-black text-[#1B2A82]">Pedido #{order.id.slice(0, 6)}</span>
                  <span className="text-[10px] font-bold text-gray-400">
                    {new Date(order.created_at).toLocaleDateString('es-PE')}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{order.customer_name}</h3>
                  <p className="text-xs text-gray-500 font-medium">📞 {order.customer_phone}</p>
                  <p className="text-xs text-gray-500 font-medium">📍 {order.delivery_district} - {order.delivery_address}</p>
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-1">
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

                {!viewTrash ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={order.status}
                      onChange={e => handleStatusChange(order.id, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold bg-white"
                    >
                      <option value="pendiente">🟡 Pendiente</option>
                      <option value="confirmado">🔵 Confirmado</option>
                      <option value="despachado">🟢 Despachado</option>
                      <option value="cancelado">🔴 Cancelado</option>
                    </select>

                    <button
                      onClick={() => setDeleteModalOrder(order)}
                      className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl"
                      title="Mover a Papelera"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => restoreOrder(order.id)}
                    className="w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Restaurar Pedido</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* MODAL DE CONFIRMACIÓN MOVER A PAPELERA */}
        {deleteModalOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl text-center">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-base">¿Mover a la papelera?</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  El pedido del cliente <span className="font-bold text-gray-800">{deleteModalOrder.customer_name}</span> se moverá a la papelera y se eliminará automáticamente en **30 días**.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteModalOrder(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-extrabold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmSoftDelete}
                  className="flex-1 py-3 bg-red-600 text-white font-extrabold text-xs rounded-xl shadow-md"
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