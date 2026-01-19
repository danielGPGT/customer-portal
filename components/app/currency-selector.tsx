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
import { useCurrency } from "@/components/providers/currency-provider"
import { toast } from "@/hooks/use-toast"

interface CurrencySelectorProps {
  currentCurrency: CurrencyCode
  clientId: string
  baseCurrency: string
}

export function CurrencySelector({ currentCurrency, clientId, baseCurrency }: CurrencySelectorProps) {
  const { currency, setCurrency, isUpdating } = useCurrency()
  const supportedCurrencies = getSupportedCurrencies()
  
  // Use context currency, fallback to prop
  const displayCurrency = currency || currentCurrency
  const currentCurrencyInfo = getCurrencyInfo(displayCurrency)

  const handleCurrencyChange = async (newCurrency: CurrencyCode) => {
    if (newCurrency === displayCurrency || isUpdating) return

    // Show success toast immediately (optimistic) - UI updates instantly via context
    const successToast = toast({
      title: "Currency updated",
      description: `Display currency changed to ${getCurrencyInfo(newCurrency).name}`,
    })

    try {
      // setCurrency does optimistic update immediately, then saves to server
      await setCurrency(newCurrency)
      // If we get here, the update was successful (toast already shown)
    } catch (error: any) {
      // If error, dismiss the success toast and show error
      // Note: toast doesn't have dismiss method in this API, so we show error which will appear after
      toast({
        title: "Error",
        description: error.message || "Failed to update currency preference",
        variant: "destructive",
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 sm:w-auto gap-1.5 text-white hover:text-white dark:text-primary-foreground hover:bg-secondary-950 px-0 sm:px-2"
          disabled={isUpdating}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">
            {currentCurrencyInfo.symbol} {displayCurrency}
          </span>
          <span className="sm:hidden font-medium text-xl">
            {currentCurrencyInfo.symbol}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 ml-4">
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
