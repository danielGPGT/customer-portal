'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from '@/components/ui/sheet'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerDescription } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Loader2, Save } from 'lucide-react'
import { useMediaQuery } from '@/hooks/use-media-query'

const travelerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(50, 'Phone number is too long').optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
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
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

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

  const onSubmit = async (data: TravelerFormData) => {
    if (!traveler) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      // Convert empty strings to null for optional fields
      const updateData: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || null,
        phone: data.phone || null,
        date_of_birth: data.date_of_birth || null,
        address_line1: data.address_line1 || null,
        address_line2: data.address_line2 || null,
        city: data.city || null,
        state: data.state || null,
        postal_code: data.postal_code || null,
        country: data.country || null,
        dietary_restrictions: data.dietary_restrictions || null,
        accessibility_needs: data.accessibility_needs || null,
        special_requests: data.special_requests || null,
        updated_at: new Date().toISOString(),
      }

      const { data: updatedData, error } = await supabase
        .from('booking_travelers')
        .update(updateData)
        .eq('id', traveler.id)
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Traveller updated! ✅',
        description: `${data.first_name} ${data.last_name}'s information has been updated.`,
      })

      onOpenChange(false)
      // Pass updated traveler data to onSuccess callback for optimistic update
      onSuccess?.(updatedData as Traveler)
    } catch (error: any) {
      console.error('Error updating traveler:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update traveller information',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const travelerName = traveler ? `${traveler.first_name} ${traveler.last_name}` : 'Traveller'
  const isLead = traveler?.traveler_type === 'lead'

  const FormFields = () => (
    <div className="space-y-4">
          {/* Personal Information */}
          <div className="space-y-4">
            {!canEditContactFields && (
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Because flights have already been booked for this trip, we can no longer change core contact details
                (name, email, phone, and date of birth). Please contact support if any of these are incorrect.
              </p>
            )}
            <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
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
                    <FormLabel>Last Name *</FormLabel>
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
                    <FormLabel>Email</FormLabel>
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} placeholder="+44 20 1234 5678" disabled={!canEditContactFields} />
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Address</h3>
            
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
  )

  const FormContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col min-h-0" style={{ minHeight: 0 }}>
        <div 
          className={`flex-1 overflow-y-scroll overflow-x-hidden overscroll-contain ${isMobile ? 'pb-4' : ''}`} 
          style={{ 
            WebkitOverflowScrolling: 'touch',
            minHeight: 0,
            maxHeight: '100%'
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
                Update traveller information. Changes will be saved immediately.
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
      <DrawerContent className="max-h-[95vh]! h-[95vh]! flex flex-col p-0">
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
              Update traveller information. Changes will be saved immediately.
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

