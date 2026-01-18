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
import { cn } from "@/lib/utils"
import { updatePreferencesAction } from "@/app/(protected)/profile/preferences/actions"
import { toast } from "@/hooks/use-toast"
import { useRouter, usePathname } from "next/navigation"

interface CurrencySelectorProps {
  currentCurrency: CurrencyCode
  clientId: string
  baseCurrency: string
}

export function CurrencySelector({ currentCurrency, clientId, baseCurrency }: CurrencySelectorProps) {
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [optimisticCurrency, setOptimisticCurrency] = React.useState<CurrencyCode | null>(null)
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supportedCurrencies = getSupportedCurrencies()
  
  // Use optimistic currency if set, otherwise use current
  const displayCurrency = optimisticCurrency || currentCurrency
  const currentCurrencyInfo = getCurrencyInfo(displayCurrency)

  const handleCurrencyChange = async (currency: CurrencyCode) => {
    if (currency === currentCurrency) {
      setDropdownOpen(false)
      return
    }

    // Keep dropdown open during update (important for mobile)
    // The handleOpenChange will prevent closing while isUpdating is true
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
        
        // Close dropdown after successful update
        setDropdownOpen(false)
        
        // Force immediate refresh using router.push to bypass Next.js router cache
        // Use a small delay to ensure the dropdown closes first
        setTimeout(() => {
          router.push(pathname)
        }, 150)
      } else {
        // Revert optimistic update on error
        setOptimisticCurrency(null)
        setDropdownOpen(false)
        toast({
          title: "Error",
          description: result.message || "Failed to update currency preference",
          variant: "destructive",
        })
      }
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticCurrency(null)
      setDropdownOpen(false)
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

  // Handle dropdown open state - prevent closing during update
  const handleOpenChange = (open: boolean) => {
    // Don't allow closing if we're updating (prevents premature close on mobile)
    if (!open && isUpdating) {
      return
    }
    setDropdownOpen(open)
  }

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 sm:w-auto gap-1.5 text-white hover:text-white dark:text-primary-foreground hover:bg-secondary-950 px-0 sm:px-2"
          disabled={isUpdating}
        >
          {isUpdating ? (
            <span className="text-sm">...</span>
          ) : (
            <>
              <span className="hidden sm:inline font-medium">
                {currentCurrencyInfo.symbol} {displayCurrency}
              </span>
              <span className="sm:hidden font-medium text-xl">
                {currentCurrencyInfo.symbol}
              </span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 ml-4"
        onInteractOutside={(e) => {
          // Prevent closing during update
          if (isUpdating) {
            e.preventDefault()
          }
        }}
      >
        <DropdownMenuLabel>Select Currency</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {supportedCurrencies.map((currency) => {
          const currencyInfo = getCurrencyInfo(currency)
          const isSelected = currency === displayCurrency
          const isBaseCurrency = currency === baseCurrency

          return (
            <DropdownMenuItem
              key={currency}
              onSelect={() => {
                // onSelect is more reliable for mobile touch events than onClick
                // It fires on both click and touch events
                handleCurrencyChange(currency)
              }}
              disabled={isUpdating}
              className={cn(
                isSelected && "bg-accent",
                isUpdating && "opacity-50"
              )}
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
