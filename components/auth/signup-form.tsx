'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { signupSchema, type SignupInput } from '@/lib/utils/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { checkSignupRateLimit, cleanupAuthUser } from '@/app/(auth)/signup/actions'

interface SignupFormProps {
  initialReferralCode?: string
}

export function SignupForm({ initialReferralCode }: SignupFormProps = {}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showReferralCode, setShowReferralCode] = useState(!!initialReferralCode)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      referralCode: initialReferralCode,
    },
  })

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // STEP 0: Check rate limit before proceeding
      const rateLimitCheck = await checkSignupRateLimit()
      if (!rateLimitCheck.allowed) {
        toast({
          variant: 'destructive',
          title: 'Too many signup attempts',
          description: rateLimitCheck.error || 'Please try again later.',
        })
        setIsLoading(false)
        return
      }

      // STEP 1: Check if client already exists with this email
      const { data: existingClient, error: clientCheckError } = await supabase
        .from('clients')
        .select('id, user_id, email, first_name, loyalty_enrolled, points_balance, lifetime_points_earned, team_id')
        .eq('email', data.email)
        .maybeSingle()
      
      // Handle query errors (not just "not found")
      if (clientCheckError && clientCheckError.code !== 'PGRST116') {
        console.error('Error checking existing client:', clientCheckError)
        // Continue anyway - treat as "not found"
      }

      // STEP 2: Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
          },
        },
      })

      // Handle Supabase Auth errors
      if (authError) {
        // If user already exists in auth, the email is already registered
        // Note: user_id in clients table is the ADMIN who created the client, not the client's auth account
        // So we check if the email itself is already in auth.users
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          // Email already exists in auth.users - client already has their own account
          toast({
            variant: 'destructive',
            title: 'Account already exists',
            description: 'An account with this email already exists. Please log in instead.',
          })
          router.push('/login')
          return
        }
        throw authError
      }

      if (!authData.user) {
        throw new Error('Failed to create user')
      }

      // Track if we need to clean up auth user on error
      const authUserCreated = true
      let clientCreatedOrLinked = false
      const authUserId = authData.user.id // Store user ID for cleanup

      try {
      // STEP 3: Handle existing client record
      // Note: user_id in clients table is the ADMIN who created the client, NOT the client's own auth account
      // If client exists but auth signup succeeded, we need to UPDATE the client.user_id to point to
      // the client's NEW auth account (replacing the admin's user_id)
      // This is the correct behavior: the client's own auth account should be linked to their client record

      // STEP 3: If referral code provided, process it (handles client creation/update)
      if (data.referralCode) {
          // Normalize referral code (uppercase, trim)
          const normalizedReferralCode = data.referralCode.toUpperCase().trim()
          
        const { error: referralError } = await supabase.rpc('process_referral_signup', {
            p_referral_code: normalizedReferralCode,
          p_auth_user_id: authData.user.id,
          p_email: data.email,
          p_first_name: data.firstName,
          p_last_name: data.lastName,
          p_phone: data.phone || null,
          p_team_id: null, // Customer portal doesn't use teams
        })

        if (referralError) {
          console.error('Referral error:', referralError)
          // If referral fails but client exists, try to link without referral
          // Replace admin's user_id with client's own auth account
          if (existingClient) {
            const { error: updateError } = await supabase
              .from('clients')
              .update({
                user_id: authData.user.id, // Link to client's own auth account (replacing admin's user_id)
                team_id: existingClient.team_id || '0cef0867-1b40-4de1-9936-16b867a753d7', // Preserve existing team_id or use default
                loyalty_enrolled: true,
                loyalty_enrolled_at: new Date().toISOString(),
                loyalty_signup_source: 'self_signup',
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingClient.id)

            if (updateError) throw updateError

              clientCreatedOrLinked = true
            toast({
              title: 'Account linked',
              description: 'Your existing client record has been linked! Please check your email to verify. (Referral code was invalid)',
            })
          } else {
            throw referralError
          }
        } else {
            clientCreatedOrLinked = true
          toast({
            title: 'Success! 🎉',
            description: 'Account created with 100 bonus points! Check your email to verify.',
          })
        }
      } else {
        // STEP 4: Create or update client record without referral
        if (existingClient) {
          // Client exists - UPDATE to link client's own auth account
          // Note: The existing user_id is the ADMIN who created this client record
          // We're replacing it with the client's own auth account (authData.user.id)
          const updateData: any = {
            user_id: authData.user.id, // Link client record to client's own auth account (not admin's)
            team_id: existingClient.team_id || '0cef0867-1b40-4de1-9936-16b867a753d7', // Preserve existing team_id or use default (required by klaviyo trigger)
            loyalty_enrolled: true,
            loyalty_enrolled_at: new Date().toISOString(),
            loyalty_signup_source: 'self_signup',
            updated_at: new Date().toISOString(),
          }
          
          // Optionally update personal info if provided (but preserve existing data if not provided)
          if (data.firstName) updateData.first_name = data.firstName
          if (data.lastName) updateData.last_name = data.lastName
          if (data.phone) updateData.phone = data.phone

          const { error: updateError } = await supabase
            .from('clients')
            .update(updateData)
            .eq('id', existingClient.id)

          if (updateError) {
            // Handle foreign key or other constraint errors
            if (updateError.message.includes('foreign key') || updateError.message.includes('violates foreign key')) {
              console.error('Foreign key constraint violation:', updateError)
              // Clean up the auth account we just created
                await cleanupAuthUser(authUserId).catch(() => {})
              toast({
                variant: 'destructive',
                title: 'Error linking account',
                description: 'Unable to link account. Please contact support.',
              })
              return
            }
            throw updateError
          }

            clientCreatedOrLinked = true

          // Preserve existing points if client had any
          const preservedPoints = existingClient.points_balance > 0 
            ? ` Your existing ${existingClient.points_balance} points have been preserved.`
            : ''
          
          // Show message indicating we replaced admin's user_id with client's own account
          const hadAdminUserId = existingClient.user_id && existingClient.user_id !== authData.user.id

          toast({
            title: 'Account linked! 🎉',
            description: `Your existing client record has been linked to your portal account.${preservedPoints} Please check your email to verify.`,
          })
        } else {
          // New client - create record
          // Note: team_id is required by klaviyo_profile_queue trigger
          const { error: clientError } = await supabase.from('clients').insert({
            user_id: authData.user.id,
            team_id: '0cef0867-1b40-4de1-9936-16b867a753d7', // Default team ID for customer portal
            email: data.email,
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone || null,
            status: 'active',
            loyalty_enrolled: true,
            loyalty_enrolled_at: new Date().toISOString(),
            loyalty_signup_source: 'self_signup',
          })

          if (clientError) {
            // If insert fails due to unique constraint, try update instead
            if (clientError.message.includes('unique constraint') || clientError.message.includes('duplicate')) {
              const { data: checkClient } = await supabase
                .from('clients')
                .select('id')
                .eq('email', data.email)
                .single()

              if (checkClient) {
                const { error: updateError } = await supabase
                  .from('clients')
                  .update({
                    user_id: authData.user.id,
                    team_id: '0cef0867-1b40-4de1-9936-16b867a753d7', // Ensure team_id is set for trigger
                    loyalty_enrolled: true,
                    loyalty_enrolled_at: new Date().toISOString(),
                    loyalty_signup_source: 'self_signup',
                  })
                  .eq('id', checkClient.id)

                if (updateError) throw updateError

                  clientCreatedOrLinked = true
                toast({
                  title: 'Account linked! 🎉',
                  description: 'Your existing account has been linked. Please check your email to verify.',
                })
              } else {
                throw clientError
              }
            } else {
              throw clientError
            }
          } else {
              clientCreatedOrLinked = true
            toast({
              title: 'Success! 🎉',
              description: 'Account created! Check your email to verify.',
            })
          }
        }
      }

        // If we get here, everything succeeded
        if (clientCreatedOrLinked) {
      router.push('/login?verified=false')
        }
      } catch (stepError: any) {
        // If auth user was created but client wasn't, clean up the auth user
        if (authUserCreated && !clientCreatedOrLinked && authUserId) {
          console.error('Signup failed after auth user creation, cleaning up:', stepError)
          await cleanupAuthUser(authUserId).catch((cleanupError) => {
            console.error('Failed to cleanup auth user:', cleanupError)
            // Log but don't throw - we still want to show the original error
          })
        }
        // Re-throw to be caught by outer catch block
        throw stepError
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create account',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="John"
            {...register('firstName')}
            disabled={isLoading}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            {...register('lastName')}
            disabled={isLoading}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+44 7XXX XXXXXX"
          {...register('phone')}
          disabled={isLoading}
        />
        {errors.phone && (
          <p className="text-sm text-red-500">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Min 8 characters, 1 number, 1 special character
        </p>
      </div>

      {!showReferralCode && (
        <Button
          type="button"
          variant="link"
          onClick={() => setShowReferralCode(true)}
          className="p-0 h-auto"
        >
          Have a referral code?
        </Button>
      )}

      {showReferralCode && (
        <div className="space-y-2">
          <Label htmlFor="referralCode">Referral Code (optional)</Label>
          <Input
            id="referralCode"
            placeholder="ABC12345"
            {...register('referralCode')}
            disabled={isLoading}
          />
          {errors.referralCode && (
            <p className="text-sm text-red-500">{errors.referralCode.message}</p>
          )}
          <p className="text-xs text-green-600">
            🎉 Get 100 bonus points with a valid referral code!
          </p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Account
      </Button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  )
}

