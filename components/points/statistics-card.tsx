import type { ReactNode } from 'react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'

import { cn } from '@/lib/utils'

// Statistics card data type
type StatisticsCardProps = {
  icon: ReactNode
  value: string
  title: string
  changePercentage: string
  changeLabel?: string
  badgeVariant?: "positive" | "negative" | "neutral"
  className?: string
}

export function StatisticsCard({
  icon,
  value,
  title,
  changePercentage,
  changeLabel = "vs last year",
  badgeVariant,
  className,
}: StatisticsCardProps) {
  const derivedPositive = changePercentage.startsWith('+') || (!changePercentage.startsWith('-') && parseFloat(changePercentage) > 0)
  const derivedNegative = changePercentage.startsWith('-') || parseFloat(changePercentage) < 0

  const variant = badgeVariant
    ? badgeVariant
    : derivedPositive
    ? "positive"
    : derivedNegative
    ? "negative"
    : "neutral"

  return (
    <Card className={cn('gap-4', className)}>
      <CardHeader className='flex items-center'>
        <div className='bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-md'>
          {icon}
        </div>
        <span className='text-2xl'>{value}</span>
      </CardHeader>
      <CardContent className='flex flex-col gap-2'>
        <span className='font-semibold'>{title}</span>
        <div className='flex items-center gap-2'>
          <span className={cn(
            "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium",
            variant === "positive"
              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : variant === "negative"
              ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              : "bg-muted text-muted-foreground"
          )}>
            {changePercentage}
          </span>
          <span className='text-muted-foreground text-sm'>{changeLabel}</span>
        </div>
      </CardContent>
    </Card>
  )
}

