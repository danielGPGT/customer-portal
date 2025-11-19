"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Pie, PieChart, Cell } from 'recharts'
import { ShoppingBag, UserPlus, RefreshCw, Settings } from 'lucide-react'

interface PointsBreakdownChartProps {
  breakdown: {
    purchase: number
    referral: number
    refund: number
    adjustment: number
  }
}

const COLORS = {
  purchase: "#8B5CF6", // purple
  referral: "#3B82F6", // blue
  refund: "#EC4899",   // pink
  adjustment: "#F59E0B", // orange
}

const ICONS = {
  purchase: ShoppingBag,
  referral: UserPlus,
  refund: RefreshCw,
  adjustment: Settings,
}

export function PointsBreakdownChart({ breakdown }: PointsBreakdownChartProps) {
  const total = breakdown.purchase + breakdown.referral + breakdown.refund + breakdown.adjustment

  if (total === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Points Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            <p className="text-sm">No points earned yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const data = [
    { name: "Purchases", key: "purchase", value: breakdown.purchase, color: COLORS.purchase, icon: ICONS.purchase },
    { name: "Referrals", key: "referral", value: breakdown.referral, color: COLORS.referral, icon: ICONS.referral },
    { name: "Refunds", key: "refund", value: breakdown.refund, color: COLORS.refund, icon: ICONS.refund },
    { name: "Adjustments", key: "adjustment", value: breakdown.adjustment, color: COLORS.adjustment, icon: ICONS.adjustment },
  ].filter(item => item.value > 0)

  // Sort by value descending for better visual hierarchy
  const sortedData = [...data].sort((a, b) => b.value - a.value)

  const chartConfig = data.reduce((acc, item) => {
    acc[item.key] = {
      label: item.name,
      color: item.color,
    }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base sm:text-lg">Points Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-6 lg:gap-8">
          {/* Legend - Left Side */}
          <div className="flex flex-col gap-3 flex-1 w-full lg:w-auto">
            {sortedData.map((item) => {
              const percentage = ((item.value / total) * 100).toFixed(0)
              const Icon = item.icon
              
              return (
                <div 
                  key={item.key} 
                  className="flex items-center gap-3"
                >
                  <Icon 
                    className="h-4 w-4 shrink-0" 
                    style={{ color: item.color }}
                  />
                  <span className="text-sm font-medium flex-1">
                    {item.name}
                  </span>
                  <span className="text-sm font-semibold">
                    {percentage}%
                  </span>
                </div>
              )
            })}
          </div>

          {/* Donut Chart - Right Side */}
          <div className="flex-1 flex items-center justify-center w-full lg:w-auto">
            <ChartContainer config={chartConfig} className="h-[180px] w-full sm:h-[220px] md:h-[250px] lg:h-[200px] lg:w-[200px] max-w-full">
              <PieChart>
                <ChartTooltip 
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={sortedData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius="70%"
                  innerRadius="45%"
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sortedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
