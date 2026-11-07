import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { ReferralTracker } from '@/components/ReferralTracker'
import { ModalProducto } from '@/components/tienda/ModalProducto'

export const metadata: Metadata = {
  title: 'Bicarbonato Perú | Insumos y Productos de Limpieza al por Mayor y Menor',
  description: 'Venta de bicarbonato de sodio, percarbonato, detergentes y artículos de limpieza en Lima, Perú.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="overflow-x-hidden">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-800 overflow-x-hidden w-full max-w-full">
        <Suspense fallback={null}>
          <ReferralTracker />
        </Suspense>
        {/* Modal global de detalle de producto */}
        <ModalProducto />
        {children}
      </body>
    </html>
  )
}