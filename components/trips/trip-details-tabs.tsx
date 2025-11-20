'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EventDetailsSection } from '@/components/trips/event-details-section'
import { BookingDetailsSection } from '@/components/trips/booking-details-section'
import { PaymentSummarySection } from '@/components/trips/payment-summary-section'
import { TravelersSection } from '@/components/trips/travelers-section'
import { PaymentScheduleSection } from '@/components/trips/payment-schedule-section'
import { BookingComponentsSection } from '@/components/trips/booking-components-section'
import { FlightsSection } from '@/components/trips/flights-section'
import { LoyaltyPointsSection } from '@/components/trips/loyalty-points-section'

interface TripDetailsTabsProps {
  // Overview
  eventName: string
  eventLocation: string
  eventStartDate: string | null
  eventEndDate: string | null
  eventImage?: any | null
  bookingReference: string
  bookedAt: string | null
  confirmedAt: string | null
  bookingStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  isFirstLoyaltyBooking: boolean
  totalAmount: number
  discountApplied: number
  currency: string
  bookingId: string
  
  // Travelers
  travelers: any[]
  
  // Included
  components: any[]
  flights: any[]
  
  // Payments
  payments: any[]
  
  // Loyalty
  pointsUsed: number
  pointsEarned: number
  pointValue: number
  isCancelled: boolean
  earnTransaction?: any
  spendTransaction?: any
  redemptions?: any[]
}

export function TripDetailsTabs({
  eventName,
  eventLocation,
  eventStartDate,
  eventEndDate,
  eventImage,
  bookingReference,
  bookedAt,
  confirmedAt,
  bookingStatus,
  isFirstLoyaltyBooking,
  totalAmount,
  discountApplied,
  currency,
  bookingId,
  travelers,
  components,
  flights,
  payments,
  pointsUsed,
  pointsEarned,
  pointValue,
  isCancelled,
  earnTransaction,
  spendTransaction,
  redemptions
}: TripDetailsTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full lg:w-fit grid-cols-3 lg:grid-cols-5 h-auto gap-1 sm:gap-2">
        <TabsTrigger value="overview" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-4 md:px-6 py-2 sm:py-2.5">
          Overview
        </TabsTrigger>
        <TabsTrigger value="travelers" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-4 md:px-6 py-2 sm:py-2.5">
          Travelers
        </TabsTrigger>
        <TabsTrigger value="included" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-4 md:px-6 py-2 sm:py-2.5">
          Included
        </TabsTrigger>
        <TabsTrigger value="payments" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-4 md:px-6 py-2 sm:py-2.5">
          Payments
        </TabsTrigger>
        <TabsTrigger value="points" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-4 md:px-6 py-2 sm:py-2.5">
          Points
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
        {/* Event Details */}
        <EventDetailsSection
          eventName={eventName}
          location={eventLocation}
          startDate={eventStartDate}
          endDate={eventEndDate}
          eventImage={eventImage}
        />

        {/* Booking Details */}
        <BookingDetailsSection
          bookingReference={bookingReference}
          bookedAt={bookedAt}
          confirmedAt={confirmedAt}
          bookingStatus={bookingStatus}
          isFirstLoyaltyBooking={isFirstLoyaltyBooking}
        />

        {/* Payment Summary */}
        <PaymentSummarySection
          totalAmount={totalAmount}
          discountApplied={discountApplied}
          currency={currency}
        />
      </TabsContent>

      <TabsContent value="travelers" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
        <TravelersSection travelers={travelers} />
      </TabsContent>

      <TabsContent value="included" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
        <BookingComponentsSection 
          components={components} 
          currency={currency}
        />
        <FlightsSection 
          flights={flights} 
          currency={currency}
          bookingId={bookingId}
        />
      </TabsContent>

      <TabsContent value="payments" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
        <PaymentSummarySection
          totalAmount={totalAmount}
          discountApplied={discountApplied}
          currency={currency}
        />
        <PaymentScheduleSection 
          payments={payments} 
          currency={currency}
        />
      </TabsContent>

      <TabsContent value="points" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
        <LoyaltyPointsSection
          pointsUsed={pointsUsed}
          pointsEarned={pointsEarned}
          discountApplied={discountApplied}
          currency={currency}
          pointValue={pointValue}
          totalAmount={totalAmount}
          isCancelled={isCancelled}
          earnTransaction={earnTransaction}
          spendTransaction={spendTransaction}
          redemptions={redemptions}
          isFirstLoyaltyBooking={isFirstLoyaltyBooking}
        />
      </TabsContent>
    </Tabs>
  )
}

