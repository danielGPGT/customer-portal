"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { CurrencyCode } from "@/lib/utils/currency"

interface CurrencyContextType {
  currency: CurrencyCode
  setCurrency: (currency: CurrencyCode) => Promise<void>
  isUpdating: boolean
  refreshAll: () => void
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

interface CurrencyProviderProps {
  children: React.ReactNode
  initialCurrency: CurrencyCode
  clientId: string
  baseCurrency: string
}

export function CurrencyProvider({ 
  children, 
  initialCurrency, 
  clientId,
  baseCurrency 
}: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(initialCurrency)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  // Sync with server on mount and when initialCurrency changes
  useEffect(() => {
    setCurrencyState(initialCurrency)
  }, [initialCurrency])

  // Listen for currency updates from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currency-updated' && e.newValue) {
        const updateData = JSON.parse(e.newValue)
        if (updateData.currency && updateData.currency !== currency) {
          setCurrencyState(updateData.currency)
          // Refresh to get fresh data
          router.refresh()
        }
      }
    }

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'currency-updated' && e.data?.currency !== currency) {
        setCurrencyState(e.data.currency)
        router.refresh()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('message', handleMessage)
    }
  }, [currency, router])

  const setCurrency = useCallback(async (newCurrency: CurrencyCode) => {
    if (newCurrency === currency || isUpdating) return

    setIsUpdating(true)
    setCurrencyState(newCurrency) // Optimistic update

    try {
      const formData = new FormData()
      formData.append('client_id', clientId)
      formData.append('preferred_currency', newCurrency)

      // Import and call server action
      const { updatePreferencesAction } = await import('@/app/(protected)/profile/preferences/actions')
      const result = await updatePreferencesAction(
        { status: 'idle', errors: {} },
        formData
      )

      if (result.status === 'success') {
        // Broadcast to other tabs/windows
        if (typeof window !== 'undefined') {
          // localStorage for cross-tab communication
          localStorage.setItem('currency-updated', JSON.stringify({
            currency: newCurrency,
            timestamp: Date.now()
          }))
          // Remove after a short delay to allow other tabs to pick it up
          setTimeout(() => {
            localStorage.removeItem('currency-updated')
          }, 1000)

          // BroadcastChannel for same-origin communication
          const channel = new BroadcastChannel('currency-updates')
          channel.postMessage({
            type: 'currency-updated',
            currency: newCurrency,
            timestamp: Date.now()
          })
          channel.close()
        }

        // Force refresh all pages
        router.refresh()
      } else {
        // Revert on error
        setCurrencyState(currency)
        throw new Error(result.message || 'Failed to update currency')
      }
    } catch (error) {
      // Revert on error
      setCurrencyState(currency)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [currency, clientId, isUpdating, router])

  const refreshAll = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, isUpdating, refreshAll }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
