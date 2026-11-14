'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/admin/AdminHeader'
import {
  Phone,
  MapPin,
  Clock,
  RefreshCw,
  UserCheck,
  TrendingUp,
  Package,
  Sparkles,
  Trash2,
  AlertTriangle
} from 'lucide-react'

interface Seller {
  id: string
  name: string
  phone_number: string
  ref_code?: string
}

export default function AdminDashboardPage() {
  const supabase = createClient()

  const [orders, setOrders] = useState<any[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filtros
  const [statusFilter, setStatusFilter] = useState('all')
  const [sellerFilter, setSellerFilter] = useState('all')

  // Modal para eliminar (Soft delete)
  const [orderToDelete, setOrderToDelete] = useState<any | null>(null)

  // 1. Cargar Vendedoras y Pedidos con relación
  const fetchData = async () => {
    setIsLoading(true)

    // Cargar vendedoras
    const { data: sellersData } = await supabase
      .from('whatsapp_sellers')
      .select('id, name, phone_number, ref_code')
      .order('name', { ascending: true })

    if (sellersData) {
      setSellers(sellersData)
    }

    // Cargar pedidos vinculando los datos de la vendedora asignada
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select(`
        *,
        whatsapp_sellers ( id, name, phone_number, ref_code ),
        order_items (*)
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (!error && ordersData) {
      setOrders(ordersData)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 2. Cambio de estado
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
    }
  }

  // 3. Confirmar eliminación suave
  const confirmSoftDelete = async () => {
    if (!orderToDelete) return

    const { error } = await supabase
      .from('orders')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', orderToDelete.id)

    if (!error) {
      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id))
      setOrderToDelete(null)
    }
  }

  // 4. Filtrado combinado (Por Estado y Por Vendedora)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchStatus =
        statusFilter === 'all' ||
        (order.status || '').toLowerCase() === statusFilter.toLowerCase()

      const matchSeller =
        sellerFilter === 'all' || order.seller_id === sellerFilter

      return matchStatus && matchSeller
    })
  }, [orders, statusFilter, sellerFilter])

  // 5. Métricas reactivas según el filtro seleccionado
  const { totalSoles, confirmedCount, highValueOrdersCount } = useMemo(() => {
    let soles = 0
    let confirmed = 0
    let highValue = 0

    filteredOrders.forEach((o) => {
      const amount = Number(o.total_amount || 0)
      soles += amount
      if (o.status === 'confirmed' || o.status === 'dispatched') {
        confirmed++
      }
      if (amount >= 100) {
        highValue++
      }
    })

    return {
      totalSoles: soles,
      confirmedCount: confirmed,
      highValueOrdersCount: highValue
    }
  }, [filteredOrders])

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* BANNER DE MÉTRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">
                Monto Filtrado
              </span>
              <span className="text-xl font-black text-gray-900">
                S/ {totalSoles.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-[#1B2A82] rounded-xl flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">
                Pedidos en Pantalla
              </span>
              <span className="text-xl font-black text-[#1B2A82]">
                {filteredOrders.length} pedidos
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">
                Ventas Altas (S/ 100+)
              </span>
              <span className="text-xl font-black text-amber-600">
                {highValueOrdersCount} clientes top
              </span>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          {/* Filtro por Vendedora */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-700 uppercase whitespace-nowrap">
              Vendedora:
            </span>
            <select
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-gray-300 bg-slate-50 text-xs font-extrabold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B2A82]"
            >
              <option value="all">👥 Todas las Vendedoras ({orders.length})</option>
              {sellers.map((s) => {
                const count = orders.filter((o) => o.seller_id === s.id).length
                return (
                  <option key={s.id} value={s.id}>
                    👤 {s.name} ({count} pedidos)
                  </option>
                )
              })}
            </select>
          </div>

          {/* Filtro por Estado */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pending', label: 'Pendientes' },
              { id: 'confirmed', label: 'Confirmados' },
              { id: 'dispatched', label: 'Despachados' },
              { id: 'cancelled', label: 'Cancelados' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  statusFilter === f.id
                    ? 'bg-[#1B2A82] text-white shadow-sm'
                    : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}

            <button
              onClick={fetchData}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl transition-colors ml-2 shrink-0"
              title="Actualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* LISTADO DE PEDIDOS */}
        {isLoading ? (
          <div className="bg-white p-12 rounded-3xl text-center text-xs font-bold text-gray-500">
            Cargando pedidos desde Supabase...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center text-xs font-semibold text-gray-500 border border-gray-200">
            No se encontraron pedidos con los filtros seleccionados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOrders.map((order) => {
              const codeStr = String(order.order_number || order.id.slice(0, 4)).padStart(4, '0')
              const assignedSellerName =
                order.whatsapp_sellers?.name ||
                sellers.find((s) => s.id === order.seller_id)?.name ||
                'Rotación General'

              const sellerPhone = order.whatsapp_sellers?.phone_number || order.assigned_seller_phone || ''
              const isHighTicket = Number(order.total_amount || 0) >= 100

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-3xl p-5 border shadow-sm flex flex-col justify-between space-y-4 transition-shadow hover:shadow-md ${
                    isHighTicket ? 'border-amber-300 ring-2 ring-amber-200/50' : 'border-gray-200'
                  }`}
                >
                  <div className="space-y-3">
                    {/* CABECERA CON NÚMERO Y FECHA */}
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-[#1B2A82]">
                          Pedido #{codeStr}
                        </span>
                        {isHighTicket && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                            Top Venta
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(order.created_at).toLocaleDateString('es-PE')}
                      </span>
                    </div>

                    {/* BADGE: VENDEDORA ASIGNADA */}
                    <div className="bg-blue-50 border border-blue-200/70 p-2.5 rounded-2xl flex items-center justify-between text-xs font-extrabold text-[#1B2A82]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#1B2A82] text-white flex items-center justify-center font-black text-[10px]">
                          <UserCheck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase block leading-none font-bold">
                            Atendido por:
                          </span>
                          <span className="text-xs font-black text-gray-900">
                            {assignedSellerName}
                          </span>
                        </div>
                      </div>

                      {sellerPhone && (
                        <span className="text-[11px] font-mono text-gray-500">
                          +{sellerPhone.replace(/\D/g, '')}
                        </span>
                      )}
                    </div>

                    {/* DATOS DEL CLIENTE */}
                    <div className="space-y-1 text-xs">
                      <h3 className="font-extrabold text-sm text-gray-900">
                        {order.customer_name}
                      </h3>
                      <p className="text-gray-600 font-bold flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-[#1B2A82]" />
                        {order.customer_phone}
                      </p>
                      <p className="text-gray-600 font-medium flex items-start gap-1 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#1B2A82] shrink-0 mt-0.5" />
                        <span>
                          {order.district_name} -{' '}
                          {order.address}
                        </span>
                      </p>

                      {order.reference && (
                        <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl mt-1 font-medium">
                          Ref: {order.reference}
                        </p>
                      )}
                    </div>

                    {/* DETALLE DE PRODUCTOS */}
                    <div className="pt-2 border-t border-gray-100 space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase">
                        Detalle:
                      </p>
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs text-gray-700">
                          <span>
                            {item.quantity}x {item.product_name}
                          </span>
                          <span className="font-bold">
                            S/ {Number(item.subtotal || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* TOTAL Y ACCIONES */}
                  <div className="pt-3 border-t border-gray-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500">Total a Cobrar:</span>
                      <span className="text-base font-black text-emerald-700">
                        S/ {Number(order.total_amount || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={order.status || 'pending'}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className="flex-1 h-10 px-3 rounded-xl border border-gray-300 bg-white text-xs font-extrabold text-gray-800 focus:outline-none"
                      >
                        <option value="pending">🟡 Pendiente</option>
                        <option value="confirmed">🔵 Confirmado</option>
                        <option value="dispatched">🟢 Despachado</option>
                        <option value="cancelled">🔴 Cancelado</option>
                      </select>

                      <button
                        onClick={() => setOrderToDelete(order)}
                        className="h-10 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-colors"
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

        {/* MODAL CONFIRMACIÓN PAPELERA */}
        {orderToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-gray-900 text-base">¿Eliminar este pedido?</h3>
                <p className="text-xs text-gray-500 font-medium">
                  El pedido de <span className="font-bold text-gray-800">{orderToDelete.customer_name}</span> se moverá a la papelera.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setOrderToDelete(null)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmSoftDelete}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}