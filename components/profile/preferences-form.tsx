'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2, Settings2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updatePreferencesAction, type PreferencesFormState } from '@/app/(protected)/profile/preferences/actions'
import { CurrencyService } from '@/lib/currencyService'
import { useState } from 'react'

const INITIAL_FORM_STATE: PreferencesFormState = {
  status: 'idle',
  errors: {},
}

interface PreferencesFormProps {
  initialValues: {
    clientId: string
    preferredCurrency: string
  }
  baseCurrency: string
}

export function PreferencesForm({ initialValues, baseCurrency }: PreferencesFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [state, formAction] = useActionState<PreferencesFormState, FormData>(
    updatePreferencesAction,
    INITIAL_FORM_STATE
  )

  const [selectedCurrency, setSelectedCurrency] = useState(initialValues.preferredCurrency)

  // Refresh router on successful update
  useEffect(() => {
    if (state.status === 'success') {
      // Store currency change timestamp to trigger refresh on navigation
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('currency-updated', Date.now().toString())
      }
      
      // Force immediate server-side refresh to bypass all caches
      setTimeout(() => {
        router.refresh()
      }, 100)
    }
  }, [state.status, router, pathname])

  const supportedCurrencies = CurrencyService.getSupportedCurrencies()

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="client_id" value={initialValues.clientId} />
      <input type="hidden" name="preferred_currency" value={selectedCurrency} />

      {state.status !== 'idle' && state.message && (
        <Alert variant={state.status === 'success' ? 'default' : 'destructive'}>
          <AlertTitle>
            {state.status === 'success' ? 'Preferences updated!' : 'Something went wrong'}
          </AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="preferred_currency">Preferred display currency</Label>
        <Select
          value={selectedCurrency}
          onValueChange={setSelectedCurrency}
          required
        >
          <SelectTrigger
            id="preferred_currency"
            className="w-full"
            aria-invalid={state.errors?.preferredCurrency ? 'true' : 'false'}
          >
            <SelectValue placeholder="Select a currency" />
          </SelectTrigger>
          <SelectContent>
            {supportedCurrencies.map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{currency.symbol}</span>
                  <span>{currency.name}</span>
                  <span className="text-muted-foreground">({currency.code})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.errors?.preferredCurrency && (
          <p className="text-sm text-red-500">{state.errors.preferredCurrency}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Choose the currency you'd like to see discount amounts displayed in. Base currency is{' '}
          <strong>{baseCurrency}</strong>.
        </p>
      </div>

      {selectedCurrency !== baseCurrency && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
          <p className="font-medium text-primary mb-1">Currency conversion active</p>
          <p className="text-muted-foreground">
            Amounts will be converted from {baseCurrency} to {selectedCurrency} using current 
            exchange rates. A small conversion spread (2.5%) is applied to cover exchange rate 
            fluctuations.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button asChild variant="ghost" type="button" className="order-2 sm:order-1">
          <Link href="/profile">Cancel</Link>
        </Button>
        <SubmitButton />
      </div>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="order-1 sm:order-2" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      <Settings2 className="mr-2 h-4 w-4" />
      Save preferences
    </Button>
  )
}
