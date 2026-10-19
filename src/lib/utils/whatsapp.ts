import { CartItem } from '@/types'

interface OrderData {
  orderNumber: string | number
  customerName: string
  customerPhone: string
  districtName: string
  address: string
  reference?: string
  deliveryType: string
  paymentMethod: string
  items: CartItem[]
  totalAmount: number
  totalSavings: number
}

export function buildWhatsAppMessage(data: OrderData): string {
  const deliveryText = data.deliveryType === 'delivery' ? 'Envío a domicilio' : 'Recojo en tienda'
  
  let paymentText = 'Yape / Plin'
  if (data.paymentMethod === 'transfer') paymentText = 'Transferencia bancaria'
  if (data.paymentMethod === 'cash_on_delivery') paymentText = 'Pago contra entrega'

  const itemsList = data.items
    .map(
      item =>
        `- ${item.quantity} x ${item.product.name} (${item.product.presentation}) a S/ ${item.appliedUnitPrice.toFixed(2)} c/u = S/ ${item.subtotal.toFixed(2)}`
    )
    .join('\n')

  const formattedNumber = String(data.orderNumber).padStart(4, '0')

  const message = `🧾 Pedido #${formattedNumber}
👤 ${data.customerName} | 📱 ${data.customerPhone}
📍 ${data.districtName} - ${data.address}${data.reference ? ` (Ref: ${data.reference})` : ''}
🚚 ${deliveryText} | 💳 ${paymentText}

🛒 Detalle:
${itemsList}

💰 Total productos: S/ ${data.totalAmount.toFixed(2)} | Ahorro por volumen: S/ ${data.totalSavings.toFixed(2)}
(El costo de envío lo confirma la vendedora)`

  return encodeURIComponent(message)
}
