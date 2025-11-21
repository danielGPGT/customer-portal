import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Stat {
  label: string
  value: string | number
  helper?: string
  accent?: string
}

interface ReferralStatsGridProps {
  totalInvites: number
  pending: number
  signedUp: number
  completed: number
  totalPointsEarned: number
}

export function ReferralStatsGrid({
  totalInvites,
  pending,
  signedUp,
  completed,
  totalPointsEarned,
}: ReferralStatsGridProps) {
  const stats: Stat[] = [
    {
      label: "Total invites",
      value: totalInvites,
      helper: "All time",
    },
    {
      label: "Pending",
      value: pending,
      helper: "Awaiting signup",
      accent: "text-amber-600",
    },
    {
      label: "Signed up",
      value: signedUp,
      helper: "Bonus pending",
      accent: "text-sky-600",
    },
    {
      label: "Completed",
      value: completed,
      helper: "Bonus received",
      accent: "text-emerald-600",
    },
    {
      label: "Points earned",
      value: totalPointsEarned,
      helper: "From referrals",
      accent: "text-primary",
    },
  ]

  const renderCard = (stat: Stat) => (
    <Card key={stat.label} className="min-w-[220px] snap-start">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {stat.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-2xl font-semibold", stat.accent)}>{stat.value}</p>
        {stat.helper && <p className="text-xs text-muted-foreground mt-1">{stat.helper}</p>}
      </CardContent>
    </Card>
  )

  return (
    <>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:hidden snap-x snap-mandatory">
        {stats.map((stat) => renderCard(stat))}
      </div>
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={cn("text-2xl font-semibold", stat.accent)}>{stat.value}</p>
              {stat.helper && <p className="text-xs text-muted-foreground mt-1">{stat.helper}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

