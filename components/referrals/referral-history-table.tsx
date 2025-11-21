import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ReferralStatus = "pending" | "signed_up" | "completed" | "expired" | "cancelled"

export interface ReferralRecord {
  id: string
  referee_email: string
  status: ReferralStatus
  created_at: string
  signed_up_at?: string | null
  completed_at?: string | null
  referrer_booking_points?: number | null
}

const statusMap: Record<
  ReferralStatus,
  { label: string; badge: string }
> = {
  pending: {
    label: "Pending",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
  },
  signed_up: {
    label: "Signed up",
    badge: "bg-sky-100 text-sky-800 border-sky-200",
  },
  completed: {
    label: "Completed",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  expired: {
    label: "Expired",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
  },
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function ReferralHistoryTable({ referrals }: { referrals: ReferralRecord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Referral history</CardTitle>
      </CardHeader>
      <CardContent>
        {referrals.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            You haven&apos;t invited anyone yet. Use the form above to send your first invite.
          </div>
        ) : (
          <div className="space-y-4">
            {referrals.map((referral) => {
              const status = statusMap[referral.status] ?? statusMap.pending
              return (
                <div
                  key={referral.id}
                  className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{referral.referee_email}</p>
                    <p className="text-xs text-muted-foreground">Invited {formatDate(referral.created_at)}</p>
                    {referral.status === "completed" && (
                      <p className="text-xs text-emerald-700">
                        Earned {referral.referrer_booking_points || 0} pts when they booked
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <Badge variant="outline" className={cn("border", status.badge)}>
                      {status.label}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {referral.status === "signed_up" && `Signed up ${formatDate(referral.signed_up_at)}`}
                      {referral.status === "completed" && `Completed ${formatDate(referral.completed_at)}`}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

