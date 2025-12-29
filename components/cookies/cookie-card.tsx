"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X } from "lucide-react"
import Link from "next/link"

const COOKIE_CONSENT_KEY = 'cookie-consent'
const COOKIE_PREFERENCES_KEY = 'cookie-preferences'

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
}

export function CookieCard() {
  const [showCard, setShowCard] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    // Check if user has already given consent
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      setShowCard(true)
    }
  }, [])

  const handleAcceptAll = () => {
    const preferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences))
    setShowCard(false)
  }

  const handleEssentialOnly = () => {
    const preferences: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences))
    setShowCard(false)
  }

  const handleManagePreferences = () => {
    // Open the preferences dialog
    const event = new CustomEvent('openCookiePreferences')
    window.dispatchEvent(event)
    setShowCard(false)
  }

  if (!mounted || !showCard) {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-[360px] shadow-lg border">
      <CardContent className="p-5">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-base">About cookies on this site</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to collect information about how our site is used. 
              This helps us analyse traffic and improve our services. You can choose to accept all cookies 
              or only those necessary for the site to function.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleAcceptAll} className="w-full">
              Accept all cookies
            </Button>
            <Button variant="outline" onClick={handleEssentialOnly} className="w-full">
              Essential cookies only
            </Button>
            <Button variant="outline" onClick={handleManagePreferences} className="w-full">
              Manage preferences
            </Button>
          </div>

          <div className="pt-2 border-t">
            <Link 
              href="/terms" 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms and conditions
            </Link>
          </div>
        </div>

        <button
          onClick={() => setShowCard(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  )
}
