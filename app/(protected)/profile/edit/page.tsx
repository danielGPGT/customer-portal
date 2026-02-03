import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/app/page-header'
import { ArrowLeft, UserCog } from 'lucide-react'
import { getClient } from '@/lib/utils/get-client'
import { getClerkUser } from '@/lib/clerk/server'
import { toDateOnlyInputValue } from '@/lib/utils/date'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { EditProfileForm } from '@/components/profile/edit-profile-form'

export const metadata: Metadata = {
  title: 'Edit Profile | Grand Prix Grand Tours Portal',
  description: 'Update your personal information and profile details',
}

export default async function EditProfilePage() {
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

  // Parse address from JSONB
  let address = null
  if (client.address && typeof client.address === 'object') {
    address = {
      address_line1: (client.address as any).address_line1 || '',
      address_line2: (client.address as any).address_line2 || '',
      city: (client.address as any).city || '',
      state: (client.address as any).state || '',
      postal_code: (client.address as any).postal_code || '',
      country: (client.address as any).country || '',
    }
  }

  const initialValues = {
    clientId: client.id,
    firstName: client.first_name || user?.firstName || '',
    lastName: client.last_name || user?.lastName || '',
    email: client.email || user?.email || '',
    phone: client.phone || user?.phoneNumber || '',
    dateOfBirth: toDateOnlyInputValue(client.date_of_birth),
    address,
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
        title="Edit Profile"
        description="Update your personal information and keep your contact details current"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            Personal details
          </CardTitle>
          <CardDescription>Fields marked with * are required.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditProfileForm initialValues={initialValues} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Why we ask for this information</CardTitle>
          <CardDescription>It helps us secure your account and personalize your experience.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <InfoTile title="Accurate bookings" description="Your name and contact details ensure your booking documents match your ID." />
          <InfoTile title="Faster support" description="We can reference your account quickly when your phone or email matches our records." />
          <InfoTile title="Personalized offers" description="Let us know your birthday so we can send exclusive perks and bonuses." />
        </CardContent>
      </Card>

      <Separator />
      <p className="text-sm text-muted-foreground">
        Need to change something else?{' '}
        <Link href="mailto:bookings@grandprixgrandtours.com" className="text-primary underline-offset-4 hover:underline">
          Contact support
        </Link>
        .
      </p>
    </div>
  )
}

function InfoTile({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border/60 p-4">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  )
}

