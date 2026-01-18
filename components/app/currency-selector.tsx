"use client"

import * as React from "react"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCurrencySymbol, getCurrencyInfo, getSupportedCurrencies, type CurrencyCode } from "@/lib/utils/currency"
import { updatePreferencesAction } from "@/app/(protected)/profile/preferences/actions"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface CurrencySelectorProps {
  currentCurrency: CurrencyCode
  clientId: string
  baseCurrency: string
}

export function CurrencySelector({ currentCurrency, clientId, baseCurrency }: CurrencySelectorProps) {
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [optimisticCurrency, setOptimisticCurrency] = React.useState<CurrencyCode | null>(null)
  const router = useRouter()
  const supportedCurrencies = getSupportedCurrencies()
  
  // Use optimistic currency if set, otherwise use current
  const displayCurrency = optimisticCurrency || currentCurrency
  const currentCurrencyInfo = getCurrencyInfo(displayCurrency)

  const handleCurrencyChange = async (currency: CurrencyCode) => {
    if (currency === currentCurrency) return

    // Optimistic update - show new currency immediately
    setOptimisticCurrency(currency)
    setIsUpdating(true)

    try {
      const formData = new FormData()
      formData.append('client_id', clientId)
      formData.append('preferred_currency', currency)

      const result = await updatePreferencesAction({ status: 'idle' }, formData)

      if (result.status === 'success') {
        toast({
          title: "Currency updated",
          description: `Display currency changed to ${getCurrencyInfo(currency).name}`,
        })
        // Force refresh to show updated currency immediately
        // Small delay to ensure server action completes
        setTimeout(() => {
          router.refresh()
        }, 100)
      } else {
        // Revert optimistic update on error
        setOptimisticCurrency(null)
        toast({
          title: "Error",
          description: result.message || "Failed to update currency preference",
          variant: "destructive",
        })
      }
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticCurrency(null)
      console.error('Error updating currency:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2 gap-1.5 text-white hover:bg-accent hover:text-accent-foreground"
          disabled={isUpdating}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">
            {currentCurrencyInfo.symbol} {displayCurrency}
          </span>
          <span className="sm:hidden font-medium">
            {currentCurrencyInfo.symbol}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Currency</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {supportedCurrencies.map((currency) => {
          const currencyInfo = getCurrencyInfo(currency)
          const isSelected = currency === displayCurrency
          const isBaseCurrency = currency === baseCurrency

          return (
            <DropdownMenuItem
              key={currency}
              onClick={() => handleCurrencyChange(currency)}
              className={isSelected ? "bg-accent" : ""}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{currencyInfo.symbol}</span>
                  <span>{currencyInfo.name}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {isSelected && <span className="text-primary">✓</span>}
                  {isBaseCurrency && <span className="text-muted-foreground">(Base)</span>}
                </div>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
