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

    try {
      await setCurrency(newCurrency)
      toast({
        title: "Currency updated",
        description: `Display currency changed to ${getCurrencyInfo(newCurrency).name}`,
      })
    } catch (error: any) {
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
