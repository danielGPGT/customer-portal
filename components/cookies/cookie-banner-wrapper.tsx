"use client"

import dynamic from 'next/dynamic'

// Client component wrapper for CookieBanner
// This allows us to use ssr: false in a client component
const CookieBanner = dynamic(() => import('@/components/cookies/cookie-banner').then(mod => ({ default: mod.CookieBanner })), {
  ssr: false, // CookieBanner uses localStorage, so it must be client-side only
})

export function CookieBannerWrapper() {
  return <CookieBanner />
}
