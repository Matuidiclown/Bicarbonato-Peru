import React from 'react'
import { Footer } from '@/components/Footer'

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between overflow-x-hidden w-full max-w-full">
      <div className="flex-1 w-full min-w-0">
        {children}
      </div>
      <Footer />
    </div>
  )
}