'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useRouter, usePathname } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Loader2, Plane } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { HelpCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const flightFormSchema = z.object({
  tripType: z.enum(['round-trip', 'arrival-only', 'return-only']),
  // Outbound (first departure and final arrival)
  outboundOrigin: z.string().optional(),
  outboundDestination: z.string().optional(),
  outboundDepartureDateTime: z.string().optional(),
  outboundArrivalDateTime: z.string().optional(),
  outboundFlightNumber: z.string().optional(),
  outboundAirlineId: z.string().optional(),
  outboundAirlineCode: z.string().optional(),
  // Return (first departure and final arrival)
  returnOrigin: z.string().optional(),
  returnDestination: z.string().optional(),
  returnDepartureDateTime: z.string().optional(),
  returnArrivalDateTime: z.string().optional(),
  returnFlightNumber: z.string().optional(),
  returnAirlineId: z.string().optional(),
  returnAirlineCode: z.string().optional(),
}).refine((data) => {
  // Arrival-only or round-trip requires outbound fields
  if (data.tripType === 'arrival-only' || data.tripType === 'round-trip') {
    return !!data.outboundOrigin && !!data.outboundDestination && 
           !!data.outboundDepartureDateTime && !!data.outboundArrivalDateTime &&
           !!data.outboundFlightNumber
  }
  return true
}, {
  message: 'Arrival flight information required',
  path: ['outboundOrigin'],
}).refine((data) => {
  // Return-only or round-trip requires return fields
  if (data.tripType === 'return-only' || data.tripType === 'round-trip') {
    return !!data.returnOrigin && !!data.returnDestination && 
           !!data.returnDepartureDateTime && !!data.returnArrivalDateTime &&
           !!data.returnFlightNumber
  }
  return true
}, {
  message: 'Return flight information required',
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

interface Airline {
  id: string
  name: string
  codes: Array<{
    iata_code: string | null
    icao_code: string | null
    is_primary: boolean
  }>
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
  const pathname = usePathname()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  // Separate state for each field to prevent cross-contamination
  const [airports, setAirports] = useState<Record<string, Airport[]>>({})
  const [airportSearchOpen, setAirportSearchOpen] = useState<Record<string, boolean>>({})
  const [airportSearchQuery, setAirportSearchQuery] = useState<Record<string, string>>({})
  // Store selected airports to ensure we can display them even if not in current search results
  const [selectedAirports, setSelectedAirports] = useState<Record<string, Airport>>({})
  
  // Airline state management
  const [airlines, setAirlines] = useState<Record<string, Airline[]>>({})
  const [airlineSearchOpen, setAirlineSearchOpen] = useState<Record<string, boolean>>({})
  const [airlineSearchQuery, setAirlineSearchQuery] = useState<Record<string, string>>({})
  const [selectedAirlines, setSelectedAirlines] = useState<Record<string, Airline>>({})

  const form = useForm<FlightFormData>({
    resolver: zodResolver(flightFormSchema),
    defaultValues: {
      tripType: 'round-trip',
      outboundOrigin: '',
      outboundDestination: '',
      outboundDepartureDateTime: '',
      outboundArrivalDateTime: '',
      outboundFlightNumber: '',
      outboundAirlineId: '',
      outboundAirlineCode: '',
      returnOrigin: '',
      returnDestination: '',
      returnDepartureDateTime: '',
      returnArrivalDateTime: '',
      returnFlightNumber: '',
      returnAirlineId: '',
      returnAirlineCode: '',
    },
  })

  const tripType = form.watch('tripType')

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
              tripType: 'arrival-only',
              outboundOrigin: segment.departureCode || '',
              outboundDestination: segment.arrivalCode || '',
              outboundDepartureDateTime: formatDateTimeForInput(segment.departureDateTime),
              outboundArrivalDateTime: formatDateTimeForInput(segment.arrivalDateTime),
              outboundFlightNumber: segment.flightNumber || '',
              outboundAirlineId: '',
              outboundAirlineCode: segment.marketingAirlineCode || '',
              returnOrigin: '',
              returnDestination: '',
              returnDepartureDateTime: '',
              returnArrivalDateTime: '',
              returnFlightNumber: '',
              returnAirlineId: '',
              returnAirlineCode: '',
            })
            
            // Try to find airline if we have airlineId or code
            if (segment.airlineId) {
              // Use airlineId directly
              form.setValue('outboundAirlineId', segment.airlineId)
              try {
                const { data: airlineData } = await supabase
                  .from('airlines')
                  .select('id, name, airline_codes (iata_code, icao_code, is_primary)')
                  .eq('id', segment.airlineId)
                  .single()
                
                if (airlineData) {
                  setSelectedAirlines(prev => ({ 
                    ...prev, 
                    'outbound-airline': {
                      id: airlineData.id,
                      name: airlineData.name,
                      codes: airlineData.airline_codes || []
                    }
                  }))
                }
              } catch (error) {
                console.error('Error fetching airline:', error)
              }
            } else if (segment.marketingAirlineCode) {
              // Fallback: search by code
              try {
                const airlineResp = await fetch(`/api/airlines/search?q=${encodeURIComponent(segment.marketingAirlineCode)}&limit=1`)
                if (airlineResp.ok) {
                  const airlineData = await airlineResp.json()
                  const matchingAirline = airlineData.data?.find((a: Airline) => 
                    a.codes.some(c => c.iata_code === segment.marketingAirlineCode || c.icao_code === segment.marketingAirlineCode)
                  )
                  if (matchingAirline) {
                    form.setValue('outboundAirlineId', matchingAirline.id)
                    setSelectedAirlines(prev => ({ ...prev, 'outbound-airline': matchingAirline }))
                  }
                }
              } catch (error) {
                console.error('Error fetching airline:', error)
              }
            }
          } else {
            form.reset({
              tripType: 'return-only',
              outboundOrigin: '',
              outboundDestination: '',
              outboundDepartureDateTime: '',
              outboundArrivalDateTime: '',
              outboundFlightNumber: '',
              outboundAirlineId: '',
              outboundAirlineCode: '',
              returnOrigin: segment.departureCode || '',
              returnDestination: segment.arrivalCode || '',
              returnDepartureDateTime: formatDateTimeForInput(segment.departureDateTime),
              returnArrivalDateTime: formatDateTimeForInput(segment.arrivalDateTime),
              returnFlightNumber: segment.flightNumber || '',
              returnAirlineId: '',
              returnAirlineCode: segment.marketingAirlineCode || '',
            })
            
            // Try to find airline if we have airlineId or code
            if (segment.airlineId) {
              // Use airlineId directly
              form.setValue('returnAirlineId', segment.airlineId)
              try {
                const { data: airlineData } = await supabase
                  .from('airlines')
                  .select('id, name, airline_codes (iata_code, icao_code, is_primary)')
                  .eq('id', segment.airlineId)
                  .single()
                
                if (airlineData) {
                  setSelectedAirlines(prev => ({ 
                    ...prev, 
                    'return-airline': {
                      id: airlineData.id,
                      name: airlineData.name,
                      codes: airlineData.airline_codes || []
                    }
                  }))
                }
              } catch (error) {
                console.error('Error fetching airline:', error)
              }
            } else if (segment.marketingAirlineCode) {
              // Fallback: search by code
              try {
                const airlineResp = await fetch(`/api/airlines/search?q=${encodeURIComponent(segment.marketingAirlineCode)}&limit=1`)
                if (airlineResp.ok) {
                  const airlineData = await airlineResp.json()
                  const matchingAirline = airlineData.data?.find((a: Airline) => 
                    a.codes.some(c => c.iata_code === segment.marketingAirlineCode || c.icao_code === segment.marketingAirlineCode)
                  )
                  if (matchingAirline) {
                    form.setValue('returnAirlineId', matchingAirline.id)
                    setSelectedAirlines(prev => ({ ...prev, 'return-airline': matchingAirline }))
                  }
                }
              } catch (error) {
                console.error('Error fetching airline:', error)
              }
            }
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

      // Determine trip type based on existing data
      const hasOutbound = !!(outboundSegment || details.origin || details.departureDate)
      const hasReturn = !!(returnSegment || details.returnDate)
      let determinedTripType: 'round-trip' | 'arrival-only' | 'return-only' = 'round-trip'
      if (hasOutbound && hasReturn) {
        determinedTripType = 'round-trip'
      } else if (hasOutbound && !hasReturn) {
        determinedTripType = 'arrival-only'
      } else if (!hasOutbound && hasReturn) {
        determinedTripType = 'return-only'
      }

      // Set form values
      form.reset({
        tripType: determinedTripType,
        outboundOrigin: details.origin || '',
        outboundDestination: details.destination || '',
        outboundDepartureDateTime: formatDateTimeForInput(outboundSegment?.departureDateTime || details.departureDate),
        outboundArrivalDateTime: formatDateTimeForInput(outboundSegment?.arrivalDateTime),
        outboundFlightNumber: outboundSegment?.flightNumber || '',
        outboundAirlineId: outboundSegment?.airlineId || '', // Use airlineId from segment if available
        outboundAirlineCode: outboundSegment?.marketingAirlineCode || flight.outbound_airline_code || '',
        returnOrigin: returnSegment?.departureCode || '',
        returnDestination: returnSegment?.arrivalCode || '',
        returnDepartureDateTime: formatDateTimeForInput(returnSegment?.departureDateTime || details.returnDate),
        returnArrivalDateTime: formatDateTimeForInput(returnSegment?.arrivalDateTime),
        returnFlightNumber: returnSegment?.flightNumber || '',
        returnAirlineId: returnSegment?.airlineId || '', // Use airlineId from segment if available
        returnAirlineCode: returnSegment?.marketingAirlineCode || flight.inbound_airline_code || '',
      })

      // Try to find and set airline IDs if we have airlineId or codes
      if (outboundSegment?.airlineId) {
        // Use airlineId directly
        try {
          const { data: airlineData } = await supabase
            .from('airlines')
            .select('id, name, logo_url, airline_codes (iata_code, icao_code, is_primary)')
            .eq('id', outboundSegment.airlineId)
            .single()
          
          if (airlineData) {
            setSelectedAirlines(prev => ({ 
              ...prev, 
              'outbound-airline': {
                id: airlineData.id,
                name: airlineData.name,
                codes: airlineData.airline_codes || []
              }
            }))
          }
        } catch (error) {
          console.error('Error fetching airline:', error)
        }
      } else if (outboundSegment?.marketingAirlineCode || flight.outbound_airline_code) {
        // Fallback: search by code
        const airlineCode = outboundSegment?.marketingAirlineCode || flight.outbound_airline_code
        try {
          const airlineResp = await fetch(`/api/airlines/search?q=${encodeURIComponent(airlineCode || '')}&limit=1`)
          if (airlineResp.ok) {
            const airlineData = await airlineResp.json()
            const matchingAirline = airlineData.data?.find((a: Airline) => 
              a.codes.some(c => c.iata_code === airlineCode || c.icao_code === airlineCode)
            )
            if (matchingAirline) {
              form.setValue('outboundAirlineId', matchingAirline.id)
              setSelectedAirlines(prev => ({ ...prev, 'outbound-airline': matchingAirline }))
            }
          }
        } catch (error) {
          console.error('Error fetching airline:', error)
        }
      }

      if (returnSegment?.airlineId) {
        // Use airlineId directly
        try {
          const { data: airlineData } = await supabase
            .from('airlines')
            .select('id, name, logo_url, airline_codes (iata_code, icao_code, is_primary)')
            .eq('id', returnSegment.airlineId)
            .single()
          
          if (airlineData) {
            setSelectedAirlines(prev => ({ 
              ...prev, 
              'return-airline': {
                id: airlineData.id,
                name: airlineData.name,
                codes: airlineData.airline_codes || []
              }
            }))
          }
        } catch (error) {
          console.error('Error fetching airline:', error)
        }
      } else if (returnSegment?.marketingAirlineCode || flight.inbound_airline_code) {
        // Fallback: search by code
        const airlineCode = returnSegment?.marketingAirlineCode || flight.inbound_airline_code
        try {
          const airlineResp = await fetch(`/api/airlines/search?q=${encodeURIComponent(airlineCode || '')}&limit=1`)
          if (airlineResp.ok) {
            const airlineData = await airlineResp.json()
            const matchingAirline = airlineData.data?.find((a: Airline) => 
              a.codes.some(c => c.iata_code === airlineCode || c.icao_code === airlineCode)
            )
            if (matchingAirline) {
              form.setValue('returnAirlineId', matchingAirline.id)
              setSelectedAirlines(prev => ({ ...prev, 'return-airline': matchingAirline }))
            }
          }
        } catch (error) {
          console.error('Error fetching airline:', error)
        }
      }

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

  // Reset fields when trip type changes
  useEffect(() => {
    if (tripType === 'arrival-only') {
      // Clear return fields
      form.setValue('returnOrigin', '')
      form.setValue('returnDestination', '')
      form.setValue('returnDepartureDateTime', '')
      form.setValue('returnArrivalDateTime', '')
      form.setValue('returnFlightNumber', '')
      form.setValue('returnAirlineId', '')
      form.setValue('returnAirlineCode', '')
      // Clear stored airports and airlines for return fields
      setSelectedAirports(prev => {
        const { 'return-origin': _, 'return-destination': __, ...rest } = prev
        return rest
      })
      setSelectedAirlines(prev => {
        const { 'return-airline': _, ...rest } = prev
        return rest
      })
    } else if (tripType === 'return-only') {
      // Clear outbound fields
      form.setValue('outboundOrigin', '')
      form.setValue('outboundDestination', '')
      form.setValue('outboundDepartureDateTime', '')
      form.setValue('outboundArrivalDateTime', '')
      form.setValue('outboundFlightNumber', '')
      form.setValue('outboundAirlineId', '')
      form.setValue('outboundAirlineCode', '')
      // Clear stored airports and airlines for outbound fields
      setSelectedAirports(prev => {
        const { 'outbound-origin': _, 'outbound-destination': __, ...rest } = prev
        return rest
      })
      setSelectedAirlines(prev => {
        const { 'outbound-airline': _, ...rest } = prev
        return rest
      })
    }
  }, [tripType, form])

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

  // Search airlines server-side - stores results per field
  const searchAirlines = async (fieldId: string, query: string) => {
    if (!query || query.length < 1) {
      setAirlines(prev => ({ ...prev, [fieldId]: [] }))
      return
    }

    try {
      const response = await fetch(`/api/airlines/search?q=${encodeURIComponent(query)}&limit=50`)
      if (!response.ok) throw new Error('Failed to search airlines')
      
      const result = await response.json()
      setAirlines(prev => ({ ...prev, [fieldId]: result.data || [] }))
      setAirlineSearchQuery(prev => ({ ...prev, [fieldId]: query }))
    } catch (error) {
      console.error('Error searching airlines:', error)
      setAirlines(prev => ({ ...prev, [fieldId]: [] }))
    }
  }

  // Get airline display name with code
  const getAirlineDisplay = (airlineId: string | undefined, fieldId: string) => {
    if (!airlineId) return 'Select airline...'
    
    // Check selected airlines first
    const selected = selectedAirlines[fieldId]
    if (selected && selected.id === airlineId) {
      const primaryCode = selected.codes.find(c => c.is_primary && c.iata_code) || selected.codes.find(c => c.iata_code)
      const code = primaryCode?.iata_code || primaryCode?.icao_code || ''
      return code ? `${selected.name}` : selected.name
    }

    // Check current search results
    const fieldAirlines = airlines[fieldId] || []
    const airline = fieldAirlines.find(a => a.id === airlineId)
    if (airline) {
      const primaryCode = airline.codes.find(c => c.is_primary && c.iata_code) || airline.codes.find(c => c.iata_code)
      const code = primaryCode?.iata_code || primaryCode?.icao_code || ''
      return code ? `${airline.name}` : airline.name
    }

    return 'Select airline...'
  }

  const onSubmit = async (data: FlightFormData) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Build outbound segment only for arrival-only or round-trip
      let outboundSegment = null
      if ((data.tripType === 'arrival-only' || data.tripType === 'round-trip') && data.outboundOrigin && data.outboundDestination) {
        // Fetch airport details from API
        const outboundOriginResp = await fetch(`/api/airports/search?q=${encodeURIComponent(data.outboundOrigin || '')}&limit=1`)
        const outboundOriginData = await outboundOriginResp.json()
        const outboundOriginAirport = outboundOriginData.data?.find((a: Airport) => a.iata_code === data.outboundOrigin)

        const outboundDestResp = await fetch(`/api/airports/search?q=${encodeURIComponent(data.outboundDestination || '')}&limit=1`)
        const outboundDestData = await outboundDestResp.json()
        const outboundDestAirport = outboundDestData.data?.find((a: Airport) => a.iata_code === data.outboundDestination)

        // Fetch airline details if airline_id is provided
        let outboundAirlineName = ''
        let outboundAirlineLogo = null
        if (data.outboundAirlineId) {
          // First check if we have it in selected airlines
          const selectedAirline = selectedAirlines['outbound-airline']
          if (selectedAirline && selectedAirline.id === data.outboundAirlineId) {
            outboundAirlineName = selectedAirline.name
          } else {
            // Fetch from database
            try {
              const supabase = createClient()
              const { data: airlineData } = await supabase
                .from('airlines')
                .select('id, name, logo_url')
                .eq('id', data.outboundAirlineId)
                .single()
              
              if (airlineData) {
                outboundAirlineName = airlineData.name
                outboundAirlineLogo = airlineData.logo_url
              }
            } catch (error) {
              console.error('Error fetching airline:', error)
            }
          }
        }

        outboundSegment = {
          departure: outboundOriginAirport?.city || outboundOriginAirport?.name || data.outboundOrigin,
          arrival: outboundDestAirport?.city || outboundDestAirport?.name || data.outboundDestination,
          departureCode: data.outboundOrigin,
          arrivalCode: data.outboundDestination,
          departureDateTime: data.outboundDepartureDateTime,
          arrivalDateTime: data.outboundArrivalDateTime,
          flightNumber: data.outboundFlightNumber,
          marketingAirline: outboundAirlineName,
          marketingAirlineCode: data.outboundAirlineCode || '',
          airlineId: data.outboundAirlineId || null,
          airlineLogo: outboundAirlineLogo || null,
        }
      }

      // Build return segment only for return-only or round-trip
      let returnSegment = null
      if ((data.tripType === 'return-only' || data.tripType === 'round-trip') && data.returnOrigin && data.returnDestination) {
        // Fetch return airport details
        const returnOriginResp = await fetch(`/api/airports/search?q=${encodeURIComponent(data.returnOrigin || '')}&limit=1`)
        const returnOriginData = await returnOriginResp.json()
        const returnOriginAirport = returnOriginData.data?.find((a: Airport) => a.iata_code === data.returnOrigin)

        const returnDestResp = await fetch(`/api/airports/search?q=${encodeURIComponent(data.returnDestination || '')}&limit=1`)
        const returnDestData = await returnDestResp.json()
        const returnDestAirport = returnDestData.data?.find((a: Airport) => a.iata_code === data.returnDestination)

        // Fetch airline details if airline_id is provided
        let returnAirlineName = ''
        let returnAirlineLogo = null
        if (data.returnAirlineId) {
          // First check if we have it in selected airlines
          const selectedAirline = selectedAirlines['return-airline']
          if (selectedAirline && selectedAirline.id === data.returnAirlineId) {
            returnAirlineName = selectedAirline.name
          } else {
            // Fetch from database
            try {
              const supabase = createClient()
              const { data: airlineData } = await supabase
                .from('airlines')
                .select('id, name, logo_url')
                .eq('id', data.returnAirlineId)
                .single()
              
              if (airlineData) {
                returnAirlineName = airlineData.name
                returnAirlineLogo = airlineData.logo_url
              }
            } catch (error) {
              console.error('Error fetching airline:', error)
            }
          }
        }

        returnSegment = {
          departure: returnOriginAirport?.city || returnOriginAirport?.name || data.returnOrigin,
          arrival: returnDestAirport?.city || returnDestAirport?.name || data.returnDestination,
          departureCode: data.returnOrigin,
          arrivalCode: data.returnDestination,
          departureDateTime: data.returnDepartureDateTime,
          arrivalDateTime: data.returnArrivalDateTime,
          flightNumber: data.returnFlightNumber,
          marketingAirline: returnAirlineName,
          marketingAirlineCode: data.returnAirlineCode || '',
          airlineId: data.returnAirlineId || null,
          airlineLogo: returnAirlineLogo || null,
        }
      }

      const flightDetails = {
        origin: data.outboundOrigin || data.returnOrigin || '',
        destination: data.outboundDestination || data.returnDestination || '',
        departureDate: data.outboundDepartureDateTime || data.returnDepartureDateTime || null,
        returnDate: (data.tripType === 'round-trip' || data.tripType === 'return-only') ? data.returnDepartureDateTime : null,
        outboundSegments: outboundSegment ? [outboundSegment] : [],
        returnSegments: returnSegment ? [returnSegment] : [],
        marketingAirline: outboundSegment?.marketingAirline || returnSegment?.marketingAirline || '',
        marketingAirlineCode: outboundSegment?.marketingAirlineCode || returnSegment?.marketingAirlineCode || '',
      }

      const outboundAirlineCode = outboundSegment?.marketingAirlineCode || null
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
              // Preserve airline info if not provided
              if (outboundSegment && !outboundSegment.marketingAirline && existingDetails.outboundSegments[editingSegment.index]) {
                outboundSegment.marketingAirline = existingDetails.outboundSegments[editingSegment.index].marketingAirline || ''
                outboundSegment.airlineId = existingDetails.outboundSegments[editingSegment.index].airlineId || null
                outboundSegment.airlineLogo = existingDetails.outboundSegments[editingSegment.index].airlineLogo || null
              }
              updatedDetails.outboundSegments[editingSegment.index] = outboundSegment
              updatedDetails.origin = data.outboundOrigin
              updatedDetails.destination = data.outboundDestination
              updatedDetails.departureDate = data.outboundDepartureDateTime
            } else {
              updatedDetails.returnSegments = [...(existingDetails.returnSegments || [])]
              const segmentToUse = returnSegment || outboundSegment
              if (segmentToUse) {
                // Preserve airline info if not provided
                if (!segmentToUse.marketingAirline && existingDetails.returnSegments[editingSegment.index]) {
                  segmentToUse.marketingAirline = existingDetails.returnSegments[editingSegment.index].marketingAirline || ''
                  segmentToUse.airlineId = existingDetails.returnSegments[editingSegment.index].airlineId || null
                  segmentToUse.airlineLogo = existingDetails.returnSegments[editingSegment.index].airlineLogo || null
                }
                updatedDetails.returnSegments[editingSegment.index] = segmentToUse
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
      // Enterprise-level: Force server-side refresh to bypass all caches
      setTimeout(() => {
        router.refresh()
      }, 100)
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">


            {/* Trip Type Selection - only show when not editing a specific segment */}
            {!editingSegment && (
              <FormField
                control={form.control}
                name="tripType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FormLabel>Trip Type</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p className="font-medium mb-1">Choose based on your airport transfers:</p>
                            <ul className="text-xs space-y-1 list-disc list-inside">
                              <li><strong>Round Trip:</strong> You need both arrival and return airport transfers</li>
                              <li><strong>Arrival Only:</strong> You only need an arrival airport transfer</li>
                              <li><strong>Return Only:</strong> You only need a return airport transfer</li>
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormDescription className="text-sm text-muted-foreground">
                      Select the option that matches the airport transfers you have booked or need for this trip.
                    </FormDescription>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col "
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="round-trip" id="round-trip"  />
                          <Label htmlFor="round-trip" className="cursor-pointer flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium">Round Trip</div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs">
                                    <p>Choose this if you need both arrival and return airport transfers for your trip.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="text-sm text-muted-foreground ">
                              Arrival and return flights
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="arrival-only" id="arrival-only"  />
                          <Label htmlFor="arrival-only" className="cursor-pointer flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium">Arrival Only</div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs">
                                    <p>Choose this if you only need an arrival airport transfer. You&apos;re making your own return travel arrangements.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="text-sm text-muted-foreground ">
                              Only your arrival flight
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="return-only" id="return-only"  />
                          <Label htmlFor="return-only" className="cursor-pointer flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium">Return Only</div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs">
                                    <p>Choose this if you only need a return airport transfer. You&apos;re making your own arrival travel arrangements.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Only your return flight
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Arrival/Outbound Flight - show for arrival-only, round-trip, or when editing outbound segment */}
            {((!editingSegment && (tripType === 'arrival-only' || tripType === 'round-trip')) || (editingSegment && editingSegment.type === 'outbound')) && (
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-base font-semibold">
                  {editingSegment && editingSegment.type === 'outbound' 
                    ? 'Edit Arrival Flight' 
                    : tripType === 'arrival-only' 
                    ? 'Arrival Flight' 
                    : 'Arrival Flight'}
                </h3>

                <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="outboundAirlineId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col ">
                      <FormLabel>Airline</FormLabel>
                      <Popover 
                        open={airlineSearchOpen['outbound-airline'] || false}
                        onOpenChange={(open) => setAirlineSearchOpen(prev => ({ ...prev, 'outbound-airline': open }))}
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
                              {field.value ? getAirlineDisplay(field.value, 'outbound-airline') : "Select airline..."}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput 
                              placeholder="Search airline..." 
                              onValueChange={(value) => searchAirlines('outbound-airline', value)}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {airlineSearchQuery['outbound-airline'] ? 'No airline found.' : 'Type to search airlines...'}
                              </CommandEmpty>
                              <CommandGroup>
                                {(airlines['outbound-airline'] || []).map((airline) => {
                                  const primaryCode = airline.codes.find(c => c.is_primary && c.iata_code) || airline.codes.find(c => c.iata_code)
                                  const code = primaryCode?.iata_code || primaryCode?.icao_code || ''
                                  return (
                                    <CommandItem
                                      key={airline.id}
                                      value={`${airline.name}`}
                                      onSelect={() => {
                                        field.onChange(airline.id)
                                        setSelectedAirlines(prev => ({ ...prev, 'outbound-airline': airline }))
                                        setAirlineSearchOpen(prev => ({ ...prev, 'outbound-airline': false }))
                                      }}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">{airline.name}</span>

                                      </div>
                                    </CommandItem>
                                  )
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Search and select your airline.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                        Airline code from your ticket (e.g. EZY, BA).
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


              </div>
            )}

            {/* Return Flight - show for return-only, round-trip, or when editing return segment */}
            {((!editingSegment && (tripType === 'return-only' || tripType === 'round-trip')) || (editingSegment && editingSegment.type === 'return')) && (
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-base font-semibold">
                  {editingSegment && editingSegment.type === 'return' ? 'Edit Return Flight' : 'Return Flight'}
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="returnAirlineId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Airline</FormLabel>
                        <Popover 
                          open={airlineSearchOpen['return-airline'] || false}
                          onOpenChange={(open) => setAirlineSearchOpen(prev => ({ ...prev, 'return-airline': open }))}
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
                                {field.value ? getAirlineDisplay(field.value, 'return-airline') : "Select airline..."}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput 
                                placeholder="Search airline..." 
                                onValueChange={(value) => searchAirlines('return-airline', value)}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  {airlineSearchQuery['return-airline'] ? 'No airline found.' : 'Type to search airlines...'}
                                </CommandEmpty>
                                <CommandGroup>
                                  {(airlines['return-airline'] || []).map((airline) => {
                                    const primaryCode = airline.codes.find(c => c.is_primary && c.iata_code) || airline.codes.find(c => c.iata_code)
                                    const code = primaryCode?.iata_code || primaryCode?.icao_code || ''
                                    return (
                                      <CommandItem
                                        key={airline.id}
                                        value={`${airline.name} ${code}`}
                                        onSelect={() => {
                                          field.onChange(airline.id)
                                          setSelectedAirlines(prev => ({ ...prev, 'return-airline': airline }))
                                          setAirlineSearchOpen(prev => ({ ...prev, 'return-airline': false }))
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-medium">{airline.name}</span>
                                          {code && (
                                            <span className="text-xs text-muted-foreground">Code: {code}</span>
                                          )}
                                        </div>
                                      </CommandItem>
                                    )
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Search and select your airline.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>
                <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="returnAirlineCode"
                    render={({ field }) => (
                      <FormItem className="flex flex-col c">
                        <FormLabel>Airline Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., LH" {...field} />
                        </FormControl>
                        <FormDescription>
                        Enter the airline code from your ticket (e.g. LH, BA, AF).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="returnFlightNumber"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
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

                                      {/* Warning message */}
                                      <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You are responsible for entering the correct flight information. Please double-check all details before submitting. You're able to change the flight information later.
              </AlertDescription>
            </Alert>

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
