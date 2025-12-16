'use client'

import { Flame, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface DashboardStatsCardProps {
  firstName: string
  profileImageUrl?: string | null
  progressPercentage: number
  monthlyActivity: Array<{ period: string; value: number }>
}

export function DashboardStatsCard({
  firstName,
  profileImageUrl,
  progressPercentage,
  monthlyActivity,
}: DashboardStatsCardProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const initials = firstName
    ? firstName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  const maxValue = Math.max(...monthlyActivity.map((a) => a.value), 1)

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Statistic</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
          {/* Profile with Progress Ring */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative h-24 w-24">
            {/* Progress Ring */}
            <svg className="h-24 w-24 -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
              />
              {/* Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className="text-primary"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercentage / 100)}`}
              />
            </svg>
            {/* Profile Picture */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Avatar className="h-16 w-16 border-4 border-background">
                <AvatarImage src={profileImageUrl || undefined} alt={firstName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            {/* Percentage */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <span className="text-xs font-bold text-foreground bg-background px-2 py-0.5 rounded-full border">{progressPercentage}%</span>
            </div>
          </div>

          {/* Greeting */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-base font-semibold">
                {getGreeting()} {firstName}
              </h3>
              <Flame className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              Continue your journey to achieve your target!
            </p>
          </div>
        </div>

        {/* Activity Bar Chart */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Activity</span>
            <TrendingUp className="h-3 w-3 text-primary" />
          </div>
          <div className="space-y-2">
            {monthlyActivity.map((activity, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{activity.period}</span>
                  <span className="font-medium">{activity.value}</span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(activity.value / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

