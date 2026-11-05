'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCartStore } from '@/store/useCartStore'

export function ReferralTracker() {
  const searchParams = useSearchParams()
  const setReferralCode = useCartStore((state) => state.setReferralCode)

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      setReferralCode(ref)
    }
  }, [searchParams, setReferralCode])

  return null
}