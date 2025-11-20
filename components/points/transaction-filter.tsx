"use client"

import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Filter, X } from 'lucide-react'

interface TransactionFilterProps {
  filters: {
    transactionType: 'all' | 'earn' | 'spend' | 'refund' | 'adjustment'
    sortOrder: 'desc' | 'asc'
    dateRange: 'all' | 'last_30' | 'last_90' | 'last_year'
  }
  onFiltersChange: (filters: TransactionFilterProps['filters']) => void
}

export function TransactionFilter({ filters, onFiltersChange }: TransactionFilterProps) {
  const updateFilter = (key: keyof typeof filters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const hasActiveFilters = filters.transactionType !== 'all' || filters.dateRange !== 'all'

  const clearFilters = () => {
    onFiltersChange({
      transactionType: 'all',
      sortOrder: 'desc',
      dateRange: 'all',
    })
  }

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <div className="flex flex-wrap gap-3 flex-1">
            <Select
              value={filters.transactionType}
              onValueChange={(value) => updateFilter('transactionType', value)}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="earn">Earned</SelectItem>
                <SelectItem value="spend">Spent</SelectItem>
                <SelectItem value="refund">Refunded</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sortOrder}
              onValueChange={(value) => updateFilter('sortOrder', value)}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Latest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.dateRange}
              onValueChange={(value) => updateFilter('dateRange', value)}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last_30">Last 30 Days</SelectItem>
                <SelectItem value="last_90">Last 90 Days</SelectItem>
                <SelectItem value="last_year">Last Year</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

