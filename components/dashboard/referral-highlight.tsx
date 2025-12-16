import Link from 'next/link'
import { Gift, UserPlus, ArrowRight } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ReferralHighlightProps {
  totalInvites: number
  completedReferrals: number
  totalPointsEarned: number
  referralBonusPerFriend?: number
}

export function ReferralHighlight({
  totalInvites,
  completedReferrals,
  totalPointsEarned,
  referralBonusPerFriend = 100,
}: ReferralHighlightProps) {
  const hasActivity = totalInvites > 0 || totalPointsEarned > 0

  return (
    <Card className="border-2 bg-gradient-to-r from-amber-50 via-amber-50/80 to-orange-50 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-orange-950/40">
      <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 shrink-0">
            <Gift className="h-5 w-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold break-words">Invite friends, earn rewards</h3>
              <Badge
                variant="outline"
                className="border-amber-300/60 bg-amber-100/80 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/40 dark:text-amber-100 shrink-0"
              >
                Referral
              </Badge>
            </div>
            {hasActivity ? (
              <p className="text-xs text-muted-foreground break-words">
                You&apos;ve invited <span className="font-semibold">{totalInvites}</span>{' '}
                friend{totalInvites === 1 ? '' : 's'} and earned{' '}
                <span className="font-semibold">{totalPointsEarned.toLocaleString()} points</span>{' '}
                from referrals so far.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground break-words">
                Earn up to{' '}
                <span className="font-semibold">
                  {referralBonusPerFriend.toLocaleString()} points
                </span>{' '}
                every time a friend books their first trip with your invite.
              </p>
            )}
            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
              <div className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-amber-900 shadow-sm dark:bg-amber-950/80 dark:text-amber-100">
                <UserPlus className="h-3 w-3" />
                <span>
                  {completedReferrals}{' '}
                  {completedReferrals === 1 ? 'completed referral' : 'completed referrals'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:justify-end">
          <Link
            href="/refer"
            className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-amber-50 shadow-sm transition hover:bg-amber-700"
          >
            Invite a friend
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}


