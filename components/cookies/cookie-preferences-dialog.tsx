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

interface CookiePreferencesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CookiePreferencesDialog({ open, onOpenChange }: CookiePreferencesDialogProps) {
  const [preferences, setPreferences] = React.useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  })
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    // Load existing preferences
    const stored = localStorage.getItem(COOKIE_PREFERENCES_KEY)
    if (stored) {
      try {
        setPreferences(JSON.parse(stored))
      } catch (e) {
        // Invalid JSON, use defaults
      }
    }
  }, [])

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(allAccepted))
    onOpenChange(false)
  }

  const handleEssentialOnly = () => {
    const essentialOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(essentialOnly))
    onOpenChange(false)
  }

  const handleSave = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences))
    onOpenChange(false)
  }

  if (!mounted || !open) {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-[360px] shadow-lg border">
      <CardContent className="">
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
            <Button variant="outline" onClick={handleSave} className="w-full">
              Save preferences
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
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  )
}
