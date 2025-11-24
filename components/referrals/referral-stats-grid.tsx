import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { StatisticsCard } from "@/components/points/statistics-card"
import { UserPlus, Hourglass, CheckCircle, Trophy, Coins } from "lucide-react"

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
  const stats = [
    {
      label: "Total Invites",
      value: totalInvites.toString(),
      helper: "All time",
      icon: <UserPlus className="size-4" />,
    },
    {
      label: "Pending",
      value: pending.toString(),
      helper: "Awaiting signup",
      icon: <Hourglass className="size-4" />,
    },
    {
      label: "Signed Up",
      value: signedUp.toString(),
      helper: "Bonus pending",
      icon: <CheckCircle className="size-4" />,
    },
    {
      label: "Completed",
      value: completed.toString(),
      helper: "Bonus received",
      icon: <Trophy className="size-4" />,
    },
    {
      label: "Points Earned",
      value: totalPointsEarned.toLocaleString(),
      helper: "From referrals",
      icon: <Coins className="size-4" />,
    },
  ]

  return (
    <>
      <div className="md:hidden">
        <Carousel opts={{ align: "start" }} className="px-2">
          <CarouselContent>
            {stats.map((stat) => (
              <CarouselItem key={stat.label} className="basis-[80%] sm:basis-1/2">
                <StatisticsCard
                  icon={stat.icon}
                  value={stat.value}
                  title={stat.label}
                  changePercentage={stat.helper || "Program stat"}
                  changeLabel="Referral program"
                  badgeVariant="neutral"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <StatisticsCard
            key={stat.label}
            icon={stat.icon}
            value={stat.value}
            title={stat.label}
            changePercentage={stat.helper || "Program stat"}
            changeLabel="Referral program"
            badgeVariant="neutral"
          />
        ))}
      </div>
    </>
  )
}

