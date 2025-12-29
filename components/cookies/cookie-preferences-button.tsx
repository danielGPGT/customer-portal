"use client"

import * as React from "react"
import { CookiePreferencesDialog } from "@/components/cookies/cookie-preferences-dialog"

export function CookiePreferencesButton() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-white/80 bg-black/30 hover:bg-black/50 px-3 py-1.5 rounded transition-colors"
      >
        Manage cookies
      </button>
      <CookiePreferencesDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
