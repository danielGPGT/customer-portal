import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/app/page-header'
import { ArrowLeft, Settings2, DollarSign } from 'lucide-react'
import { getClient } from '@/lib/utils/get-client'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PreferencesForm } from '@/components/profile/preferences-form'
import { getClientPreferredCurrency } from '@/lib/utils/currency'

export const metadata: Metadata = {
  title: 'Preferences | Grand Prix Grand Tours Portal',
  description: 'Manage your account preferences including currency display settings',
}

// Dynamic page - no caching to ensure immediate updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PreferencesPage() {
  const { client, user, error } = await getClient()

  if (!user) {
    redirect('/sign-in')
  }

  if (error === 'no_client_access') {
    redirect('/dashboard?error=client_access_required')
  }

  if (!client) {
    redirect('/dashboard?error=client_not_found')
  }

  // Get loyalty settings to show base currency
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('loyalty_settings')
    .select('currency')
    .eq('id', 1)
    .single()

  const baseCurrency = settings?.currency || 'GBP'
  
  // Get current preferred currency from client preferences
  const preferredCurrency = getClientPreferredCurrency(client, baseCurrency)

  // Parse preferences JSONB
  let preferences = null
  if (client.preferences) {
    if (typeof client.preferences === 'string') {
      try {
        preferences = JSON.parse(client.preferences)
      } catch {
        preferences = {}
      }
    } else {
      preferences = client.preferences
    }
  }

  const initialValues = {
    clientId: client.id,
    preferredCurrency: preferredCurrency,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/profile" className="flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>
      </div>
      <PageHeader
        title="Preferences"
        description="Customize your account settings and display preferences"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Display preferences
          </CardTitle>
          <CardDescription>
            Choose how currency amounts are displayed throughout the portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm initialValues={initialValues} baseCurrency={baseCurrency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            About currency preferences
          </CardTitle>
          <CardDescription>How currency conversion works in the portal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/60 p-4">
            <p className="font-medium mb-2">Base currency</p>
            <p className="text-sm text-muted-foreground">
              All loyalty points and calculations use <strong>{baseCurrency}</strong> as the base currency. 
              This ensures consistent point values across all transactions.
            </p>
          </div>
          <div className="rounded-lg border border-border/60 p-4">
            <p className="font-medium mb-2">Display currency</p>
            <p className="text-sm text-muted-foreground">
              You can choose to view discount amounts and point values in your preferred currency. 
              The system will automatically convert amounts from the base currency ({baseCurrency}) to your 
              preferred currency using current exchange rates with a small conversion spread.
            </p>
          </div>
          <div className="rounded-lg border border-border/60 p-4">
            <p className="font-medium mb-2">Booking currency</p>
            <p className="text-sm text-muted-foreground">
              Individual bookings may be in different currencies. Your display preference only affects 
              how loyalty benefits are shown, not the currency of your actual bookings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
