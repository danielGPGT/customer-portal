'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { Loader2, Mail, Phone, CalendarRange } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { updateProfileAction, type ProfileFormState } from '@/app/(protected)/profile/actions'
import { AddressAutocomplete } from '@/components/profile/address-autocomplete'

const INITIAL_FORM_STATE: ProfileFormState = {
  status: 'idle',
  errors: {},
}

interface EditProfileFormProps {
  initialValues: {
    clientId: string
    firstName: string
    lastName: string
    email: string
    phone?: string | null
    dateOfBirth?: string | null
    address?: {
      address_line1?: string
      address_line2?: string
      city?: string
      state?: string
      postal_code?: string
      country?: string
    } | null
  }
}

export function EditProfileForm({ initialValues }: EditProfileFormProps) {
  const [state, formAction] = useActionState<ProfileFormState, FormData>(
    updateProfileAction,
    INITIAL_FORM_STATE
  )

  const [address, setAddress] = useState(initialValues.address || {
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  })

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="client_id" defaultValue={initialValues.clientId} />
      
      {/* Hidden inputs for address fields */}
      <input type="hidden" name="address_line1" value={address.address_line1} />
      <input type="hidden" name="address_line2" value={address.address_line2} />
      <input type="hidden" name="city" value={address.city} />
      <input type="hidden" name="state" value={address.state} />
      <input type="hidden" name="postal_code" value={address.postal_code} />
      <input type="hidden" name="country" value={address.country} />

      {state.status !== 'idle' && state.message && (
        <Alert variant={state.status === 'success' ? 'default' : 'destructive'}>
          <AlertTitle>{state.status === 'success' ? 'All set!' : 'Something went wrong'}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="First name"
          name="first_name"
          defaultValue={initialValues.firstName}
          error={state.errors?.firstName}
        />
        <FormField
          label="Last name"
          name="last_name"
          defaultValue={initialValues.lastName}
          error={state.errors?.lastName}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            defaultValue={initialValues.email}
            disabled
            className="pl-9 bg-muted/50 cursor-not-allowed"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Your email address cannot be changed. Contact support if you need to update it.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Phone number"
          name="phone"
          defaultValue={initialValues.phone ?? ''}
          error={state.errors?.phone}
          icon={<Phone className="h-4 w-4 text-muted-foreground" />}
          placeholder="+44 7XXX XXXXXX"
        />
        <FormField
          label="Date of birth"
          name="date_of_birth"
          defaultValue={initialValues.dateOfBirth ?? ''}
          error={state.errors?.dateOfBirth}
          icon={<CalendarRange className="h-4 w-4 text-muted-foreground" />}
          type="date"
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Address</h3>
        <p className="text-sm text-muted-foreground">Your address helps us with booking confirmations and documentation.</p>
      </div>

      <AddressAutocomplete
        initialAddress={initialValues.address}
        onAddressChange={setAddress}
        errors={state.errors}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button asChild variant="ghost" type="button" className="order-2 sm:order-1">
          <Link href="/profile">Cancel</Link>
        </Button>
        <SubmitButton />
      </div>
    </form>
  )
}

interface FormFieldProps {
  label: string
  name: string
  defaultValue?: string
  error?: string
  helper?: string
  placeholder?: string
  type?: React.HTMLInputTypeAttribute
  icon?: React.ReactNode
}

function FormField({ label, name, defaultValue, error, helper, placeholder, type = 'text', icon }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}
        <Input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={icon ? 'pl-9' : ''}
        />
      </div>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="order-1 sm:order-2" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save changes
    </Button>
  )
}

