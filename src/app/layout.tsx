import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { ReferralTracker } from '@/components/ReferralTracker'

export const metadata: Metadata = {
  title: 'Bicarbonato Perú | Insumos y Productos de Limpieza al por Mayor y Menor',
  description: 'Venta de bicarbonato de sodio, insumos químicos y productos de limpieza para el hogar y la industria en Lima, Perú.',
  icons: {
    icon: '/favicon.ico',
  },
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
        {children}
      </body>
    </html>
  )
}