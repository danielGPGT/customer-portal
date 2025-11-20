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
  travelers,
  components,
  flights,
  payments,
  pointsUsed,
  pointsEarned,
  pointValue,
  isCancelled
}: TripDetailsTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
        <TabsTrigger value="overview" className="text-xs sm:text-sm">
          Overview
        </TabsTrigger>
        <TabsTrigger value="travelers" className="text-xs sm:text-sm">
          Travelers
        </TabsTrigger>
        <TabsTrigger value="included" className="text-xs sm:text-sm">
          Included
        </TabsTrigger>
        <TabsTrigger value="payments" className="text-xs sm:text-sm">
          Payments
        </TabsTrigger>
        <TabsTrigger value="points" className="text-xs sm:text-sm">
          Points
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 mt-6">
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

      <TabsContent value="travelers" className="space-y-6 mt-6">
        <TravelersSection travelers={travelers} />
      </TabsContent>

      <TabsContent value="included" className="space-y-6 mt-6">
        <BookingComponentsSection 
          components={components} 
          currency={currency}
        />
        <FlightsSection 
          flights={flights} 
          currency={currency}
        />
      </TabsContent>

      <TabsContent value="payments" className="space-y-6 mt-6">
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

      <TabsContent value="points" className="space-y-6 mt-6">
        <LoyaltyPointsSection
          pointsUsed={pointsUsed}
          pointsEarned={pointsEarned}
          currency={currency}
          pointValue={pointValue}
          totalAmount={totalAmount}
          isCancelled={isCancelled}
        />
      </TabsContent>
    </Tabs>
  )
}

