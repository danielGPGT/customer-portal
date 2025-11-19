"use client"

import { Separator } from '@/components/ui/separator'

interface MonthDividerProps {
  month: string
  year: number
}

export function MonthDivider({ month, year }: MonthDividerProps) {
  return (
    <div className="flex items-center gap-4 my-6">
      <div className="text-sm font-semibold text-foreground">
        {month} {year}
      </div>
      <Separator className="flex-1" />
    </div>
  )
}

