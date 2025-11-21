import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function PointsRedeemLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Skeleton className="h-9 w-64" />
      </div>

      {/* Redemption Rate Info Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>

      {/* Available Discount Card */}
      <div>
        <Skeleton className="h-7 w-48 mb-4" />
        <Card className="bg-black text-white border-none">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 bg-white/20" />
                <Skeleton className="h-4 w-32 bg-white/20" />
              </div>
              <div className="space-y-2 pt-4 border-t border-white/20">
                <Skeleton className="h-4 w-24 bg-white/20" />
                <Skeleton className="h-12 w-40 bg-white/20" />
                <Skeleton className="h-4 w-32 bg-white/20" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How to Redeem Steps */}
      <div>
        <Skeleton className="h-7 w-40 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Redemption Stats */}
      <div>
        <Skeleton className="h-7 w-40 mb-4" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

