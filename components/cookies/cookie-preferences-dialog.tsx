"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Cookie, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

  const handleSave = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences))
    onOpenChange(false)
    // Optionally reload the page to apply changes
    window.location.reload()
  }

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    }
    setPreferences(allAccepted)
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(allAccepted))
    onOpenChange(false)
    window.location.reload()
  }

  const handleRejectAll = () => {
    const allRejected: CookiePreferences = {
      necessary: true, // Necessary cookies are always required
      analytics: false,
      marketing: false,
    }
    setPreferences(allRejected)
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(allRejected))
    onOpenChange(false)
    window.location.reload()
  }

  if (!mounted) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Cookie className="h-5 w-5 text-primary" />
            <DialogTitle>Cookie Preferences</DialogTitle>
          </div>
          <DialogDescription>
            Manage your cookie preferences. You can enable or disable different types of cookies below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Necessary Cookies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="necessary" className="text-base font-semibold">
                  Necessary Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  These cookies are essential for the website to function properly. They cannot be disabled.
                </p>
              </div>
              <Switch
                id="necessary"
                checked={preferences.necessary}
                disabled
                className="opacity-50"
              />
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Necessary cookies include authentication tokens, session management, and security features.
              </AlertDescription>
            </Alert>
          </div>

          {/* Analytics Cookies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics" className="text-base font-semibold">
                  Analytics Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                </p>
              </div>
              <Switch
                id="analytics"
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, analytics: checked }))
                }
              />
            </div>
          </div>

          {/* Marketing Cookies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing" className="text-base font-semibold">
                  Marketing Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  These cookies are used to deliver personalized advertisements and track campaign performance.
                </p>
              </div>
              <Switch
                id="marketing"
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, marketing: checked }))
                }
              />
            </div>
          </div>

          {/* Info Section */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Your preferences are stored locally in your browser. You can change these settings at any time.
              For more information, please see our{' '}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleRejectAll}>
            Reject All
          </Button>
          <Button variant="outline" onClick={handleAcceptAll}>
            Accept All
          </Button>
          <Button onClick={handleSave}>
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
