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
  preferredCurrency?: string
  discountAppliedConverted?: number
  
  // Tickets
  ticketDaysMap?: Map<string, string | null>
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
  redemptions,
  ticketDaysMap,
  preferredCurrency,
  discountAppliedConverted
}: TripDetailsTabsProps) {
  // --- Edit lock logic (4 weeks before event start) ---
  const TEST_EDIT_LOCK_STATE: 'auto' | 'locked' | 'unlocked' = 'auto' // change for testing

  const now = new Date()
  let isEditLocked = false
  let daysUntilLock: number | null = null
  let lockDate: string | null = null

  if (eventStartDate) {
    try {
      const start = new Date(eventStartDate)
      const lockThreshold = new Date(start)
      lockThreshold.setDate(lockThreshold.getDate() - 28) // 4 weeks before event
      lockDate = lockThreshold.toISOString()

      if (now >= lockThreshold) {
        isEditLocked = true
      } else {
        const diffMs = lockThreshold.getTime() - now.getTime()
        daysUntilLock = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      }
    } catch {
      // ignore parsing errors, fall back to unlocked
    }
  }

  if (TEST_EDIT_LOCK_STATE === 'locked') {
    isEditLocked = true
    daysUntilLock = null
  } else if (TEST_EDIT_LOCK_STATE === 'unlocked') {
    isEditLocked = false
    // keep computed lockDate so we can still show the date in UI while forcing unlocked for testing
  }

  const hasBookedFlights = flights?.some(
    (f: any) => !f.deleted_at && (f.flight_type === 'booked' || !f.flight_type)
  )

  // Travellers can be edited until 4 weeks before departure (even if flights are booked),
  // but some fields (name/email/phone) will be locked when flights are booked.
  const canEditTravellers = !isEditLocked

  // Customer flight details can only be added/edited when there are no booked flights
  // and we are not inside the 4-week lock window.
  const canEditFlights = !isEditLocked && !hasBookedFlights

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full lg:w-fit grid-cols-3 lg:grid-cols-5 h-auto gap-1 sm:gap-2">
        <TabsTrigger value="overview" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-4 md:px-6 py-2 sm:py-2.5">
          Overview
        </TabsTrigger>
        <TabsTrigger value="travelers" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-4 md:px-6 py-2 sm:py-2.5">
          Travellers
        </TabsTrigger>
        <TabsTrigger value="included" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-4 md:px-6 py-2 sm:py-2.5">
          Package Components
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
          preferredCurrency={preferredCurrency}
          discountAppliedConverted={discountAppliedConverted}
        />
      </TabsContent>

      <TabsContent value="travelers" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
        <TravelersSection 
          travelers={travelers} 
          canEdit={canEditTravellers}
          isEditLocked={isEditLocked}
          daysUntilLock={daysUntilLock}
          hasBookedFlights={hasBookedFlights}
          lockDate={lockDate}
        />
      </TabsContent>

      <TabsContent value="included" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
        <BookingComponentsSection 
          components={components} 
          currency={currency}
          ticketDaysMap={ticketDaysMap}
        />
        <FlightsSection 
          flights={flights} 
          currency={currency}
          bookingId={bookingId}
          canEdit={canEditFlights}
          isEditLocked={isEditLocked}
          daysUntilLock={daysUntilLock}
          lockDate={lockDate}
        />
      </TabsContent>

      <TabsContent value="payments" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
        <PaymentSummarySection
          totalAmount={totalAmount}
          discountApplied={discountApplied}
          currency={currency}
          preferredCurrency={preferredCurrency}
          discountAppliedConverted={discountAppliedConverted}
        />
        <PaymentScheduleSection 
          payments={payments}
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
          preferredCurrency={preferredCurrency}
          discountAppliedConverted={discountAppliedConverted}
        />
      </TabsContent>
    </Tabs>
  )
}

