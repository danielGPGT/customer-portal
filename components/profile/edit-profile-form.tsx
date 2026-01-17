'use client'

import { useState, useRef, useEffect } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { Loader2, Mail, Phone, CalendarRange, Upload, X, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
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
  const { user, isLoaded } = useUser()
  const { toast } = useToast()
  const [state, formAction] = useActionState<ProfileFormState, FormData>(
    updateProfileAction,
    INITIAL_FORM_STATE
  )

  // Use sessionStorage to persist saved values across remounts (survives component remounts)
  const STORAGE_KEY = 'edit-profile-saved-data'
  
  // Helper to get saved data from sessionStorage
  const getSavedData = () => {
    if (typeof window === 'undefined') return null
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Check if saved data is recent (within last 2 minutes)
        if (Date.now() - parsed.timestamp < 120000) {
          return parsed.data
        } else {
          sessionStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (e) {
      // Error reading sessionStorage - silently fail
    }
    return null
  }

  // Helper to save data to sessionStorage
  const saveToStorage = (formData: any, address: any) => {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: { formData, address }
      }))
    } catch (e) {
      // Error saving to sessionStorage - silently fail
    }
  }

  // Form field states - initialize from sessionStorage if available, otherwise use initialValues
  const savedData = getSavedData()
  
  const [formData, setFormData] = useState(() => {
    if (savedData?.formData) {
      return savedData.formData
    }
    return {
      firstName: initialValues.firstName,
      lastName: initialValues.lastName,
      phone: initialValues.phone || '',
      dateOfBirth: initialValues.dateOfBirth || '',
    }
  })

  const [address, setAddress] = useState(() => {
    if (savedData?.address) {
      return savedData.address
    }
    return initialValues.address || {
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
    }
  })

  // Track if we've initialized from sessionStorage to prevent overwriting on initialValues change
  const initializedFromStorageRef = useRef(!!savedData)
  
  if (savedData && !initializedFromStorageRef.current) {
    initializedFromStorageRef.current = true
  }

  // Sync with initialValues if no saved data exists
  useEffect(() => {
    const hasSavedData = !!getSavedData()
    const wasInitializedFromStorage = initializedFromStorageRef.current

    // Don't sync with initialValues if we have saved data or initialized from storage
    // This prevents stale cache from overwriting saved values after remount
    if (hasSavedData || wasInitializedFromStorage) {
      // Reset the flag after first check so future non-save-related changes can sync normally
      if (wasInitializedFromStorage) {
        initializedFromStorageRef.current = false
      }
      return
    }

    // Sync with initialValues if we don't have saved data
    setFormData({
      firstName: initialValues.firstName,
      lastName: initialValues.lastName,
      phone: initialValues.phone || '',
      dateOfBirth: initialValues.dateOfBirth || '',
    })
    if (initialValues.address) {
      setAddress(initialValues.address)
    }
  }, [initialValues])

  // Save to sessionStorage on successful save
  useEffect(() => {
    if (state.status === 'success') {
      saveToStorage({ ...formData }, { ...address })
      
      // Clear saved data after cache expires
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(STORAGE_KEY)
        }
      }, 65000) // 65 seconds (slightly longer than 60s cache)

      return () => clearTimeout(timer)
    }
  }, [state.status, formData, address])

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get user initials for fallback
  const userInitials =
    initialValues.firstName && initialValues.lastName
      ? `${initialValues.firstName[0] || ''}${initialValues.lastName[0] || ''}`.toUpperCase()
      : initialValues.email?.[0]?.toUpperCase() || 'U'

  // Current avatar URL from Clerk
  const currentAvatarUrl = user?.imageUrl || null

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please select an image file (JPEG, PNG, etc.)',
      })
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
      })
      return
    }

    setAvatarFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile || !user || !isLoaded) return

    setIsUploadingAvatar(true)

    try {
      await user.setProfileImage({ file: avatarFile })

      toast({
        title: 'Avatar updated! ✅',
        description: 'Your profile picture has been successfully updated.',
      })

      // Clear file and preview after successful upload
      setAvatarFile(null)
      setAvatarPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Refresh user data to show new avatar
      await user.reload()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload avatar. Please try again.',
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="client_id" defaultValue={initialValues.clientId} />
      
      {/* Hidden inputs for address fields - kept for compatibility */}
      <input type="hidden" name="address_line1" value={address.address_line1 || ''} />
      <input type="hidden" name="address_line2" value={address.address_line2 || ''} />
      <input type="hidden" name="city" value={address.city || ''} />
      <input type="hidden" name="state" value={address.state || ''} />
      <input type="hidden" name="postal_code" value={address.postal_code || ''} />
      <input type="hidden" name="country" value={address.country || ''} />

      {state.status !== 'idle' && state.message && (
        <Alert variant={state.status === 'success' ? 'default' : 'destructive'}>
          <AlertTitle>{state.status === 'success' ? 'All set!' : 'Something went wrong'}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {/* Avatar Upload Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Profile picture</Label>
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              {avatarPreview ? (
                <AvatarImage src={avatarPreview} alt="Preview" />
              ) : currentAvatarUrl ? (
                <AvatarImage src={currentAvatarUrl} alt={initialValues.firstName || 'User'} />
              ) : null}
              <AvatarFallback className="text-xl font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                  id="avatar-upload"
                  disabled={isUploadingAvatar || !isLoaded}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar || !isLoaded}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {avatarFile ? 'Change photo' : 'Upload photo'}
                </Button>
                {avatarFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={isUploadingAvatar}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </div>
              {avatarFile && (
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Save photo'
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF. Max size 5MB. Recommended: square image at least 400x400 pixels.
              </p>
            </div>
          </div>
        </div>
        <Separator />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="First name"
          name="first_name"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          error={state.errors?.firstName}
        />
        <FormField
          label="Last name"
          name="last_name"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          error={state.errors?.phone}
          icon={<Phone className="h-4 w-4 text-muted-foreground" />}
          placeholder="+44 7XXX XXXXXX"
        />
        <FormField
          label="Date of birth"
          name="date_of_birth"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
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
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  defaultValue?: string
  error?: string
  helper?: string
  placeholder?: string
  type?: React.HTMLInputTypeAttribute
  icon?: React.ReactNode
}

function FormField({ label, name, value, onChange, defaultValue, error, helper, placeholder, type = 'text', icon }: FormFieldProps) {
  // Use controlled input if value/onChange provided, otherwise use defaultValue (uncontrolled)
  const inputProps = value !== undefined && onChange
    ? { value, onChange }
    : { defaultValue }

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}
        <Input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          className={icon ? 'pl-9' : ''}
          {...inputProps}
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

