'use client'

import { parseCalendarDate } from '@/lib/utils/date'
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
  bookingStatus: 'provisional' | 'confirmed' | 'completed' | 'cancelled'
  isFirstLoyaltyBooking: boolean
  totalAmount: number
  discountApplied: number
  currency: string
  bookingId: string
  teamId: string | null

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
  teamId,
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
  // --- Edit lock logic ---
  // CRITICAL: Never allow editing for cancelled or past trips
  const TEST_EDIT_LOCK_STATE: 'auto' | 'locked' | 'unlocked' = 'auto' // change for testing

  const now = new Date()
  now.setHours(0, 0, 0, 0) // Normalize to start of day for date comparison
  
  // Check if trip is cancelled or completed
  const isCancelledOrCompleted = bookingStatus === 'cancelled' || bookingStatus === 'completed'
  
  // Check if trip has passed (end date is in the past)
  let isPastTrip = false
  if (eventEndDate) {
    const end = parseCalendarDate(eventEndDate)
    if (end) {
      end.setHours(0, 0, 0, 0)
      isPastTrip = end < now
    }
  }

  // If cancelled, completed, or past trip, ALWAYS lock editing (regardless of test state)
  const isPermanentlyLocked = isCancelledOrCompleted || isPastTrip

  let isEditLocked = false
  let daysUntilLock: number | null = null
  let lockDate: string | null = null

  // Only apply 4-week lock logic if trip is not permanently locked
  if (!isPermanentlyLocked && eventStartDate) {
    const start = parseCalendarDate(eventStartDate)
    if (start) {
      const standardLockThreshold = new Date(start)
      standardLockThreshold.setDate(standardLockThreshold.getDate() - 28) // 4 weeks before event
      
      // Enterprise edge case handling: For last-minute bookings, provide a minimum grace period
      // This ensures customers always have time to add their details, even for bookings made within the lock window
      let effectiveLockThreshold = standardLockThreshold
      
      if (bookedAt) {
        try {
          const bookingDate = new Date(bookedAt)
          bookingDate.setHours(0, 0, 0, 0)
          
          // If booking was made after the standard lock threshold, apply grace period logic
          if (bookingDate > standardLockThreshold) {
            // Calculate days between booking and event
            const daysFromBookingToEvent = Math.floor((start.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24))
            
            // Grace period rules:
            // - If booking is < 7 days before event: 48 hours grace period
            // - If booking is 7-14 days before event: 3 days grace period
            // - If booking is 14-21 days before event: 5 days grace period
            // - Otherwise: use standard 28-day threshold
            let gracePeriodDays = 0
            if (daysFromBookingToEvent < 7) {
              gracePeriodDays = 2 // 48 hours minimum
            } else if (daysFromBookingToEvent < 14) {
              gracePeriodDays = 3
            } else if (daysFromBookingToEvent < 21) {
              gracePeriodDays = 5
            }
            
            if (gracePeriodDays > 0) {
              const gracePeriodThreshold = new Date(bookingDate)
              gracePeriodThreshold.setDate(gracePeriodThreshold.getDate() + gracePeriodDays)
              
              // Use the later of: standard lock date OR grace period end date
              // This ensures we never lock before the standard threshold, but provide grace for late bookings
              effectiveLockThreshold = gracePeriodThreshold > standardLockThreshold 
                ? gracePeriodThreshold 
                : standardLockThreshold
            }
          }
        } catch {
          // If bookedAt parsing fails, fall back to standard threshold
        }
      }
      
      lockDate = effectiveLockThreshold.toISOString()

      if (now >= effectiveLockThreshold) {
        isEditLocked = true
      } else {
        // Use actual current time (not normalized) to match countdown timer calculation
        const actualNow = Date.now()
        const diffMs = effectiveLockThreshold.getTime() - actualNow
        // Use Math.floor to match the countdown timer calculation
        daysUntilLock = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      }
    }
  }

  // Override with test state only if not permanently locked
  if (!isPermanentlyLocked) {
    if (TEST_EDIT_LOCK_STATE === 'locked') {
      isEditLocked = true
      daysUntilLock = null
    } else if (TEST_EDIT_LOCK_STATE === 'unlocked') {
      isEditLocked = false
      // keep computed lockDate so we can still show the date in UI while forcing unlocked for testing
    }
  }

  // If permanently locked (cancelled/completed/past), force lock regardless of test state
  if (isPermanentlyLocked) {
    isEditLocked = true
    daysUntilLock = null
  }

  const hasBookedFlights = flights?.some(
    (f: any) => !f.deleted_at && (f.flight_type === 'booked' || !f.flight_type)
  )

  // Travellers can be edited until 4 weeks before departure (even if flights are booked),
  // but some fields (name/email/phone) will be locked when flights are booked.
  // NEVER allow editing for cancelled/completed/past trips
  const canEditTravellers = !isEditLocked && !isPermanentlyLocked

  // Customer flight details can only be added/edited when there are no booked flights
  // and we are not inside the 4-week lock window.
  // NEVER allow editing for cancelled/completed/past trips
  const canEditFlights = !isEditLocked && !hasBookedFlights && !isPermanentlyLocked

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
          payments={payments}
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
          isPermanentlyLocked={isPermanentlyLocked}
          bookingStatus={bookingStatus}
          bookingId={bookingId}
          teamId={teamId}
          bookingReference={bookingReference}
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
          teamId={teamId}
          bookingReference={bookingReference}
          canEdit={canEditFlights}
          isEditLocked={isEditLocked}
          daysUntilLock={daysUntilLock}
          lockDate={lockDate}
          isPermanentlyLocked={isPermanentlyLocked}
          bookingStatus={bookingStatus}
        />
      </TabsContent>

      <TabsContent value="payments" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
        <PaymentSummarySection
          totalAmount={totalAmount}
          discountApplied={discountApplied}
          currency={currency}
          preferredCurrency={preferredCurrency}
          discountAppliedConverted={discountAppliedConverted}
          payments={payments}
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

