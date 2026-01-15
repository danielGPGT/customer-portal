'use client'

import { Coins, ShoppingCart, Target, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'

interface DashboardHeaderProps {
  firstName: string
  pointsBalance: number
  lifetimePointsSpent: number
  redemptionIncrement?: number
  minRedemptionPoints?: number
}

export function DashboardHeader({
  firstName,
  pointsBalance,
  lifetimePointsSpent,
  redemptionIncrement = 100,
  minRedemptionPoints = 100,
}: DashboardHeaderProps) {
  // Calculate next milestone and progress
  const currentPoints = pointsBalance
  let nextMilestone: number
  let progressPercentage: number
  let pointsToNext: number

  if (currentPoints < minRedemptionPoints) {
    // Below minimum, show progress to minimum
    nextMilestone = minRedemptionPoints
    progressPercentage = (currentPoints / minRedemptionPoints) * 100
    pointsToNext = minRedemptionPoints - currentPoints
  } else {
    // Show progress to next redemption increment
    const currentLevel = Math.floor(currentPoints / redemptionIncrement)
    const nextLevel = currentLevel + 1
    nextMilestone = nextLevel * redemptionIncrement
    const progressInCurrentLevel = currentPoints % redemptionIncrement
    progressPercentage = (progressInCurrentLevel / redemptionIncrement) * 100
    pointsToNext = nextMilestone - currentPoints
  }
  return (
    <div className="relative w-full overflow-hidden rounded-3xl">
      {/* Background Image - Full Width */}
      <div className="relative w-full">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/assets/images/67b47522e00a9d3b8432bdd7_67b4739ca8ab15bb14dcff85_Singapore-Home-Tile-min.avif"
            alt="Travel background"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>

        {/* Dark Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Gradient Overlay - Top section (filled to transparent) */}
        <div
          className="absolute inset-0"
          style={{
            maskImage: 'linear-gradient(to bottom, black 0%, black 20%, transparent 50%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 20%, transparent 50%)',
            background: 'var(--secondary-1000)',
          }}
        />
        
        {/* Gradient Overlay - Bottom section (transparent to filled) */}
        <div 
          className="absolute inset-0"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 50%, black 80%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 50%, black 80%, black 100%)',
            background: 'var(--secondary-1000)',
          }}
        />

        {/* Content - Welcome Text and Cards */}
        <div className="relative flex flex-col px-4 md:px-16 py-6 sm:py-8 md:py-16 lg:py-16 justify-center mx-auto">
          {/* Welcome Section */}
          <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12 max-w-2xl w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 md:mb-4">
              Welcome {firstName}
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 leading-relaxed px-2">
              Track your loyalty points, manage your trips, and unlock exclusive rewards. 
              Your next adventure is just a booking away.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="w-full pt-12">
            {/* Mobile Carousel */}
            <div className="sm:hidden w-full">
              <Carousel opts={{ align: 'start' }} className="w-full">
                <CarouselContent className="-ml-2 md:-ml-4">
                  <CarouselItem className="pl-2 md:pl-4 basis-[85%]">
                    <div className="group relative rounded-xl bg-white/95 backdrop-blur-md p-4 sm:p-5 md:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 cursor-pointer">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="w-1 h-10 sm:h-12 bg-primary rounded-full shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                              <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                              <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">Points Balance</h3>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
                          </div>
                          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">
                            {pointsBalance.toLocaleString()}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                            Your available points ready to redeem for discounts and rewards.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                  <CarouselItem className="pl-2 md:pl-4 basis-[85%]">
                    <div className="group relative rounded-xl bg-white/95 backdrop-blur-md p-4 sm:p-5 md:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 cursor-pointer">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="w-1 h-10 sm:h-12 bg-primary rounded-full shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                              <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">Points Spent</h3>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
                          </div>
                          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">
                            {lifetimePointsSpent.toLocaleString()}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                            Total points you've redeemed throughout your membership.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                  <CarouselItem className="pl-2 md:pl-4 basis-[85%]">
                    <div className="group relative rounded-xl bg-white/95 backdrop-blur-md p-4 sm:p-5 md:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 cursor-pointer">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="w-1 h-10 sm:h-12 bg-primary rounded-full shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-4.5 sm:mb-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                              <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">Next Milestone</h3>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
                          </div>
 
                          <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed mb-2">
                          {pointsToNext} points until {nextMilestone.toLocaleString()} points
                          </p>
                          {/* Progress Bar */}
                          <div className="w-full">
                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                              <span>{currentPoints.toLocaleString()}</span>
                              <span>{nextMilestone.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
            </div>

            {/* Desktop Grid */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {/* Card 1: Points Balance */}
              <div className="group relative rounded-xl bg-white/95 backdrop-blur-md p-4 sm:p-5 md:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 cursor-pointer">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-1 h-10 sm:h-12 bg-primary rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                        <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">Points Balance</h3>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
                    </div>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">
                      {pointsBalance.toLocaleString()}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                      Your available points ready to redeem for discounts and rewards.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Points Spent */}
              <div className="group relative rounded-xl bg-white/95 backdrop-blur-md p-4 sm:p-5 md:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 cursor-pointer">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-1 h-10 sm:h-12 bg-primary rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                        <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">Points Spent</h3>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
                    </div>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">
                      {lifetimePointsSpent.toLocaleString()}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                      Total points you've redeemed throughout your membership.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Points Till Next Milestone */}
              <div className="group relative rounded-xl bg-white/95 backdrop-blur-md p-4 sm:p-5 md:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 cursor-pointer">
                <div className="flex items-start gap-2 sm:gap-3 h-full">
                  <div className="w-1 h-10 sm:h-12 bg-primary rounded-full shrink-0" />
                  <div className="flex-1 min-w-0 h-full">
                    
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                        <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">Next Milestone</h3>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
                    </div>
                    <div className="flex flex-col gap-2 h-full justify-center">
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed mb-2">
                      {pointsToNext} points until {nextMilestone.toLocaleString()} points
                    </p>
                    {/* Progress Bar */}
                    <div className="w-full">
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                        <span>{currentPoints.toLocaleString()}</span>
                        <span>{nextMilestone.toLocaleString()}</span>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
