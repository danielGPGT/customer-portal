import { Skeleton } from '@/components/ui/skeleton'

export function PageHeaderSkeleton() {
  return (
    <div className="relative w-full overflow-hidden rounded-3xl">
      <div className="relative w-full h-48 sm:h-56 md:h-64 lg:h-72">
        {/* Background Image Skeleton */}
        <Skeleton className="absolute inset-0" />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Content Skeleton */}
        <div className="relative flex flex-col px-4 md:px-16 py-6 sm:py-8 md:py-16 lg:py-16 justify-center mx-auto h-full">
          <div className="max-w-2xl w-full space-y-3 sm:space-y-4">
            <Skeleton className="h-8 sm:h-10 md:h-12 lg:h-14 w-3/4 bg-white/20" />
            <Skeleton className="h-4 sm:h-5 md:h-6 w-2/3 bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  )
}
