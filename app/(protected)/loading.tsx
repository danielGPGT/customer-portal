import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <>
      {/* Dashboard Header Skeleton - Full Width with Image Background */}
      <div className="relative w-full overflow-hidden rounded-3xl">
        <div className="relative w-full">
          {/* Background Image Skeleton */}
          <Skeleton className="absolute inset-0 h-64 md:h-80 lg:h-96" />
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Content Skeleton */}
          <div className="relative flex flex-col px-4 md:px-16 py-6 sm:py-8 md:py-16 lg:py-16 justify-center mx-auto">
            {/* Welcome Section Skeleton */}
            <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12 max-w-2xl w-full space-y-3">
              <Skeleton className="h-8 sm:h-10 md:h-12 lg:h-14 w-3/4 bg-white/20" />
              <Skeleton className="h-4 sm:h-5 md:h-6 w-2/3 bg-white/20" />
            </div>

            {/* Stats Cards Skeleton */}
            <div className="w-full pt-12">
              {/* Mobile Carousel Skeleton */}
              <div className="sm:hidden w-full">
                <div className="flex gap-3 overflow-hidden">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="min-w-[85%] flex-shrink-0">
                      <div className="rounded-xl bg-white/95 backdrop-blur-md p-4 sm:p-5 md:p-6 shadow-lg border border-gray-100">
                        <div className="flex items-start gap-3">
                          <Skeleton className="w-1 h-12 bg-primary/20 rounded-full shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Grid Skeleton */}
              <div className="hidden sm:grid sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-white/95 backdrop-blur-md p-4 sm:p-5 md:p-6 shadow-lg border border-gray-100">
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-1 h-12 bg-primary/20 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="space-y-8 pb-8 w-full max-w-full overflow-x-hidden mt-8">
        {/* Upcoming Trip Section Skeleton */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-8 md:h-10 w-48" />
            <Skeleton className="h-5 w-3/4 max-w-md" />
          </div>
          
          {/* Upcoming Trips Card Skeleton */}
          <Card className="rounded-3xl border border-border/50 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[350px]">
              {/* Left Column: Trip Details */}
              <div className="flex flex-col justify-between p-5 md:p-6 lg:p-8 space-y-5">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="space-y-2">
                    <Skeleton className="h-7 md:h-8 w-3/4" />
                    <Skeleton className="h-3 w-40" />
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    {/* Date */}
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-5 w-48" />
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-5 w-36" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button Skeleton */}
                <Skeleton className="h-10 w-40" />
              </div>

              {/* Right Column: Image */}
              <div className="relative h-[280px] lg:h-auto overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10">
                <Skeleton className="absolute inset-0" />
              </div>
            </div>
          </Card>
        </div>

        {/* Points Guide Section Skeleton */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-8 md:h-10 w-48" />
            <Skeleton className="h-5 w-3/4 max-w-md" />
          </div>
          
          {/* Earn & Redeem Cards Skeleton */}
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="border-border/50">
                <div className="p-6 space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  </div>

                  {/* CTA Button Skeleton */}
                  <Skeleton className="h-10 w-full mt-4" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

