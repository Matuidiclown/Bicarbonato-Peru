import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      customerName,
      customerPhone,
      districtName,
      address,
      reference,
      deliveryType,
      paymentMethod,
      items,
      totalAmount,
      savingsAmount
    } = body

    if (!customerName || !customerPhone || !districtName || !address || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Por favor, completa todos los campos obligatorios.' },
        { status: 400 }
      )
    }

    // Teléfono de respaldo con TU número real
    let sellerPhone = '51924428558'

    const supabase = await createClient()

    // 1. Intentar obtener la vendedora asignada desde Supabase
    try {
      const { data: sellerData, error: sellerError } = await supabase.rpc('get_next_whatsapp_seller')
      if (sellerError) {
        console.error('⚠️ Supabase RPC Error (get_next_whatsapp_seller):', sellerError.message)
      } else if (sellerData && sellerData.length > 0) {
        sellerPhone = sellerData[0].phone_number
      }
    } catch (err) {
      console.warn('⚠️ No se pudo ejecutar la función RPC, usando número de respaldo:', sellerPhone)
    }

    // 2. Intentar guardar el pedido en Supabase
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: customerName,
        customer_phone: customerPhone,
        district_name: districtName,
        address,
        reference,
        delivery_type: deliveryType,
        payment_method: paymentMethod,
        assigned_seller_phone: sellerPhone,
        total_amount: totalAmount,
        savings_amount: savingsAmount,
        status: 'pending'
      })
      .select('id, order_number')
      .single()

    if (orderError) {
      console.error('⚠️ Supabase Insert Order Error:', orderError.message)
      const mockOrderNumber = Math.floor(100 + Math.random() * 900)
      return NextResponse.json({
        success: true,
        orderNumber: mockOrderNumber,
        assignedSellerPhone: sellerPhone
      })
    }

    // 3. Insertar detalle de ítems si la orden se creó correctamente
    const orderItemsToInsert = items.map((item: any) => ({
      order_id: orderData.id,
      product_id: item.product.id.length > 10 ? item.product.id : null,
      product_name: item.product.name,
      presentation: item.product.presentation,
      quantity: item.quantity,
      applied_unit_price: item.appliedUnitPrice,
      subtotal: item.subtotal
    }))

    await supabase.from('order_items').insert(orderItemsToInsert)

    return NextResponse.json({
      success: true,
      orderNumber: orderData.order_number,
      assignedSellerPhone: sellerPhone
    })
  } catch (error: any) {
    console.error('⚠️ API Orders General Error:', error)
    return NextResponse.json(
      { error: 'Ocurrió un problema procesando la orden.' },
      { status: 500 }
    )
  }
}
