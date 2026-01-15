import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeaderSkeleton } from '@/components/ui/page-header-skeleton'

export default function TripsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full lg:w-fit grid-cols-3 h-auto gap-1 sm:gap-2">
          <TabsTrigger value="upcoming" disabled className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-4 md:px-6 py-2 sm:py-2.5">
            Upcoming Trip
          </TabsTrigger>
          <TabsTrigger value="past" disabled className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-4 md:px-6 py-2 sm:py-2.5">
            Past Trips
          </TabsTrigger>
          <TabsTrigger value="all" disabled className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-4 md:px-6 py-2 sm:py-2.5">
            All Trips
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

