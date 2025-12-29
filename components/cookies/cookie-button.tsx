"use client"

import * as React from "react"
import { Cookie } from "lucide-react"
import { CookiePreferencesDialog } from "@/components/cookies/cookie-preferences-dialog"

export function CookieButton() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    // Listen for custom event to open preferences
    const handleOpenPreferences = () => {
      setOpen(true)
    }
    window.addEventListener('openCookiePreferences', handleOpenPreferences)
    return () => {
      window.removeEventListener('openCookiePreferences', handleOpenPreferences)
    }
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2 shadow-lg hover:bg-accent transition-colors text-sm"
        aria-label="Manage cookies"
      >
        <Cookie className="h-4 w-4" />
        <span>Cookies</span>
      </button>
      <CookiePreferencesDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
