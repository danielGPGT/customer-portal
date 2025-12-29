"use client"

import * as React from "react"
import { CookieCard } from "@/components/cookies/cookie-card"
import { CookieButton } from "@/components/cookies/cookie-button"

export function CookieBanner() {
  return (
    <>
      <CookieCard />
      <CookieButton />
    </>
  )
}

/**
 * Hook to get current cookie preferences
 */
export function useCookiePreferences(): CookiePreferences {
  const [preferences, setPreferences] = React.useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  })

  React.useEffect(() => {
    const stored = localStorage.getItem(COOKIE_PREFERENCES_KEY)
    if (stored) {
      try {
        setPreferences(JSON.parse(stored))
      } catch (e) {
        // Invalid JSON, use defaults
      }
    }
  }, [])

  return preferences
}
