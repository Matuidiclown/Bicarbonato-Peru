'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/useCartStore'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/Header'
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  Send,
  ShieldCheck,
  AlertCircle,
  Tag,
  MapPin,
  User,
  Phone,
  FileText,
  Truck,
  Info
} from 'lucide-react'

// Emojis declarados por puntos de código hexadecimal Unicode
// Inmunes a cualquier tipo de corrupción de archivo, consola o compilador
const EMOJI = {
  DOC: String.fromCodePoint(0x1F4C4),     // 📄
  USER: String.fromCodePoint(0x1F464),    // 👤
  PHONE: String.fromCodePoint(0x1F4F1),   // 📱
  PIN: String.fromCodePoint(0x1F4CD),     // 📍
  TRUCK: String.fromCodePoint(0x1F69A),   // 🚚
  CASH: String.fromCodePoint(0x1F4B5),    // 💵
  CART: String.fromCodePoint(0x1F6D2),    // 🛒
  BAG: String.fromCodePoint(0x1F4B0),     // 💰
  BULLET: String.fromCodePoint(0x2022),   // •
  PARTY: String.fromCodePoint(0x1F389)    // 🎉
}

export const LIMA_DISTRICTS = [
  { name: 'Ate', note: 'Enviar ubicación para confirmar cobertura' },
  { name: 'Barranco' },
  { name: 'Bellavista' },
  { name: 'Breña' },
  { name: 'Callao Cercado' },
  { name: 'Carmen de la Legua' },
  { name: 'Cercado de Lima' },
  { name: 'Chorrillos' },
  { name: 'El Agustino' },
  { name: 'Independencia', note: 'Enviar ubicación para confirmar cobertura' },
  { name: 'Jesús María' },
  { name: 'La Molina' },
  { name: 'La Perla' },
  { name: 'La Punta' },
  { name: 'La Victoria' },
  { name: 'Lince' },
  { name: 'Los Olivos' },
  { name: 'Magdalena del Mar' },
  { name: 'Miraflores' },
  { name: 'Pueblo Libre' },
  { name: 'Rímac' },
  { name: 'San Borja' },
  { name: 'San Isidro' },
  { name: 'San Juan de Lurigancho', note: 'Enviar ubicación para confirmar cobertura' },
  { name: 'San Juan de Miraflores', note: 'Enviar ubicación para confirmar cobertura' },
  { name: 'San Luis' },
  { name: 'San Martín de Porres' },
  { name: 'San Miguel' },
  { name: 'Santa Anita' },
  { name: 'Santiago de Surco' },
  { name: 'Surquillo' }
]

export default function CarritoPage() {
  const router = useRouter()
  const supabase = createClient()

  const { items, updateQuantity, removeItem, clearCart, getCalculatedTotals } = useCartStore()
  const { subtotalBase, totalDiscount, finalTotal, totalCount } = getCalculatedTotals()

  const MIN_ORDER_AMOUNT = 40.0
  const isMinOrderMet = finalTotal >= MIN_ORDER_AMOUNT

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [district, setDistrict] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const selectedDistrictData = LIMA_DISTRICTS.find(d => d.name === district)

  const handleSendOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!isMinOrderMet) {
      setErrorMessage(`El monto mínimo de productos es S/ ${MIN_ORDER_AMOUNT.toFixed(2)}. Agrega más ítems.`)
      return
    }

    if (!district) {
      setErrorMessage('Por favor, selecciona tu distrito de entrega.')
      return
    }

    const phoneRegex = /^9\d{8}$/
    if (!phoneRegex.test(phone.trim())) {
      setErrorMessage('Ingresa un número de celular peruano válido (9 dígitos comenzando con 9).')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Asignación de Vendedora (Round-Robin)
      let rawSellerPhone = '924428558'
      let assignedSellerId: string | null = null

      const { data: sellers } = await supabase
        .from('whatsapp_sellers')
        .select('*')
        .eq('is_active', true)
        .order('last_assigned_at', { ascending: true })
        .limit(1)

      if (sellers && sellers.length > 0) {
        const assignedSeller = sellers[0]
        assignedSellerId = assignedSeller.id
        rawSellerPhone = assignedSeller.phone_number

        await supabase
          .from('whatsapp_sellers')
          .update({ last_assigned_at: new Date().toISOString() })
          .eq('id', assignedSeller.id)
      }

      // Normalizar número a 51 + 9 dígitos
      const cleanDigits = rawSellerPhone.replace(/\D/g, '')
      const nineDigits = cleanDigits.slice(-9)
      const sellerPhone = `51${nineDigits}`

      // 2. Insertar orden en Supabase según el esquema oficial
      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: fullName.trim(),
          customer_phone: phone.trim(),
          district_name: district,
          delivery_district: district,
          address: address.trim(),
          reference: notes.trim() || null,
          delivery_type: 'Envío a domicilio',
          payment_method: 'Pago contra entrega',
          total_amount: finalTotal,
          subtotal: subtotalBase,
          discount_amount: totalDiscount,
          savings_amount: totalDiscount,
          assigned_seller_phone: sellerPhone,
          seller_id: assignedSellerId,
          is_deleted: false,
          status: 'pending'
        })
        .select()
        .single()

      if (orderError) {
        console.error('Error en Supabase Orders:', orderError)
        throw new Error(`Error BD: ${orderError.message}`)
      }

      // 3. Insertar detalle de productos en order_items
      if (insertedOrder) {
        const orderItemsData = items.map(item => {
          const tiers = item.price_tiers || []
          const baseTier = tiers.find(t => t.min_quantity === 1) || tiers[0]
          const basePriceUnit = baseTier ? baseTier.unit_price : 0
          const sortedTiers = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity)
          const applicableTier = sortedTiers.find(t => item.quantity >= t.min_quantity) || baseTier
          const actualPriceUnit = applicableTier ? applicableTier.unit_price : basePriceUnit

          return {
            order_id: insertedOrder.id,
            product_id: item.id,
            product_name: item.name,
            presentation: item.presentation || 'Unidad',
            quantity: item.quantity,
            applied_unit_price: actualPriceUnit,
            subtotal: actualPriceUnit * item.quantity
          }
        })

        const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData)
        if (itemsError) {
          console.error('Error en order_items:', itemsError)
        }
      }

      // 4. Formatear Código de Pedido (#0113)
      const numCode = insertedOrder?.order_number || Math.floor(100 + Math.random() * 900)
      const orderCode = String(numCode).padStart(4, '0')

      // 5. Construir mensaje con símbolos dinámicos
      let message = `${EMOJI.DOC} *Pedido #${orderCode}*\n`
      message += `${EMOJI.USER} *${fullName.trim()}* | ${EMOJI.PHONE} *${phone.trim()}*\n`
      message += `${EMOJI.PIN} *${district}* - ${address.trim()}`
      if (notes.trim()) {
        message += ` (Ref: ${notes.trim()})`
      }
      message += `\n${EMOJI.TRUCK} *Envío a domicilio* | ${EMOJI.CASH} *Pago contra entrega*\n\n`

      message += `${EMOJI.CART} *Detalle:*\n`
      items.forEach(item => {
        const tiers = item.price_tiers || []
        const baseTier = tiers.find(t => t.min_quantity === 1) || tiers[0]
        const basePriceUnit = baseTier ? baseTier.unit_price : 0
        const sortedTiers = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity)
        const applicableTier = sortedTiers.find(t => item.quantity >= t.min_quantity) || baseTier
        const actualPriceUnit = applicableTier ? applicableTier.unit_price : basePriceUnit
        const itemSubtotal = actualPriceUnit * item.quantity

        const presentationLabel = item.presentation ? ` (${item.presentation})` : ''
        message += `${EMOJI.BULLET} ${item.quantity} x ${item.name}${presentationLabel} a S/ ${actualPriceUnit.toFixed(2)} c/u = S/ ${itemSubtotal.toFixed(2)}\n`
      })

      message += `\n${EMOJI.BAG} *Total productos:* S/ ${finalTotal.toFixed(2)}`
      if (totalDiscount > 0) {
        message += ` | *Ahorro por volumen:* S/ ${totalDiscount.toFixed(2)}`
      }
      message += `\n(El costo de envío lo confirma la vendedora)`

      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${sellerPhone}&text=${encodedMessage}`

      clearCart()
      window.open(whatsappUrl, '_blank')
      router.push('/')
    } catch (err: any) {
      console.error('Error procesando pedido:', err)
      setErrorMessage(err.message || 'Error al conectar con la base de datos.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 flex-1 flex flex-col justify-center items-center">
          <div className="w-20 h-20 bg-blue-50 text-[#1B2A82] rounded-3xl flex items-center justify-center shadow-sm">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-gray-900">Tu carrito está vacío</h1>
            <p className="text-xs font-semibold text-gray-500 max-w-sm">
              Explora nuestras ofertas y productos de limpieza para armar tu pedido.
            </p>
          </div>
          <Link
            href="/"
            className="bg-[#1B2A82] hover:bg-[#142066] text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs flex items-center gap-2 shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Ver Productos</span>
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <Link
          href="/"
          className="text-xs font-extrabold text-[#1B2A82] hover:underline flex items-center gap-1.5 self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Seguir comprando</span>
        </Link>

        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Tu Carrito de Compras</h1>
            <p className="text-xs text-gray-500 font-semibold">
              Revisa tus productos y completa tus datos para procesar la entrega.
            </p>
          </div>
          <button
            onClick={clearCart}
            className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vaciar Carrito</span>
          </button>
        </div>

        {!isMinOrderMet && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3 text-amber-900">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <div className="text-xs">
              <p className="font-extrabold text-sm">Monto Mínimo de Pedido: S/ {MIN_ORDER_AMOUNT.toFixed(2)}</p>
              <p className="font-medium">
                Te faltan <span className="font-black">S/ {(MIN_ORDER_AMOUNT - finalTotal).toFixed(2)}</span> para completar el mínimo requerido de compra.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-4 rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100 flex items-center justify-between">
                <span>Productos Seleccionados ({totalCount})</span>
                <span className="text-xs font-extrabold text-[#1B2A82]">Descuentos Aplicados</span>
              </h2>

              <div className="divide-y divide-gray-100">
                {items.map(item => {
                  const tiers = item.price_tiers || []
                  const baseTier = tiers.find(t => t.min_quantity === 1) || tiers[0]
                  const basePriceUnit = baseTier ? baseTier.unit_price : 0

                  const sortedTiers = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity)
                  const applicableTier = sortedTiers.find(t => item.quantity >= t.min_quantity) || baseTier
                  const actualPriceUnit = applicableTier ? applicableTier.unit_price : basePriceUnit

                  const hasDiscount = actualPriceUnit < basePriceUnit

                  return (
                    <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl p-2 border border-gray-100 flex items-center justify-center shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="max-h-full max-w-full object-contain" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-gray-300" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <span className="text-[10px] font-black text-[#1B2A82] uppercase block">
                          {item.presentation || 'Limpieza'}
                        </span>
                        <h3 className="font-bold text-gray-900 text-sm truncate">{item.name}</h3>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-black text-gray-900">S/ {actualPriceUnit.toFixed(2)} c/u</span>
                          {hasDiscount && (
                            <span className="text-[10px] font-bold text-red-600 line-through">
                              S/ {basePriceUnit.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-gray-200">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-xl bg-white hover:bg-gray-200 text-gray-800 flex items-center justify-center transition-colors shadow-sm"
                        >
                          {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3 h-3" />}
                        </button>
                        <span className="w-6 text-center text-xs font-black text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-xl bg-[#1B2A82] text-white flex items-center justify-center transition-colors shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-gray-900 block">
                          S/ {(actualPriceUnit * item.quantity).toFixed(2)}
                        </span>
                        {hasDiscount && (
                          <span className="text-[9px] font-extrabold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md">
                            Ahorro
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <form onSubmit={handleSendOrder} className="bg-white rounded-3xl p-6 shadow-md border border-blue-100 space-y-5">
              <h2 className="text-sm font-black text-[#1B2A82] uppercase tracking-wider pb-2 border-b border-gray-100">
                Datos de Envío y Contacto
              </h2>

              <div className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-gray-800 mb-1 flex items-center gap-1 font-bold">
                    <User className="w-3.5 h-3.5 text-[#1B2A82]" />
                    <span>Nombres y Apellidos *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Ej. Diego Sánchez"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1B2A82] focus:ring-2 focus:ring-[#1B2A82]/20 text-xs font-bold transition-all shadow-sm"
                  />
                  <p className="text-[10px] text-gray-500 mt-1 font-medium">
                    Escribe tu nombre completo para identificar tu comprobante y entrega.
                  </p>
                </div>

                <div>
                  <label className="block text-gray-800 mb-1 flex items-center gap-1 font-bold">
                    <Phone className="w-3.5 h-3.5 text-[#1B2A82]" />
                    <span>Celular WhatsApp *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={9}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej. 999999999"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1B2A82] focus:ring-2 focus:ring-[#1B2A82]/20 text-xs font-bold transition-all shadow-sm"
                  />
                  <p className="text-[10px] text-gray-500 mt-1 font-medium">
                    Número de 9 dígitos de WhatsApp donde la asesora te contactará.
                  </p>
                </div>

                <div>
                  <label className="block text-gray-800 mb-1 flex items-center gap-1 font-bold">
                    <Truck className="w-3.5 h-3.5 text-[#1B2A82]" />
                    <span>Distrito de Envío *</span>
                  </label>
                  <select
                    required
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-[#1B2A82] focus:ring-2 focus:ring-[#1B2A82]/20 text-xs font-bold transition-all shadow-sm"
                  >
                    <option value="" className="text-gray-400">-- Selecciona tu distrito --</option>
                    {LIMA_DISTRICTS.map(d => (
                      <option key={d.name} value={d.name} className="text-gray-900 font-medium">
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1 font-medium">
                    Selecciona la comuna o distrito de Lima donde recibirás tus productos.
                  </p>

                  {selectedDistrictData?.note && (
                    <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-[11px] text-blue-900 font-bold">
                      <Info className="w-4 h-4 text-[#1B2A82] shrink-0" />
                      <span>Nota: {selectedDistrictData.note}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-800 mb-1 flex items-center gap-1 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-[#1B2A82]" />
                    <span>Dirección Exacta *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Ej. Av. Universitaria 123"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1B2A82] focus:ring-2 focus:ring-[#1B2A82]/20 text-xs font-bold transition-all shadow-sm"
                  />
                  <p className="text-[10px] text-gray-500 mt-1 font-medium">
                    Indica la calle, avenida, número, lote o departamento de entrega.
                  </p>
                </div>

                <div>
                  <label className="block text-gray-800 mb-1 flex items-center gap-1 font-bold">
                    <FileText className="w-3.5 h-3.5 text-[#1B2A82]" />
                    <span>Referencia / Notas Adicionales</span>
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Ej. Frente al parque, llamar antes de entregar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1B2A82] focus:ring-2 focus:ring-[#1B2A82]/20 text-xs font-bold transition-all shadow-sm"
                  />
                  <p className="text-[10px] text-gray-500 mt-1 font-medium">
                    Opcional: Detalles para ayudar al repartidor a ubicar tu domicilio rápidamente.
                  </p>
                </div>

              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs font-semibold">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal Base Productos:</span>
                  <span>S/ {subtotalBase.toFixed(2)}</span>
                </div>

                {totalDiscount > 0 && (
                  <div className="flex justify-between items-center text-red-600 font-black bg-red-50 p-2.5 rounded-xl border border-red-100">
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4 text-red-500" />
                      <span>Descuento por Volumen:</span>
                    </span>
                    <span>- S/ {totalDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-700 font-bold border-t border-gray-200 pt-2">
                  <span>Envío:</span>
                  <span className="text-[#1B2A82] font-black">Por coordinar por WhatsApp</span>
                </div>

                <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-base font-black text-gray-900">
                  <span>Total Productos:</span>
                  <span>S/ {finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isMinOrderMet || !district}
                className={`w-full font-extrabold rounded-2xl py-4 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isMinOrderMet && district && !isSubmitting
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Procesando pedido...' : 'Completar Pedido por WhatsApp'}</span>
              </button>

              <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 font-bold text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tus datos están protegidos según la Ley N° 29733 de Protección de Datos.</span>
              </div>
            </form>
          </div>

        </div>
      </main>
    </div>
  )
}