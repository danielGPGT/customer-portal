import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/page-header'
import { getClient } from '@/lib/utils/get-client'
import { getClerkUser } from '@/lib/clerk/server'
import { SignOutButton } from '@/components/auth/signout-button'

export const metadata: Metadata = {
  title: 'Profile & Settings | Grand Prix Grand Tours Portal',
  description: 'Manage your profile, account settings, and preferences',
}

// Profile page can be cached briefly
export const revalidate = 60
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Award,
  UserCog,
  Lock,
  BellRing,
  Settings2,
  HelpCircle,
  LogOut,
} from 'lucide-react'

const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'Not available'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function ProfilePage() {
  const { client, user, error } = await getClient()
  const clerkUser = await getClerkUser()

  if (!user) {
    redirect('/sign-in')
  }

  if (error === 'no_client_access') {
    redirect('/dashboard?error=client_access_required')
  }

  if (!client) {
    redirect('/dashboard?error=client_not_found')
  }

  const displayName =
    [client.first_name, client.last_name].filter(Boolean).join(' ').trim() ||
    client.email ||
    user.email ||
    'Customer'

  const userInitials =
    client.first_name && client.last_name
      ? `${client.first_name[0] || ''}${client.last_name[0] || ''}`.toUpperCase()
      : client.email?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'

  // Get Clerk avatar URL if available
  const avatarUrl = clerkUser?.imageUrl || null

  const loyaltyStatus = client.status || 'Active'
  const memberSince = formatDate(client.loyalty_enrolled_at)
  const pointsBalance = client.points_balance || 0
  const lifetimeEarned = client.lifetime_points_earned || 0
  const lifetimeSpent = client.lifetime_points_spent || 0

  const contactInfo = [
    {
      label: 'Email address',
      value: client.email || user.email || 'Not provided',
      icon: Mail,
    },
    {
      label: 'Phone number',
      value: client.phone || user?.phoneNumber || 'Not provided',
      icon: Phone,
    },
    {
      label: 'Member since',
      value: memberSince,
      icon: Calendar,
    },
  ]

  const settingsLinks = [
    {
      title: 'Edit profile',
      description: 'Update your personal information',
      href: '/profile/edit',
      icon: UserCog,
    },
    {
      title: 'Change password',
      description: 'Keep your account secure',
      href: '/profile/password',
      icon: Lock,
    },

  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile & Settings"
        description="Manage your personal information, security settings, and communication preferences"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Personal information</CardTitle>
              <CardDescription>Keep your contact details up to date.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/profile/edit">Edit profile</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt={displayName} />
                )}
                <AvatarFallback className="text-lg font-semibold">{userInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold leading-tight">{displayName}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              {contactInfo.map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-lg border border-border/50 p-4">
                  <div className="rounded-full bg-muted p-2">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium break-all">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Membership</CardTitle>
            <CardDescription>Your loyalty status and enrollment details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1 text-sm">
                <Award className="mr-1.5 h-3.5 w-3.5 text-primary" />
                {loyaltyStatus}
              </Badge>
              <span className="text-xs text-muted-foreground uppercase">Active</span>
            </div>

            <div className="rounded-lg border border-dashed border-border/80 p-4 text-sm">
              <p className="text-muted-foreground">Member since</p>
              <p className="text-lg font-semibold">{memberSince}</p>
            </div>

            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              You’re eligible for priority booking support and £100 loyalty credits for every referral.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Points summary</CardTitle>
            <CardDescription>Snapshot of your loyalty activity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs uppercase text-primary">Current balance</p>
              <p className="text-3xl font-bold text-primary">{pointsBalance.toLocaleString()} pts</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Lifetime earned</p>
                <p className="text-2xl font-semibold">{lifetimeEarned.toLocaleString()} pts</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lifetime spent</p>
                <p className="text-2xl font-semibold">{lifetimeSpent.toLocaleString()} pts</p>
              </div>
            </div>

            <Separator />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Settings & preferences</CardTitle>
            <CardDescription>Control how your account behaves.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settingsLinks.map((item, index) => (
              <div key={item.title}>
                <Link
                  href={item.href}
                  className="flex items-start gap-3 rounded-lg border border-border/60 p-4 hover:border-primary/40 hover:bg-muted/40 transition-colors"
                >
                  <div className="rounded-full bg-muted p-2">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                </Link>
                {index !== settingsLinks.length - 1 && <div className="h-2" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Need help?</CardTitle>
            <CardDescription>We're here if you ever have questions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="default" className="flex-1">
                <Link href="mailto:bookings@grandprixgrandtours.com">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Email support
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Response times are usually under 24 hours. For urgent booking questions, please include your booking
              reference.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sign out</CardTitle>
            <CardDescription>End your current session on this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3">
              <SignOutButton className="w-full">
                <Button type="button" variant="destructive" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </SignOutButton>
              <p className="text-xs text-muted-foreground">
                You'll be redirected to the sign-in page and can sign back in anytime.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}




