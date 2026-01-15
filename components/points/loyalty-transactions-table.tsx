"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Transaction {
  id: string
  transaction_type: 'earn' | 'spend' | 'refund' | 'adjustment' | 'expired'
  source_type: string
  points: number
  balance_after: number
  description: string
  source_reference_id?: string | null
  created_at: string
  booking_reference?: string | null
  event_name?: string | null
}

interface LoyaltyTransactionsTableProps {
  transactions: Transaction[]
  totalCount?: number
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
}

export function LoyaltyTransactionsTable({
  transactions,
  totalCount = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
}: LoyaltyTransactionsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newPage === 1) {
      params.delete('page')
    } else {
      params.set('page', newPage.toString())
    }
    router.push(`?${params.toString()}`, { scroll: false })
    if (onPageChange) {
      onPageChange(newPage)
    }
  }

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'earn':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            Earned
          </Badge>
        )
      case 'spend':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            Spent
          </Badge>
        )
      case 'refund':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            Refund
          </Badge>
        )
      case 'adjustment':
        return (
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
            Adjustment
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            {type}
          </Badge>
        )
    }
  }

  const getSourceTypeLabel = (sourceType: string) => {
    const labels: Record<string, string> = {
      purchase: 'Booking',
      redemption: 'Redemption',
      referral_signup: 'Referral Signup',
      referral_booking: 'Referral Booking',
      refund: 'Refund',
      manual_adjustment: 'Manual Adjustment',
      expiry: 'Expired',
    }
    return labels[sourceType] || sourceType
  }

  const totalPages = Math.ceil(totalCount / pageSize)
  const startEntry = (page - 1) * pageSize + 1
  const endEntry = Math.min(page * pageSize, totalCount)

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <Card className="hidden lg:block overflow-x-auto py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                >
                  <TableCell className="font-medium">
                    {format(new Date(transaction.created_at), "MMM dd, yyyy")}
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(transaction.created_at), "HH:mm")}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTransactionTypeBadge(transaction.transaction_type)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {getSourceTypeLabel(transaction.source_type)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={cn(
                      "font-semibold flex items-center justify-end gap-1",
                      transaction.transaction_type === 'earn' || transaction.transaction_type === 'refund'
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {transaction.transaction_type === 'earn' || transaction.transaction_type === 'refund' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      {transaction.transaction_type === 'earn' || transaction.transaction_type === 'refund' ? '+' : '-'}
                      {Math.abs(transaction.points).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {transaction.balance_after.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {transaction.booking_reference ? (
                      <div>
                        <div className="font-medium text-sm">{transaction.booking_reference}</div>
                        {transaction.event_name && (
                          <div className="text-xs text-muted-foreground">{transaction.event_name}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-3">
        {transactions.length === 0 ? (
          <Card>
            <CardContent className="h-24 flex items-center justify-center text-muted-foreground">
              No transactions found.
            </CardContent>
          </Card>
        ) : (
          transactions.map((transaction) => (
            <Card key={transaction.id} className="hover:bg-accent/50 transition-colors">
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                      {/* Header: Date and Type */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-sm">
                            {format(new Date(transaction.created_at), "MMM dd, yyyy")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(transaction.created_at), "HH:mm")}
                          </span>
                        </div>
                        {getTransactionTypeBadge(transaction.transaction_type)}
                      </div>

                      {/* Description */}
                      <div>
                        <div className="font-medium text-sm">{transaction.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {getSourceTypeLabel(transaction.source_type)}
                        </div>
                      </div>

                      {/* Points and Balance Row */}
                      <div className="flex items-center justify-between gap-4 pt-1">
                        <div className={cn(
                          "font-semibold flex items-center gap-1 text-sm",
                          transaction.transaction_type === 'earn' || transaction.transaction_type === 'refund'
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        )}>
                          {transaction.transaction_type === 'earn' || transaction.transaction_type === 'refund' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )}
                          {transaction.transaction_type === 'earn' || transaction.transaction_type === 'refund' ? '+' : '-'}
                          {Math.abs(transaction.points).toLocaleString()} pts
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Balance</div>
                          <div className="font-medium text-sm">{transaction.balance_after.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Reference */}
                      {transaction.booking_reference && (
                        <div className="pt-1 border-t">
                          <div className="text-xs text-muted-foreground">Reference</div>
                          <div className="font-medium text-sm">{transaction.booking_reference}</div>
                          {transaction.event_name && (
                            <div className="text-xs text-muted-foreground">{transaction.event_name}</div>
                          )}
                        </div>
                      )}
                    </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startEntry} to {endEntry} of {totalCount} entries
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page > 1) {
                      handlePageChange(page - 1)
                    }
                  }}
                  className={cn(page === 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              
              {/* Show first page if not in range */}
              {page > 3 && (
                <>
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(1)
                      }}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  {page > 4 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                </>
              )}

              {/* Show pages around current page */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(pageNum)
                      }}
                      isActive={pageNum === page}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              {/* Show last page if not in range */}
              {page < totalPages - 2 && (
                <>
                  {page < totalPages - 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(totalPages)
                      }}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page < totalPages) {
                      handlePageChange(page + 1)
                    }
                  }}
                  className={cn(page === totalPages && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

