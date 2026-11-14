'use client'

import React, { useState } from 'react'
import Link from 'next/link'
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
  Info,
  Gift
} from 'lucide-react'

// Emojis Unicode puros generados en memoria
const EMOJI = {
  DOC: String.fromCodePoint(0x1F4C4),    // 📄
  USER: String.fromCodePoint(0x1F464),   // 👤
  PHONE: String.fromCodePoint(0x1F4F1),  // 📱
  PIN: String.fromCodePoint(0x1F4CD),    // 📍
  TRUCK: String.fromCodePoint(0x1F69A),  // 🚚
  CASH: String.fromCodePoint(0x1F4B5),   // 💵
  CART: String.fromCodePoint(0x1F6D2),   // 🛒
  MONEY: String.fromCodePoint(0x1F4B0),  // 💰
  GIFT: String.fromCodePoint(0x1F381),   // 🎁
  BULLET: '\u2022'                       // •
}

const FREE_SHIPPING_THRESHOLD = 85.0

interface ServerOrderItem {
  product_id: string
  product_name: string
  presentation: string
  quantity: number
  applied_unit_price: number
  subtotal: number
}

interface CreateOrderRpcResponse {
  order_id: string
  order_number: number | null
  seller_phone: string
  subtotal_base: number
  total_discount: number
  products_total: number
  shipping_cost: number
  total_amount: number
  items: ServerOrderItem[]
}

export const LIMA_DISTRICTS = [
  { name: 'Ate', cost: 10 },
  { name: 'Barranco', cost: 7 },
  { name: 'Bellavista', cost: 10 },
  { name: 'Breña', cost: 7 },
  { name: 'Callao Cercado', cost: 10 },
  { name: 'Carmen de la Legua', cost: 10 },
  { name: 'Cercado de Lima', cost: 10 },
  { name: 'Chorrillos', cost: 10 },
  { name: 'El Agustino', cost: 10 },
  { name: 'Independencia', cost: 10 },
  { name: 'Jesús María', cost: 7 },
  { name: 'La Molina', cost: 10 },
  { name: 'La Perla', cost: 10 },
  { name: 'La Punta', cost: 10 },
  { name: 'La Victoria', cost: 7 },
  { name: 'Lince', cost: 7 },
  { name: 'Los Olivos', cost: 10 },
  { name: 'Magdalena del Mar', cost: 7 },
  { name: 'Miraflores', cost: 7 },
  { name: 'Pueblo Libre', cost: 7 },
  { name: 'Rímac', cost: 10 },
  { name: 'San Borja', cost: 7 },
  { name: 'San Isidro', cost: 7 },
  { name: 'San Juan de Lurigancho', cost: 10 },
  { name: 'San Juan de Miraflores', cost: 10 },
  { name: 'San Luis', cost: 10 },
  { name: 'San Martín de Porres', cost: 10 },
  { name: 'San Miguel', cost: 7 },
  { name: 'Santa Anita', cost: 10 },
  { name: 'Santiago de Surco', cost: 7 },
  { name: 'Surquillo', cost: 7 }
]

export default function CarritoPage() {
  const supabase = createClient()

  const { items, updateQuantity, clearCart, getCalculatedTotals } = useCartStore()
  const { subtotalBase, totalDiscount, finalTotal, totalCount } = getCalculatedTotals()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [district, setDistrict] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const selectedDistrictData = LIMA_DISTRICTS.find(d => d.name === district)
  const isFreeShipping = finalTotal >= FREE_SHIPPING_THRESHOLD
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - finalTotal)
  const progressPercentage = Math.min(100, (finalTotal / FREE_SHIPPING_THRESHOLD) * 100)

  const baseDistrictShipping = selectedDistrictData ? selectedDistrictData.cost : 0
  const effectiveShippingCost = isFreeShipping ? 0 : baseDistrictShipping
  const grandTotal = finalTotal + effectiveShippingCost

  const handleSendOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

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
      const referralCode = useCartStore.getState().referralCode

      const { data, error } = await supabase.rpc('create_order', {
        p_customer_name: fullName.trim(),
        p_customer_phone: phone.trim(),
        p_district: district,
        p_address: address.trim(),
        p_notes: notes.trim() || null,
        p_ref_code: referralCode || null,
        p_items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      })

      if (error) {
        console.error('Error al procesar el pedido en el servidor:', error)
        throw new Error(error.message || 'No se pudo registrar el pedido en el servidor.')
      }

      const orderResult = data as CreateOrderRpcResponse | null
      if (!orderResult || !orderResult.order_id || !Array.isArray(orderResult.items)) {
        throw new Error('Respuesta inválida del servidor al crear el pedido.')
      }

      const orderCode = String(orderResult.order_number ?? 0).padStart(4, '0')
      const serverProductsTotal = Number(orderResult.products_total ?? finalTotal)
      const serverShipping = Number(orderResult.shipping_cost ?? effectiveShippingCost)
      const serverGrandTotal = Number(orderResult.total_amount)
      const serverDiscount = Number(orderResult.total_discount)

      let message = `${EMOJI.DOC} *Pedido #${orderCode}*\n`
      message += `${EMOJI.USER} *${fullName.trim()}* | ${EMOJI.PHONE} *${phone.trim()}*\n`
      message += `${EMOJI.PIN} *${district}* - ${address.trim()}`
      if (notes.trim()) {
        message += ` (Ref: ${notes.trim()})`
      }
      message += `\n${EMOJI.TRUCK} *Envío a domicilio* | ${EMOJI.CASH} *Pago contra entrega*\n\n`

      message += `${EMOJI.CART} *Detalle:*\n`
      orderResult.items.forEach(item => {
        const unitPrice = Number(item.applied_unit_price)
        const itemSubtotal = Number(item.subtotal)
        const presentationLabel = item.presentation ? ` (${item.presentation})` : ''
        message += `${EMOJI.BULLET} ${item.quantity} x ${item.product_name}${presentationLabel} a S/ ${unitPrice.toFixed(2)} c/u = S/ ${itemSubtotal.toFixed(2)}\n`
      })

      message += `\n*Subtotal productos:* S/ ${serverProductsTotal.toFixed(2)}`
      if (serverDiscount > 0) {
        message += ` | *Ahorro por volumen:* S/ ${serverDiscount.toFixed(2)}`
      }
      if (serverShipping === 0) {
        message += `\n${EMOJI.GIFT} *Costo de envío (${district}):* ¡GRATIS! (Compra desde S/ 85.00)`
      } else {
        message += `\n${EMOJI.TRUCK} *Costo de envío (${district}):* S/ ${serverShipping.toFixed(2)}`
      }
      message += `\n${EMOJI.MONEY} *TOTAL A PAGAR:* S/ ${serverGrandTotal.toFixed(2)}`
      message += `\n_(Envío mi ubicación para confirmar cobertura)_`

      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${orderResult.seller_phone}&text=${encodedMessage}`

      clearCart()
      window.location.href = whatsappUrl
    } catch (err: unknown) {
      console.error('Error al procesar el pedido:', err)
      const message =
        err instanceof Error ? err.message : 'Error al conectar con la base de datos.'
      setErrorMessage(message)
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

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Link
          href="/"
          className="text-xs font-extrabold text-[#1B2A82] hover:underline flex items-center gap-1.5 self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Seguir comprando</span>
        </Link>

        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Tu Pre-cuenta y Envío</h1>
            <p className="text-xs text-gray-500 font-semibold">
              Selecciona tu distrito para calcular el delivery. ¡Envío GRATIS desde S/ 85.00!
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

        {/* Barra de Incentivo Envío Gratis desde S/ 85 */}
        <div
          className={`rounded-2xl p-4 border transition-colors ${
            isFreeShipping
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-blue-50 border-blue-200 text-blue-950'
          }`}
        >
          <div className="flex items-center justify-between gap-2 text-xs font-extrabold mb-2">
            <span className="flex items-center gap-1.5">
              <Gift className={`w-4 h-4 ${isFreeShipping ? 'text-emerald-600' : 'text-[#1B2A82]'}`} />
              {isFreeShipping ? (
                <span>¡Felicidades! Tu pedido califica para ENVÍO GRATIS en Lima y Callao</span>
              ) : (
                <span>
                  Agrega <span className="text-red-600 font-black">S/ {remainingForFreeShipping.toFixed(2)}</span> más en productos para obtener <span className="underline">ENVÍO GRATIS</span>
                </span>
              )}
            </span>
            <span className="text-[11px] font-black shrink-0">
              S/ {finalTotal.toFixed(2)} / S/ {FREE_SHIPPING_THRESHOLD.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-2 bg-white/80 rounded-full overflow-hidden border border-black/5">
            <div
              className={`h-full transition-all duration-300 ${
                isFreeShipping ? 'bg-emerald-600' : 'bg-[#1B2A82]'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-4 rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Productos */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100 flex items-center justify-between">
                <span>Productos Seleccionados ({totalCount})</span>
                <span className="text-xs font-extrabold text-[#1B2A82]">Precios por Volumen</span>
              </h2>

              <div className="divide-y divide-gray-100">
                {items.map(item => {
                  const tiers = item.price_tiers || []
                  const baseTier = tiers.find(t => t.min_quantity === 1) || tiers[0]
                  const basePriceUnit = baseTier ? Number(baseTier.unit_price) : 0

                  const sortedTiers = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity)
                  const applicableTier = sortedTiers.find(t => item.quantity >= t.min_quantity) || baseTier
                  const actualPriceUnit = applicableTier ? Number(applicableTier.unit_price) : basePriceUnit

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

            {/* Nota informativa de cobertura y provincias */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-2 text-xs">
              <div className="flex items-start gap-2 text-gray-700 font-bold">
                <Info className="w-4 h-4 text-[#1B2A82] shrink-0 mt-0.5" />
                <span>Envíanos tu ubicación por WhatsApp al finalizar para confirmar la cobertura exacta en tu zona.</span>
              </div>
              <div className="pl-6 text-[11px] text-gray-500 font-semibold">
                <strong className="text-[#1B2A82]">¿Estás en provincia?</strong> Realizamos envíos por <strong className="text-gray-800">Shalom</strong> desde <strong className="text-gray-800">S/ 65.00</strong> en compras (consulta costo y cobertura con tu asesora).
              </div>
            </div>
          </div>

          {/* Columna Derecha: Formulario y Pre-cuenta */}
          <div className="lg:col-span-5 space-y-6">
            <form onSubmit={handleSendOrder} className="bg-white rounded-3xl p-6 shadow-md border border-blue-100 space-y-5">
              <h2 className="text-sm font-black text-[#1B2A82] uppercase tracking-wider pb-2 border-b border-gray-100">
                Datos de Envío y Pre-cuenta
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
                        {d.name} — {isFreeShipping ? 'Envío GRATIS' : `Envío S/ ${d.cost.toFixed(2)}`}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1 font-medium">
                    Tarifas Lima y Callao: S/ 7.00 o S/ 10.00. Gratis en compras desde S/ 85.00.
                  </p>
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
                </div>
              </div>

              {/* Resumen de Pre-cuenta */}
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

                <div className="flex justify-between text-gray-800 font-bold">
                  <span>Subtotal Productos:</span>
                  <span>S/ {finalTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-gray-700 font-bold border-t border-gray-200 pt-2">
                  <span>Costo de Envío {district ? `(${district})` : ''}:</span>
                  {isFreeShipping ? (
                    <span className="text-emerald-700 font-black bg-emerald-100 px-2 py-0.5 rounded-md">
                      ¡GRATIS!
                    </span>
                  ) : district ? (
                    <span className="text-[#1B2A82] font-black">
                      S/ {effectiveShippingCost.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-400 font-bold">Selecciona distrito</span>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-base font-black text-gray-900">
                  <span>Total a Pagar:</span>
                  <span className="text-[#1B2A82] text-lg">S/ {grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !district}
                className={`w-full font-extrabold rounded-2xl py-4 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  district && !isSubmitting
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
