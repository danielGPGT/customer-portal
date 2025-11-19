"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface MonthlyData {
  month: string
  earned: number
  spent: number
  net: number
}

interface PointsActivityChartProps {
  monthlyData: MonthlyData[]
}

export function PointsActivityChart({ monthlyData }: PointsActivityChartProps) {
  if (!monthlyData || monthlyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Points Activity
          </CardTitle>
          <CardDescription>Your points activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <p className="text-sm">No activity data available yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Earned',
        data: monthlyData.map(d => d.earned),
        borderColor: 'hsl(142 76% 36%)',
        backgroundColor: 'hsla(142 76% 36% / 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'hsl(142 76% 36%)',
        pointBorderColor: 'hsl(var(--card))',
        pointBorderWidth: 2,
        borderWidth: 2,
      },
      {
        label: 'Spent',
        data: monthlyData.map(d => d.spent),
        borderColor: 'hsl(0 84% 60%)',
        backgroundColor: 'hsla(0 84% 60% / 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'hsl(0 84% 60%)',
        pointBorderColor: 'hsl(var(--card))',
        pointBorderWidth: 2,
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 8,
          font: {
            size: 11,
            weight: '500' as const,
          },
          color: 'hsl(var(--foreground))',
          boxWidth: 10,
          boxHeight: 10,
        },
      },
      tooltip: {
        backgroundColor: 'hsl(var(--popover))',
        titleColor: 'hsl(var(--popover-foreground))',
        bodyColor: 'hsl(var(--popover-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} pts`
          },
        },
        cornerRadius: 8,
        titleFont: {
          size: 13,
          weight: '600' as const,
        },
        bodyFont: {
          size: 12,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 10,
          },
          maxRotation: 45,
          minRotation: 45,
          padding: 4,
        },
      },
      y: {
        grid: {
          color: 'hsl(var(--muted) / 0.5)',
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 11,
          },
          padding: 8,
          callback: function(value: any) {
            // Format large numbers: 1000 -> 1K, 5000 -> 5K
            if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'K'
            }
            return value
          },
        },
        beginAtZero: true,
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          <span>Points Activity</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Your points activity over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full sm:h-[300px] md:h-[350px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  )
}
