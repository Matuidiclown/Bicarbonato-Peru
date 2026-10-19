import React from 'react'
import { Footer } from '@/components/Footer'

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  )
}