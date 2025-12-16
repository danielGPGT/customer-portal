'use client'

import Link from 'next/link'
import { UserPlus, Plus, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Referral {
  id: string
  referee_email?: string | null
  referee_name?: string | null
  status: 'pending' | 'signed_up' | 'completed'
  created_at: string
}

interface DashboardReferralsListProps {
  referrals: Referral[]
}

const statusConfig = {
  pending: {
    label: 'Invited',
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
  },
  signed_up: {
    label: 'Signed Up',
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  },
}

const getInitials = (name?: string | null, email?: string | null) => {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  if (email) {
    return email[0].toUpperCase()
  }
  return 'U'
}

export function DashboardReferralsList({ referrals }: DashboardReferralsListProps) {
  const displayReferrals = referrals.slice(0, 3)

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Your Referrals</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/refer">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayReferrals.length === 0 ? (
          <div className="py-8 text-center">
            <UserPlus className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">
              No referrals yet. Invite friends to earn rewards!
            </p>
            <Button asChild variant="default" size="sm">
              <Link href="/refer">
                Invite Friends
                <UserPlus className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {displayReferrals.map((referral) => {
              const status = statusConfig[referral.status]
              const name = referral.referee_name || referral.referee_email || 'Friend'
              const initials = getInitials(referral.referee_name, referral.referee_email)

              return (
                <div
                  key={referral.id}
                  className="flex items-center gap-3 rounded-lg border bg-card/60 p-3 transition-colors hover:bg-accent/50"
                >
                  <Avatar className="h-10 w-10 border-2">
                    <AvatarImage src={undefined} alt={name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{name}</p>
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-auto mt-1', status.className)}>
                      {status.label}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                    <Link href="/refer">
                      View
                    </Link>
                  </Button>
                </div>
              )
            })}
            {referrals.length > 3 && (
              <Button variant="outline" className="w-full" asChild>
                <Link href="/refer">
                  See All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

