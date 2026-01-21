'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { toast as sonnerToast } from 'sonner'
import { useRouter, usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from '@/components/ui/sheet'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerDescription } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, Info, AlertCircle, FileText, Mail, Phone as PhoneIcon, MapPin } from 'lucide-react'
import { useMediaQuery } from '@/hooks/use-media-query'

// Phone number formatting utility
const formatPhoneNumber = (value: string): string => {
  if (!value) return ''
  
  // Remove all non-digit characters except + at the start
  const cleaned = value.replace(/[^\d+]/g, '')
  
  // If it starts with +, keep it
  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1).replace(/\D/g, '')
    return '+' + digits
  }
  
  // Otherwise, just return digits
  return cleaned.replace(/\D/g, '')
}

// Phone validation - allows international format (more flexible)
// Accepts: +44 20 1234 5678, 02012345678, +1-555-123-4567, etc.
const phoneRegex = /^\+?[\d\s\-()]{7,20}$/

const travelerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string()
    .max(50, 'Phone number is too long')
    .refine((val) => {
      if (!val || val.trim() === '') return true
      const cleaned = formatPhoneNumber(val)
      // Must have at least 7 digits (minimum for a valid phone number)
      return cleaned.length >= 7 && cleaned.length <= 20
    }, {
      message: 'Please enter a valid phone number with at least 7 digits (e.g., +44 20 1234 5678)'
    })
    .optional()
    .or(z.literal('')),
  date_of_birth: z.string()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Please enter a valid date'
    })
    .refine((val) => {
      if (!val) return true
      const date = new Date(val)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return date <= today
    }, {
      message: 'Date of birth cannot be in the future'
    })
    .optional()
    .or(z.literal('')),
  address_line1: z.string().max(200, 'Address is too long').optional().or(z.literal('')),
  address_line2: z.string().max(200, 'Address is too long').optional().or(z.literal('')),
  city: z.string().max(100, 'City is too long').optional().or(z.literal('')),
  state: z.string().max(100, 'State is too long').optional().or(z.literal('')),
  postal_code: z.string().max(20, 'Postal code is too long').optional().or(z.literal('')),
  country: z.string().max(100, 'Country is too long').optional().or(z.literal('')),
  dietary_restrictions: z.string().max(500, 'Dietary restrictions is too long').optional().or(z.literal('')),
  accessibility_needs: z.string().max(500, 'Accessibility needs is too long').optional().or(z.literal('')),
  special_requests: z.string().max(1000, 'Special requests is too long').optional().or(z.literal('')),
})

type TravelerFormData = z.infer<typeof travelerSchema>

interface Traveler {
  id: string
  traveler_type: 'lead' | 'guest'
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  date_of_birth?: string | null
  passport_number?: string | null
  nationality?: string | null
  dietary_restrictions?: string | null
  accessibility_needs?: string | null
  special_requests?: string | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
}

interface TravelerEditDrawerProps {
  traveler: Traveler | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (updatedTraveler?: Traveler) => void
  // When false, core contact fields (name/email/phone) are read-only
  canEditContactFields: boolean
}

export function TravelerEditDrawer({ traveler, open, onOpenChange, onSuccess, canEditContactFields }: TravelerEditDrawerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [drawerHeight, setDrawerHeight] = useState<string>('95vh')

  const form = useForm<TravelerFormData>({
    resolver: zodResolver(travelerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      dietary_restrictions: '',
      accessibility_needs: '',
      special_requests: '',
    },
  })

  // Reset form when traveler changes
  useEffect(() => {
    if (traveler && open) {
      form.reset({
        first_name: traveler.first_name || '',
        last_name: traveler.last_name || '',
        email: traveler.email || '',
        phone: traveler.phone || '',
        date_of_birth: traveler.date_of_birth ? traveler.date_of_birth.split('T')[0] : '',
        address_line1: traveler.address_line1 || '',
        address_line2: traveler.address_line2 || '',
        city: traveler.city || '',
        state: traveler.state || '',
        postal_code: traveler.postal_code || '',
        country: traveler.country || '',
        dietary_restrictions: traveler.dietary_restrictions || '',
        accessibility_needs: traveler.accessibility_needs || '',
        special_requests: traveler.special_requests || '',
      })
    }
  }, [traveler, open, form])

  // Handle mobile keyboard appearance to prevent drawer jumping
  useEffect(() => {
    if (isDesktop || !open) return

    const handleViewportChange = () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        const viewport = window.visualViewport
        // When keyboard is open, visualViewport.height is smaller than window.innerHeight
        const keyboardHeight = window.innerHeight - viewport.height
        if (keyboardHeight > 150) {
          // Keyboard is open, adjust drawer height to visual viewport
          // Use a slightly smaller value to ensure drawer doesn't overlap with keyboard
          setDrawerHeight(`${Math.min(viewport.height, window.innerHeight * 0.95)}px`)
        } else {
          // Keyboard is closed, use default height
          setDrawerHeight('95vh')
        }
      }
    }

    // Listen to viewport resize events (fires when keyboard opens/closes)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange)
      window.visualViewport.addEventListener('scroll', handleViewportChange)
      // Initial check
      handleViewportChange()
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange)
        window.visualViewport.removeEventListener('scroll', handleViewportChange)
      }
      // Reset height when drawer closes
      setDrawerHeight('95vh')
    }
  }, [open, isDesktop])

  const onSubmit = async (data: TravelerFormData) => {
    if (!traveler) {
      sonnerToast.error('No traveller selected', {
        description: 'Please select a traveller to edit.',
      })
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      // First, verify the traveler exists and is accessible
      const { data: existingTraveler, error: checkError } = await supabase
        .from('booking_travelers')
        .select('id, deleted_at')
        .eq('id', traveler.id)
        .single()

      if (checkError || !existingTraveler) {
        throw new Error('Traveller not found. Please refresh the page and try again.')
      }

      if (existingTraveler.deleted_at) {
        throw new Error('This traveller has been deleted and cannot be updated.')
      }

      // Format phone number before saving
      const formattedPhone = data.phone ? formatPhoneNumber(data.phone) : null

      // Convert empty strings to null for optional fields
      const updateData: any = {
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email?.trim() || null,
        phone: formattedPhone || null,
        date_of_birth: data.date_of_birth || null,
        address_line1: data.address_line1?.trim() || null,
        address_line2: data.address_line2?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        postal_code: data.postal_code?.trim() || null,
        country: data.country?.trim() || null,
        dietary_restrictions: data.dietary_restrictions?.trim() || null,
        accessibility_needs: data.accessibility_needs?.trim() || null,
        special_requests: data.special_requests?.trim() || null,
        updated_at: new Date().toISOString(),
      }

      const { data: updatedData, error } = await supabase
        .from('booking_travelers')
        .update(updateData)
        .eq('id', traveler.id)
        .is('deleted_at', null) // Ensure we're not updating deleted records
        .select()
        .single()

      if (error) {
        // Handle Supabase errors
        let errorMessage = 'Failed to update traveller information'
        
        // Log detailed error for debugging
        console.error('Traveler update error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          travelerId: traveler.id,
        })
        
        try {
          // Try to parse error message if it's JSON
          if (typeof error.message === 'string') {
            try {
              const parsedError = JSON.parse(error.message)
              errorMessage = parsedError.message || parsedError.error || error.message
            } catch {
              // Not JSON, use as-is
              errorMessage = error.message
            }
          } else {
            errorMessage = error.message || errorMessage
          }
        } catch (parseError) {
          // If parsing fails, use the error message directly
          errorMessage = error.message || errorMessage
        }

        // Check for specific error types
        if (error.code === '23505') {
          errorMessage = 'A traveller with this information already exists'
        } else if (error.code === '23503') {
          errorMessage = 'Invalid reference. Please refresh the page and try again.'
        } else if (error.code === 'PGRST116' || error.code === 'PGRST301') {
          // PGRST116 = No rows found, PGRST301 = Multiple rows found (shouldn't happen with single)
          errorMessage = 'Unable to update traveller. This may be due to permissions or the traveller may have been deleted. Please refresh the page and try again.'
        } else if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('row-level security')) {
          errorMessage = 'You do not have permission to update this traveller. Please contact support if this issue persists.'
        }

        throw new Error(errorMessage)
      }

      // Verify we got updated data back
      if (!updatedData) {
        throw new Error('Update completed but no data was returned. Please refresh the page to see your changes.')
      }

      // Success notifications
      sonnerToast.success('Traveller updated successfully', {
        description: `${data.first_name} ${data.last_name}'s information has been saved.`,
        duration: 3000,
      })

      toast({
        title: 'Traveller updated! ✅',
        description: `${data.first_name} ${data.last_name}'s information has been updated.`,
      })

      onOpenChange(false)
      // Pass updated traveler data to onSuccess callback for optimistic update
      onSuccess?.(updatedData as Traveler)
      
      // Force server-side refresh to bypass all caches
      setTimeout(() => {
        router.refresh()
      }, 100)
    } catch (error: any) {
      console.error('Error updating traveler:', error)
      
      // Extract error message safely
      let errorMessage = 'Failed to update traveller information'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object') {
        try {
          // Try to extract message from error object
          if ('message' in error) {
            errorMessage = String(error.message)
          } else if ('error' in error) {
            errorMessage = String(error.error)
          } else {
            // Try to stringify if it's a complex object
            const stringified = JSON.stringify(error)
            if (stringified !== '{}') {
              errorMessage = stringified
            }
          }
        } catch (jsonError) {
          // If JSON stringify fails, use default message
          errorMessage = 'An unexpected error occurred. Please try again.'
        }
      }

      // Show error notifications
      sonnerToast.error('Failed to update traveller', {
        description: errorMessage,
        duration: 5000,
      })

      toast({
        variant: 'destructive',
        title: 'Error updating traveller',
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const travelerName = traveler ? `${traveler.first_name} ${traveler.last_name}` : 'Traveller'
  const isLead = traveler?.traveler_type === 'lead'

  const FormFields = () => (
    <div className="space-y-4">
          {/* Important Notice for Lead Traveler */}
          {isLead && (
            <Alert className="border-blue-200 bg-blue-50">
              <FileText className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Lead Traveller Information:</strong> This information is used for sending final travel documents, and important trip communications. Please ensure all details are accurate and up to date.
              </AlertDescription>
            </Alert>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            {!canEditContactFields && (
              <Alert variant="destructive" className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  Because flights have already been booked for this trip, we can no longer change core contact details
                  (name, email, phone, and date of birth). Please contact support if any of these are incorrect.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-medium mb-1">Personal Information</p>
                    <p className="text-xs">
                      {isLead 
                        ? 'This information is used for final documents and trip communications. Ensure accuracy.'
                        : 'Keep this information up to date for trip coordination and emergency contacts.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-1.5">
                      <FormLabel>First Name *</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p className="text-xs">
                              {isLead 
                                ? 'Must match passport/ID. Used on all travel documents and confirmations.'
                                : 'Used for trip coordination and identification.'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Input {...field} placeholder="John" disabled={!canEditContactFields} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-1.5">
                      <FormLabel>Last Name *</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p className="text-xs">
                              {isLead 
                                ? 'Must match passport/ID. Used on all travel documents and confirmations.'
                                : 'Used for trip coordination and identification.'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Input {...field} placeholder="Doe" disabled={!canEditContactFields} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-1.5">
                      <FormLabel>Email</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Mail className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p className="text-xs">
                              {isLead 
                                ? 'We send final travel documents, confirmations, and important trip updates to this email address.'
                                : 'Used for trip communications and updates.'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Input type="email" {...field} placeholder="john.doe@example.com" disabled={!canEditContactFields} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-1.5">
                      <FormLabel>Phone</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <PhoneIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p className="text-xs">
                              {isLead 
                                ? 'Used for urgent trip communications and emergency contact. Include country code (e.g., +44).'
                                : 'Used for trip coordination and emergency contact.'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Input 
                        type="tel" 
                        {...field} 
                        placeholder="+44 20 1234 5678" 
                        disabled={!canEditContactFields}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value)
                          field.onChange(formatted)
                        }}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={!canEditContactFields} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Required for some airlines and travel documentation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Address</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <MapPin className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-xs">
                      {isLead 
                        ? 'Used for mailing final travel documents and important correspondence if needed.'
                        : 'Used for trip coordination and emergency contact purposes.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <FormField
              control={form.control}
              name="address_line1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="123 Main Street" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_line2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Apartment, suite, etc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="London" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Greater London" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="SW1A 1AA" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="United Kingdom" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Special Requirements */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Special Requirements</h3>

            
            <FormField
              control={form.control}
              name="dietary_restrictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dietary Restrictions</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="e.g., Vegetarian, Gluten-free, Allergies"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    We&apos;ll share this with hotels and restaurants to accommodate your dietary needs
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accessibility_needs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accessibility Needs</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="e.g., Wheelchair access, Mobility assistance"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Important for ensuring appropriate accommodations and transportation arrangements
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="special_requests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requests</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Any other special requests or notes"
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Any additional requests or information that would help us provide the best service
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
  )

  const FormContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Handle input focus to scroll into view within drawer on mobile
    useEffect(() => {
      if (!isMobile || !scrollContainerRef.current) return

      const scrollContainer = scrollContainerRef.current
      
      const handleFocus = (e: FocusEvent) => {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          // Small delay to let keyboard appear, then scroll input into view within drawer
          setTimeout(() => {
            if (scrollContainer && target.isConnected) {
              const containerRect = scrollContainer.getBoundingClientRect()
              const inputRect = target.getBoundingClientRect()
              
              // Check if input is outside visible area
              if (inputRect.bottom > containerRect.bottom || inputRect.top < containerRect.top) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
              }
            }
          }, 300)
        }
      }

      scrollContainer.addEventListener('focusin', handleFocus, true)
      
      return () => {
        scrollContainer.removeEventListener('focusin', handleFocus, true)
      }
    }, [isMobile])

    return (
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            // Handle form validation errors
            const errorFields = Object.keys(errors)
            if (errorFields.length > 0) {
              const firstError = Object.values(errors)[0]
              const errorMessage = firstError?.message || 'Please fix the errors in the form'
              
              sonnerToast.error('Validation error', {
                description: errorMessage,
                duration: 4000,
              })
            }
          })} 
          className="h-full flex flex-col min-h-0" 
          style={{ minHeight: 0 }}
        >
          <div 
            ref={scrollContainerRef}
            className={`flex-1 overflow-y-scroll overflow-x-hidden overscroll-contain ${isMobile ? 'pb-4' : ''}`} 
            style={{ 
              WebkitOverflowScrolling: 'touch',
              minHeight: 0,
              maxHeight: '100%',
              // Prevent the page from scrolling when keyboard opens
              position: 'relative'
            }}
          >
          <div className="space-y-6 pr-1">
            <FormFields />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 pb-2 border-t shrink-0 bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto sm:ml-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
    )
  }

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0 overflow-hidden">
          <div className="flex flex-col h-full overflow-hidden">
            <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <SheetTitle>
                Edit Traveller: {travelerName}
                {isLead && (
                  <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    Lead Traveller
                  </span>
                )}
              </SheetTitle>
              <SheetDescription>
                {isLead 
                  ? 'Update traveller information. Lead traveller details are used for final documents and trip communications. Changes will be saved immediately.'
                  : 'Update traveller information. Changes will be saved immediately.'}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 min-h-0 overflow-hidden px-6 pt-6 pb-4">
              <FormContent isMobile={false} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent 
        className="flex flex-col p-0"
        style={{ 
          height: drawerHeight,
          maxHeight: drawerHeight,
        }}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <DrawerHeader className="px-4 pt-4 pb-3 border-b shrink-0">
            <DrawerTitle>
              Edit Traveller: {travelerName}
              {isLead && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Lead Traveller
                </span>
              )}
            </DrawerTitle>
            <DrawerDescription>
              {isLead 
                ? 'Update traveller information. Lead traveller details are used for final documents and trip communications. Changes will be saved immediately.'
                : 'Update traveller information. Changes will be saved immediately.'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 min-h-0 px-4 pt-4 flex flex-col overflow-hidden">
            <FormContent isMobile={true} />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

