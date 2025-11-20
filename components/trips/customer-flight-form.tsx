'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Loader2, Plane } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

const flightFormSchema = z.object({
  isRoundTrip: z.boolean(),
  // Outbound (first departure and final arrival)
  outboundOrigin: z.string().min(3, 'Departure airport code required').max(3),
  outboundDestination: z.string().min(3, 'Arrival airport code required').max(3),
  outboundDepartureDateTime: z.string().min(1, 'Departure date/time required'),
  outboundArrivalDateTime: z.string().min(1, 'Arrival date/time required'),
  outboundFlightNumber: z.string().min(1, 'Flight number required'),
  outboundAirlineCode: z.string().optional(),
  // Return (first departure and final arrival)
  returnOrigin: z.string().optional(),
  returnDestination: z.string().optional(),
  returnDepartureDateTime: z.string().optional(),
  returnArrivalDateTime: z.string().optional(),
  returnFlightNumber: z.string().optional(),
  returnAirlineCode: z.string().optional(),
}).refine((data) => {
  if (data.isRoundTrip) {
    return !!data.returnOrigin && !!data.returnDestination && 
           !!data.returnDepartureDateTime && !!data.returnArrivalDateTime &&
           !!data.returnFlightNumber
  }
  return true
}, {
  message: 'Return flight information required for round trip',
  path: ['returnOrigin'],
})

type FlightFormData = z.infer<typeof flightFormSchema>

interface Airport {
  id: string
  iata_code: string
  name: string
  city: string | null
  country: string | null
}

interface CustomerFlightFormProps {
  bookingId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  flightId?: string | null // Optional flight ID for edit mode
  editingSegment?: {
    type: 'outbound' | 'return'
    index: number
  } | null // Optional segment being edited
}

export function CustomerFlightForm({ bookingId, open, onOpenChange, onSuccess, flightId, editingSegment }: CustomerFlightFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  // Separate state for each field to prevent cross-contamination
  const [airports, setAirports] = useState<Record<string, Airport[]>>({})
  const [airportSearchOpen, setAirportSearchOpen] = useState<Record<string, boolean>>({})
  const [airportSearchQuery, setAirportSearchQuery] = useState<Record<string, string>>({})
  // Store selected airports to ensure we can display them even if not in current search results
  const [selectedAirports, setSelectedAirports] = useState<Record<string, Airport>>({})

  const form = useForm<FlightFormData>({
    resolver: zodResolver(flightFormSchema),
    defaultValues: {
      isRoundTrip: true,
      outboundOrigin: '',
      outboundDestination: '',
      outboundDepartureDateTime: '',
      outboundArrivalDateTime: '',
      outboundFlightNumber: '',
      outboundAirlineCode: '',
      returnOrigin: '',
      returnDestination: '',
      returnDepartureDateTime: '',
      returnArrivalDateTime: '',
      returnFlightNumber: '',
      returnAirlineCode: '',
    },
  })

  const isRoundTrip = form.watch('isRoundTrip')

  // Load existing flight data when editing
  useEffect(() => {
    const loadFlightData = async () => {
      if (!open || !flightId) {
        form.reset()
        return
      }

      const supabase = createClient()
      const { data: flight, error } = await supabase
        .from('bookings_flights')
        .select('flight_details, outbound_airline_code, inbound_airline_code')
        .eq('id', flightId)
        .eq('flight_type', 'customer')
        .single()

      if (error || !flight) {
        toast({
          title: 'Error loading flight',
          description: 'Could not load flight data. Please try again.',
          variant: 'destructive',
        })
        form.reset()
        return
      }

      const details = flight.flight_details as any
      if (!details) {
        form.reset()
        return
      }

      // Format datetime strings for input fields (YYYY-MM-DDTHH:mm)
      const formatDateTimeForInput = (dateTime: string | null | undefined) => {
        if (!dateTime) return ''
        try {
          const date = new Date(dateTime)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          return `${year}-${month}-${day}T${hours}:${minutes}`
        } catch {
          return dateTime
        }
      }

      // If editing a specific segment, only load that segment's data
      if (editingSegment) {
        const segment = editingSegment.type === 'outbound'
          ? details.outboundSegments?.[editingSegment.index]
          : details.returnSegments?.[editingSegment.index]

        if (segment) {
          if (editingSegment.type === 'outbound') {
            form.reset({
              isRoundTrip: false,
              outboundOrigin: segment.departureCode || '',
              outboundDestination: segment.arrivalCode || '',
              outboundDepartureDateTime: formatDateTimeForInput(segment.departureDateTime),
              outboundArrivalDateTime: formatDateTimeForInput(segment.arrivalDateTime),
              outboundFlightNumber: segment.flightNumber || '',
              outboundAirlineCode: segment.marketingAirlineCode || '',
              returnOrigin: '',
              returnDestination: '',
              returnDepartureDateTime: '',
              returnArrivalDateTime: '',
              returnFlightNumber: '',
              returnAirlineCode: '',
            })
          } else {
            form.reset({
              isRoundTrip: false,
              outboundOrigin: '',
              outboundDestination: '',
              outboundDepartureDateTime: '',
              outboundArrivalDateTime: '',
              outboundFlightNumber: '',
              outboundAirlineCode: '',
              returnOrigin: segment.departureCode || '',
              returnDestination: segment.arrivalCode || '',
              returnDepartureDateTime: formatDateTimeForInput(segment.departureDateTime),
              returnArrivalDateTime: formatDateTimeForInput(segment.arrivalDateTime),
              returnFlightNumber: segment.flightNumber || '',
              returnAirlineCode: segment.marketingAirlineCode || '',
            })
          }
          
          // Fetch and store airport details for display
          if (segment.departureCode) {
            const { data: depAirport } = await supabase
              .from('airports')
              .select('*')
              .eq('iata_code', segment.departureCode)
              .single()
            if (depAirport) {
              setSelectedAirports(prev => ({ ...prev, [`${editingSegment.type}-origin`]: depAirport }))
            }
          }
          if (segment.arrivalCode) {
            const { data: arrAirport } = await supabase
              .from('airports')
              .select('*')
              .eq('iata_code', segment.arrivalCode)
              .single()
            if (arrAirport) {
              setSelectedAirports(prev => ({ ...prev, [`${editingSegment.type}-destination`]: arrAirport }))
            }
          }
          return
        }
      }

      // Full flight edit - load all segments
      const outboundSegment = details.outboundSegments?.[0]
      const returnSegment = details.returnSegments?.[0]

      // Set form values
      form.reset({
        isRoundTrip: !!(returnSegment || details.returnDate),
        outboundOrigin: details.origin || '',
        outboundDestination: details.destination || '',
        outboundDepartureDateTime: formatDateTimeForInput(outboundSegment?.departureDateTime || details.departureDate),
        outboundArrivalDateTime: formatDateTimeForInput(outboundSegment?.arrivalDateTime),
        outboundFlightNumber: outboundSegment?.flightNumber || '',
        outboundAirlineCode: outboundSegment?.marketingAirlineCode || flight.outbound_airline_code || '',
        returnOrigin: returnSegment?.departureCode || '',
        returnDestination: returnSegment?.arrivalCode || '',
        returnDepartureDateTime: formatDateTimeForInput(returnSegment?.departureDateTime || details.returnDate),
        returnArrivalDateTime: formatDateTimeForInput(returnSegment?.arrivalDateTime),
        returnFlightNumber: returnSegment?.flightNumber || '',
        returnAirlineCode: returnSegment?.marketingAirlineCode || flight.inbound_airline_code || '',
      })

      // Fetch and store airport details for display
      if (details.origin) {
        const { data: originAirport } = await supabase
          .from('airports')
          .select('*')
          .eq('iata_code', details.origin)
          .single()
        if (originAirport) {
          setSelectedAirports(prev => ({ ...prev, 'outbound-origin': originAirport }))
        }
      }
      if (details.destination) {
        const { data: destAirport } = await supabase
          .from('airports')
          .select('*')
          .eq('iata_code', details.destination)
          .single()
        if (destAirport) {
          setSelectedAirports(prev => ({ ...prev, 'outbound-destination': destAirport }))
        }
      }
      if (returnSegment?.departureCode) {
        const { data: returnOriginAirport } = await supabase
          .from('airports')
          .select('*')
          .eq('iata_code', returnSegment.departureCode)
          .single()
        if (returnOriginAirport) {
          setSelectedAirports(prev => ({ ...prev, 'return-origin': returnOriginAirport }))
        }
      }
      if (returnSegment?.arrivalCode) {
        const { data: returnDestAirport } = await supabase
          .from('airports')
          .select('*')
          .eq('iata_code', returnSegment.arrivalCode)
          .single()
        if (returnDestAirport) {
          setSelectedAirports(prev => ({ ...prev, 'return-destination': returnDestAirport }))
        }
      }
    }

    loadFlightData()
  }, [open, flightId, editingSegment, form, toast])

  // Reset return fields when round trip is toggled
  useEffect(() => {
    if (!isRoundTrip) {
      form.setValue('returnOrigin', '')
      form.setValue('returnDestination', '')
      form.setValue('returnDepartureDateTime', '')
      form.setValue('returnArrivalDateTime', '')
      form.setValue('returnFlightNumber', '')
      form.setValue('returnAirlineCode', '')
      // Clear stored airports for return fields
      setSelectedAirports(prev => {
        const { 'return-origin': _, 'return-destination': __, ...rest } = prev
        return rest
      })
    }
  }, [isRoundTrip, form])

  // Fetch airport details when a field value is set and we don't have the details
  useEffect(() => {
    const fetchAirportDetails = async (code: string, fieldId: string) => {
      if (!code || code.length !== 3) return
      
      // Check if we already have it stored
      if (selectedAirports[fieldId]?.iata_code === code) return
      
      // Check if it's in current search results
      const fieldAirports = airports[fieldId] || []
      if (fieldAirports.some(a => a.iata_code === code)) {
        const airport = fieldAirports.find(a => a.iata_code === code)
        if (airport) {
          setSelectedAirports(prev => ({ ...prev, [fieldId]: airport }))
          return
        }
      }

      // Fetch from API
      try {
        const response = await fetch(`/api/airports/search?q=${encodeURIComponent(code)}&limit=1`)
        if (response.ok) {
          const result = await response.json()
          const fetchedAirport = result.data?.find((a: Airport) => a.iata_code === code)
          if (fetchedAirport) {
            setSelectedAirports(prev => ({ ...prev, [fieldId]: fetchedAirport }))
          }
        }
      } catch (error) {
        console.error('Error fetching airport details:', error)
      }
    }

    const outboundOrigin = form.watch('outboundOrigin')
    const outboundDestination = form.watch('outboundDestination')
    const returnOrigin = form.watch('returnOrigin')
    const returnDestination = form.watch('returnDestination')

    if (outboundOrigin) fetchAirportDetails(outboundOrigin, 'outbound-origin')
    if (outboundDestination) fetchAirportDetails(outboundDestination, 'outbound-destination')
    if (returnOrigin) fetchAirportDetails(returnOrigin, 'return-origin')
    if (returnDestination) fetchAirportDetails(returnDestination, 'return-destination')
  }, [form.watch('outboundOrigin'), form.watch('outboundDestination'), form.watch('returnOrigin'), form.watch('returnDestination'), selectedAirports, airports])

  // Airline selection is handled client-side via search results

  // Search airports server-side - stores results per field
  const searchAirports = async (fieldId: string, query: string) => {
    if (!query || query.length < 1) {
      setAirports(prev => ({ ...prev, [fieldId]: [] }))
      return
    }

    try {
      const response = await fetch(`/api/airports/search?q=${encodeURIComponent(query)}&limit=50`)
      if (!response.ok) throw new Error('Failed to search airports')
      
      const result = await response.json()
      setAirports(prev => ({ ...prev, [fieldId]: result.data || [] }))
      setAirportSearchQuery(prev => ({ ...prev, [fieldId]: query }))
    } catch (error) {
      console.error('Error searching airports:', error)
      setAirports(prev => ({ ...prev, [fieldId]: [] }))
    }
  }

  const onSubmit = async (data: FlightFormData) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Fetch airport details from API
      const outboundOriginResp = await fetch(`/api/airports/search?q=${encodeURIComponent(data.outboundOrigin)}&limit=1`)
      const outboundOriginData = await outboundOriginResp.json()
      const outboundOriginAirport = outboundOriginData.data?.find((a: Airport) => a.iata_code === data.outboundOrigin)

      const outboundDestResp = await fetch(`/api/airports/search?q=${encodeURIComponent(data.outboundDestination)}&limit=1`)
      const outboundDestData = await outboundDestResp.json()
      const outboundDestAirport = outboundDestData.data?.find((a: Airport) => a.iata_code === data.outboundDestination)

      // Build outbound segment (single segment - first departure and final arrival)
      const outboundSegment = {
        departure: outboundOriginAirport?.city || outboundOriginAirport?.name || data.outboundOrigin,
        arrival: outboundDestAirport?.city || outboundDestAirport?.name || data.outboundDestination,
        departureCode: data.outboundOrigin,
        arrivalCode: data.outboundDestination,
        departureDateTime: data.outboundDepartureDateTime,
        arrivalDateTime: data.outboundArrivalDateTime,
        flightNumber: data.outboundFlightNumber,
        marketingAirline: '',
        marketingAirlineCode: data.outboundAirlineCode || '',
      }

      // Build return segment if round trip
      let returnSegment = null
      if (data.isRoundTrip && data.returnOrigin && data.returnDestination) {
        // Fetch return airport details
        const returnOriginResp = await fetch(`/api/airports/search?q=${encodeURIComponent(data.returnOrigin)}&limit=1`)
        const returnOriginData = await returnOriginResp.json()
        const returnOriginAirport = returnOriginData.data?.find((a: Airport) => a.iata_code === data.returnOrigin)

        const returnDestResp = await fetch(`/api/airports/search?q=${encodeURIComponent(data.returnDestination)}&limit=1`)
        const returnDestData = await returnDestResp.json()
        const returnDestAirport = returnDestData.data?.find((a: Airport) => a.iata_code === data.returnDestination)

        returnSegment = {
          departure: returnOriginAirport?.city || returnOriginAirport?.name || data.returnOrigin,
          arrival: returnDestAirport?.city || returnDestAirport?.name || data.returnDestination,
          departureCode: data.returnOrigin,
          arrivalCode: data.returnDestination,
          departureDateTime: data.returnDepartureDateTime,
          arrivalDateTime: data.returnArrivalDateTime,
          flightNumber: data.returnFlightNumber,
          marketingAirline: '',
          marketingAirlineCode: data.returnAirlineCode || '',
        }
      }

      const flightDetails = {
        origin: data.outboundOrigin,
        destination: data.outboundDestination,
        departureDate: data.outboundDepartureDateTime,
        returnDate: data.isRoundTrip ? data.returnDepartureDateTime : null,
        outboundSegments: [outboundSegment],
        returnSegments: returnSegment ? [returnSegment] : [],
        marketingAirline: outboundSegment.marketingAirline,
        marketingAirlineCode: outboundSegment.marketingAirlineCode,
      }

      const outboundAirlineCode = outboundSegment.marketingAirlineCode
      const inboundAirlineCode = returnSegment?.marketingAirlineCode || null

      let error
      if (flightId) {
        // If editing a specific segment, merge with existing flight details
        if (editingSegment) {
          const { data: existingFlight } = await supabase
            .from('bookings_flights')
            .select('flight_details')
            .eq('id', flightId)
            .eq('flight_type', 'customer')
            .single()

          if (existingFlight && existingFlight.flight_details) {
            const existingDetails = existingFlight.flight_details as any
            const updatedDetails = { ...existingDetails }

            if (editingSegment.type === 'outbound') {
              updatedDetails.outboundSegments = [...(existingDetails.outboundSegments || [])]
              updatedDetails.outboundSegments[editingSegment.index] = outboundSegment
              updatedDetails.origin = data.outboundOrigin
              updatedDetails.destination = data.outboundDestination
              updatedDetails.departureDate = data.outboundDepartureDateTime
            } else {
              updatedDetails.returnSegments = [...(existingDetails.returnSegments || [])]
              if (returnSegment) {
                updatedDetails.returnSegments[editingSegment.index] = returnSegment
              } else {
                updatedDetails.returnSegments[editingSegment.index] = outboundSegment
              }
              updatedDetails.returnDate = data.returnDepartureDateTime || null
            }

            const updateData: any = {
              flight_details: updatedDetails,
            }
            
            if (editingSegment.type === 'outbound') {
              updateData.outbound_airline_code = outboundAirlineCode
            } else if (returnSegment) {
              updateData.inbound_airline_code = inboundAirlineCode
            }

            const { error: updateError } = await supabase
              .from('bookings_flights')
              .update(updateData)
              .eq('id', flightId)
              .eq('flight_type', 'customer')

            error = updateError
          } else {
            error = { message: 'Could not load existing flight data' } as any
          }
        } else {
          // Update entire flight
          const { error: updateError } = await supabase
            .from('bookings_flights')
            .update({
              flight_details: flightDetails,
              outbound_airline_code: outboundAirlineCode,
              inbound_airline_code: inboundAirlineCode,
            })
            .eq('id', flightId)
            .eq('flight_type', 'customer')

          error = updateError
        }
      } else {
        // Insert new flight
        const { error: insertError } = await supabase
          .from('bookings_flights')
          .insert({
            booking_id: bookingId,
            flight_type: 'customer',
            flight_details: flightDetails,
            outbound_airline_code: outboundAirlineCode,
            inbound_airline_code: inboundAirlineCode,
            quantity: 1,
            cost: 0,
            unit_price: 0,
            total_price: 0,
          })

        error = insertError
      }

      if (error) throw error

      toast({
        title: flightId 
          ? (editingSegment ? 'Segment updated! ✅' : 'Flight updated! ✅')
          : 'Flight added! ✅',
        description: flightId
          ? (editingSegment ? 'The flight segment has been updated.' : 'Your flight information has been updated.')
          : 'Your flight information has been saved.',
      })

      onOpenChange(false)
      router.refresh()
      onSuccess?.()
      
      // Reset form
      form.reset()
    } catch (error: any) {
      console.error('Error adding flight:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add flight information',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getAirportDisplay = (code: string, fieldId: string) => {
    // First check if we have it stored as selected
    const storedAirport = selectedAirports[fieldId]
    if (storedAirport && storedAirport.iata_code === code) {
      return `${code} - ${storedAirport.name}${storedAirport.city ? `, ${storedAirport.city}` : ''}`
    }

    // Check current field results
    const fieldAirports = airports[fieldId] || []
    const airport = fieldAirports.find(a => a.iata_code === code)
    if (airport) {
      // Store it for future use
      setSelectedAirports(prev => ({ ...prev, [fieldId]: airport }))
      return `${code} - ${airport.name}${airport.city ? `, ${airport.city}` : ''}`
    }

    // If not found, check all other fields (for display purposes)
    const allAirports = Object.values(airports).flat()
    const foundAirport = allAirports.find(a => a.iata_code === code)
    if (foundAirport) {
      setSelectedAirports(prev => ({ ...prev, [fieldId]: foundAirport }))
      return `${code} - ${foundAirport.name}${foundAirport.city ? `, ${foundAirport.city}` : ''}`
    }

    // Fallback to just code if not found anywhere
    return code
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl! max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            {flightId
              ? (editingSegment ? `Edit ${editingSegment.type === 'outbound' ? 'Outbound' : 'Return'} Flight` : 'Edit Your Flight Information')
              : 'Add Your Flight Information'}
          </DialogTitle>
          <DialogDescription>
            {flightId 
              ? (editingSegment 
                  ? `Update the ${editingSegment.type === 'outbound' ? 'outbound' : 'return'} flight segment details.`
                  : 'Update your flight details for airport transfer arrangements.')
              : 'Enter your flight details for airport transfer arrangements. Only your origin and final destination airports are needed.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Round Trip Toggle - only show when not editing a specific segment */}
            {!editingSegment && (
              <FormField
                control={form.control}
                name="isRoundTrip"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        Round Trip
                      </FormLabel>
                      <FormDescription>
                        Check this if you're returning from the same destination
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* Outbound Flight - only show when editing outbound segment or not editing a specific segment */}
            {(!editingSegment || editingSegment.type === 'outbound') && (
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-base font-semibold">
                  {editingSegment && editingSegment.type === 'outbound' ? 'Edit Outbound Flight' : 'Outbound Flight'}
                </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Departure Airport */}
                <FormField
                  control={form.control}
                  name="outboundOrigin"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Departure Airport *</FormLabel>
                      <Popover 
                        open={airportSearchOpen['outbound-origin'] || false}
                        onOpenChange={(open) => setAirportSearchOpen(prev => ({ ...prev, 'outbound-origin': open }))}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? getAirportDisplay(field.value, 'outbound-origin') : "Select airport..."}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput 
                              placeholder="Search airport..." 
                              onValueChange={(value) => searchAirports('outbound-origin', value)}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {airportSearchQuery['outbound-origin'] ? 'No airport found.' : 'Type to search airports...'}
                              </CommandEmpty>
                              <CommandGroup>
                                {(airports['outbound-origin'] || []).map((airport) => (
                                  <CommandItem
                                    key={airport.id}
                                    value={`${airport.iata_code} ${airport.name} ${airport.city || ''}`}
                                    onSelect={() => {
                                      field.onChange(airport.iata_code)
                                      setSelectedAirports(prev => ({ ...prev, 'outbound-origin': airport }))
                                      setAirportSearchOpen(prev => ({ ...prev, 'outbound-origin': false }))
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{airport.iata_code} - {airport.name}</span>
                                      {airport.city && (
                                        <span className="text-xs text-muted-foreground">{airport.city}, {airport.country || ''}</span>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Arrival Airport */}
                <FormField
                  control={form.control}
                  name="outboundDestination"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Arrival Airport *</FormLabel>
                      <Popover 
                        open={airportSearchOpen['outbound-destination'] || false}
                        onOpenChange={(open) => setAirportSearchOpen(prev => ({ ...prev, 'outbound-destination': open }))}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? getAirportDisplay(field.value, 'outbound-destination') : "Select airport..."}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput 
                              placeholder="Search airport..." 
                              onValueChange={(value) => searchAirports('outbound-destination', value)}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {airportSearchQuery['outbound-destination'] ? 'No airport found.' : 'Type to search airports...'}
                              </CommandEmpty>
                              <CommandGroup>
                                {(airports['outbound-destination'] || []).map((airport) => (
                                  <CommandItem
                                    key={airport.id}
                                    value={`${airport.iata_code} ${airport.name} ${airport.city || ''}`}
                                    onSelect={() => {
                                      field.onChange(airport.iata_code)
                                      setSelectedAirports(prev => ({ ...prev, 'outbound-destination': airport }))
                                      setAirportSearchOpen(prev => ({ ...prev, 'outbound-destination': false }))
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{airport.iata_code} - {airport.name}</span>
                                      {airport.city && (
                                        <span className="text-xs text-muted-foreground">{airport.city}, {airport.country || ''}</span>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Departure Date/Time */}
                <FormField
                  control={form.control}
                  name="outboundDepartureDateTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Date & Time *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Arrival Date/Time */}
                <FormField
                  control={form.control}
                  name="outboundArrivalDateTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival Date & Time *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="outboundAirlineCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Airline Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., LH" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the airline code from your ticket (e.g., LH, BA, AF).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="outboundFlightNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flight Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 943" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter only the flight number (without airline code)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              </div>
            )}

            {/* Return Flight - only show when editing return segment or when round trip is enabled */}
            {(!editingSegment || editingSegment.type === 'return') && (
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-base font-semibold">
                  {editingSegment && editingSegment.type === 'return' ? 'Edit Return Flight' : 'Return Flight'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="returnOrigin"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Departure Airport *</FormLabel>
                        <Popover 
                          open={airportSearchOpen['return-origin'] || false}
                          onOpenChange={(open) => setAirportSearchOpen(prev => ({ ...prev, 'return-origin': open }))}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? getAirportDisplay(field.value, 'return-origin') : "Select airport..."}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput 
                                placeholder="Search airport..." 
                                onValueChange={(value) => searchAirports('return-origin', value)}
                              />
                            <CommandList>
                              <CommandEmpty>
                                {airportSearchQuery['return-origin'] ? 'No airport found.' : 'Type to search airports...'}
                              </CommandEmpty>
                              <CommandGroup>
                                {(airports['return-origin'] || []).map((airport) => (
                                  <CommandItem
                                    key={airport.id}
                                    value={`${airport.iata_code} ${airport.name} ${airport.city || ''}`}
                                      onSelect={() => {
                                        field.onChange(airport.iata_code)
                                        setSelectedAirports(prev => ({ ...prev, 'return-origin': airport }))
                                        setAirportSearchOpen(prev => ({ ...prev, 'return-origin': false }))
                                      }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{airport.iata_code} - {airport.name}</span>
                                      {airport.city && (
                                        <span className="text-xs text-muted-foreground">{airport.city}, {airport.country || ''}</span>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="returnDestination"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Arrival Airport *</FormLabel>
                        <Popover 
                          open={airportSearchOpen['return-destination'] || false}
                          onOpenChange={(open) => setAirportSearchOpen(prev => ({ ...prev, 'return-destination': open }))}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? getAirportDisplay(field.value, 'return-destination') : "Select airport..."}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput 
                                placeholder="Search airport..." 
                                onValueChange={(value) => searchAirports('return-destination', value)}
                              />
                              <CommandList>
                              <CommandEmpty>
                                {airportSearchQuery['return-destination'] ? 'No airport found.' : 'Type to search airports...'}
                              </CommandEmpty>
                              <CommandGroup>
                                {(airports['return-destination'] || []).map((airport) => (
                                    <CommandItem
                                      key={airport.id}
                                      value={`${airport.iata_code} ${airport.name} ${airport.city || ''}`}
                                      onSelect={() => {
                                        field.onChange(airport.iata_code)
                                        setSelectedAirports(prev => ({ ...prev, 'return-destination': airport }))
                                        setAirportSearchOpen(prev => ({ ...prev, 'return-destination': false }))
                                      }}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">{airport.iata_code} - {airport.name}</span>
                                        {airport.city && (
                                          <span className="text-xs text-muted-foreground">{airport.city}, {airport.country || ''}</span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="returnDepartureDateTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departure Date & Time *</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="returnArrivalDateTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arrival Date & Time *</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="returnAirlineCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Airline Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., LH" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the airline code from your ticket.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="returnFlightNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flight Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 943" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter only the flight number (without airline code)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Duplicate return flight section removed */}
            {false && (
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-base font-semibold">Return Flight</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="returnOrigin"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Departure Airport *</FormLabel>
                        <Popover 
                          open={airportSearchOpen['return-origin'] || false}
                          onOpenChange={(open) => setAirportSearchOpen(prev => ({ ...prev, 'return-origin': open }))}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? getAirportDisplay(field.value, 'return-origin') : "Select airport..."}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput 
                                placeholder="Search airport..." 
                                onValueChange={(value) => searchAirports('return-origin', value)}
                              />
                            <CommandList>
                              <CommandEmpty>
                                {airportSearchQuery['return-origin'] ? 'No airport found.' : 'Type to search airports...'}
                              </CommandEmpty>
                              <CommandGroup>
                                {(airports['return-origin'] || []).map((airport) => (
                                  <CommandItem
                                    key={airport.id}
                                    value={`${airport.iata_code} ${airport.name} ${airport.city || ''}`}
                                      onSelect={() => {
                                        field.onChange(airport.iata_code)
                                        setSelectedAirports(prev => ({ ...prev, 'return-origin': airport }))
                                        setAirportSearchOpen(prev => ({ ...prev, 'return-origin': false }))
                                      }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{airport.iata_code} - {airport.name}</span>
                                      {airport.city && (
                                        <span className="text-xs text-muted-foreground">{airport.city}, {airport.country || ''}</span>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="returnDestination"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Arrival Airport *</FormLabel>
                        <Popover 
                          open={airportSearchOpen['return-destination'] || false}
                          onOpenChange={(open) => setAirportSearchOpen(prev => ({ ...prev, 'return-destination': open }))}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? getAirportDisplay(field.value, 'return-destination') : "Select airport..."}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput 
                                placeholder="Search airport..." 
                                onValueChange={(value) => searchAirports('return-destination', value)}
                              />
                              <CommandList>
                              <CommandEmpty>
                                {airportSearchQuery['return-destination'] ? 'No airport found.' : 'Type to search airports...'}
                              </CommandEmpty>
                              <CommandGroup>
                                {(airports['return-destination'] || []).map((airport) => (
                                    <CommandItem
                                      key={airport.id}
                                      value={`${airport.iata_code} ${airport.name} ${airport.city || ''}`}
                                      onSelect={() => {
                                        field.onChange(airport.iata_code)
                                        setSelectedAirports(prev => ({ ...prev, 'return-destination': airport }))
                                        setAirportSearchOpen(prev => ({ ...prev, 'return-destination': false }))
                                      }}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">{airport.iata_code} - {airport.name}</span>
                                        {airport.city && (
                                          <span className="text-xs text-muted-foreground">{airport.city}, {airport.country || ''}</span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="returnDepartureDateTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departure Date & Time *</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="returnArrivalDateTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arrival Date & Time *</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="returnAirlineCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Airline Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., LH" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the airline code from your ticket.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="returnFlightNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flight Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 3126" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter only the flight number (without airline code)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {flightId ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <Plane className="mr-2 h-4 w-4" />
                    {flightId ? 'Update Flight' : 'Add Flight'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
