import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
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

  return (
    <>
      <div className="md:hidden">
        <Carousel opts={{ align: "start" }} className="px-2">
          <CarouselContent>
            {stats.map((stat) => (
              <CarouselItem key={stat.label} className="basis-[80%] sm:basis-1/2">
                <Card>
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
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
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

