'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface AddressData {
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
}

interface AddressAutocompleteProps {
  initialAddress?: AddressData | null
  onAddressChange?: (address: AddressData) => void
  errors?: Record<string, string>
}

export function AddressAutocomplete({ initialAddress, onAddressChange, errors }: AddressAutocompleteProps) {
  const [address, setAddress] = useState<AddressData>({
    address_line1: initialAddress?.address_line1 || '',
    address_line2: initialAddress?.address_line2 || '',
    city: initialAddress?.city || '',
    state: initialAddress?.state || '',
    postal_code: initialAddress?.postal_code || '',
    country: initialAddress?.country || '',
  })

  // Sync internal state when initialAddress changes (e.g., after server refresh)
  useEffect(() => {
    if (initialAddress) {
      setAddress({
        address_line1: initialAddress.address_line1 || '',
        address_line2: initialAddress.address_line2 || '',
        city: initialAddress.city || '',
        state: initialAddress.state || '',
        postal_code: initialAddress.postal_code || '',
        country: initialAddress.country || '',
      })
    }
  }, [initialAddress])

  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const autocompleteServiceRef = useRef<any>(null)
  const placesServiceRef = useRef<any>(null)

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
    
    if (!apiKey) {
      // No API key - manual entry only
      return
    }

    // Load Google Maps script
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      document.head.appendChild(script)

      script.onload = () => {
        if (window.google?.maps?.places) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
          placesServiceRef.current = new window.google.maps.places.PlacesService(
            document.createElement('div')
          )
        }
      }
    } else if (window.google?.maps?.places) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
      placesServiceRef.current = new window.google.maps.places.PlacesService(
        document.createElement('div')
      )
    }
  }, [])

  // Handle address input changes
  const handleInputChange = (field: keyof AddressData, value: string) => {
    const newAddress = { ...address, [field]: value }
    setAddress(newAddress)
    onAddressChange?.(newAddress)

    // Trigger autocomplete for address line 1
    if (field === 'address_line1' && value.length > 2 && autocompleteServiceRef.current && window.google?.maps?.places) {
      setIsLoading(true)
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: value,
          componentRestrictions: { country: ['gb', 'us', 'ca', 'au', 'nz'] }, // Common countries
        },
        (predictions: any[], status: string) => {
          setIsLoading(false)
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions)
            setShowSuggestions(true)
          } else {
            setSuggestions([])
            setShowSuggestions(false)
          }
        }
      )
    } else if (field !== 'address_line1') {
      setShowSuggestions(false)
    }
  }

  // Handle suggestion selection
  const handleSelectSuggestion = (placeId: string) => {
    if (!placesServiceRef.current || !window.google?.maps?.places) return

    setIsLoading(true)
    placesServiceRef.current.getDetails(
      { placeId },
      (place: any, status: string) => {
        setIsLoading(false)
        setShowSuggestions(false)

        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const addressComponents = place.address_components || []
          const newAddress: AddressData = {
            address_line1: '',
            address_line2: '',
            city: '',
            state: '',
            postal_code: '',
            country: '',
          }

          // Parse address components
          addressComponents.forEach((component: any) => {
            const types = component.types

            if (types.includes('street_number')) {
              newAddress.address_line1 = component.long_name + ' '
            } else if (types.includes('route')) {
              newAddress.address_line1 += component.long_name
            } else if (types.includes('subpremise')) {
              newAddress.address_line2 = component.long_name
            } else if (types.includes('locality') || types.includes('postal_town')) {
              newAddress.city = component.long_name
            } else if (types.includes('administrative_area_level_1')) {
              newAddress.state = component.short_name
            } else if (types.includes('postal_code')) {
              newAddress.postal_code = component.long_name
            } else if (types.includes('country')) {
              newAddress.country = component.short_name
            }
          })

          // Fallback to formatted address if components are missing
          if (!newAddress.address_line1.trim() && place.formatted_address) {
            newAddress.address_line1 = place.formatted_address.split(',')[0] || ''
          }

          setAddress(newAddress)
          onAddressChange?.(newAddress)
          inputRef.current?.blur()
        }
      }
    )
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address_line1">
          Address line 1 {hasApiKey && <span className="text-xs text-muted-foreground">(Start typing to search)</span>}
        </Label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            id="address_line1"
            type="text"
            value={address.address_line1}
            onChange={(e) => handleInputChange('address_line1', e.target.value)}
            placeholder="Street address"
            className={cn('pl-9', errors?.address_line1 && 'border-red-500')}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {errors?.address_line1 && (
          <p className="text-sm text-red-500">{errors.address_line1}</p>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="relative z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion.place_id)}
                className="w-full px-4 py-2 text-left hover:bg-muted transition-colors border-b last:border-b-0"
              >
                <p className="text-sm font-medium">{suggestion.structured_formatting.main_text}</p>
                <p className="text-xs text-muted-foreground">{suggestion.structured_formatting.secondary_text}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <FormField
        label="Address line 2"
        name="address_line2"
        value={address.address_line2}
        onChange={(e) => handleInputChange('address_line2', e.target.value)}
        placeholder="Apartment, suite, etc. (optional)"
        error={errors?.address_line2}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="City"
          name="city"
          value={address.city}
          onChange={(e) => handleInputChange('city', e.target.value)}
          error={errors?.city}
        />
        <FormField
          label="State / County"
          name="state"
          value={address.state}
          onChange={(e) => handleInputChange('state', e.target.value)}
          error={errors?.state}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Postal code"
          name="postal_code"
          value={address.postal_code}
          onChange={(e) => handleInputChange('postal_code', e.target.value)}
          error={errors?.postal_code}
        />
        <FormField
          label="Country"
          name="country"
          value={address.country}
          onChange={(e) => handleInputChange('country', e.target.value)}
          placeholder="e.g., GB, US, CA"
          error={errors?.country}
        />
      </div>
    </div>
  )
}

interface FormFieldProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  error?: string
}

function FormField({ label, name, value, onChange, placeholder, error }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          AutocompleteService: new () => any
          PlacesService: new (element: HTMLElement) => any
          PlacesServiceStatus: {
            OK: string
          }
        }
      }
    }
  }
}

