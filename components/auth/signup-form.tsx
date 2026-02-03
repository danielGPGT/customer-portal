'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSignUp } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import { signupSchema, type SignupInput } from '@/lib/utils/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { checkSignupRateLimit } from '@/app/(auth)/signup/actions'
import { getSignupErrorMessage } from '@/lib/utils/signup-errors'
import { SocialLoginButtons } from './social-login-buttons'

interface SignupFormProps {
  initialReferralCode?: string
}

export function SignupForm({ initialReferralCode }: SignupFormProps = {}) {
  const router = useRouter()
  const { toast } = useToast()
  const { signUp, setActive, isLoaded } = useSignUp()
  const [isLoading, setIsLoading] = useState(false)
  const [showReferralCode, setShowReferralCode] = useState(!!initialReferralCode)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [formData, setFormData] = useState<SignupInput | null>(null)

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
    if (!isLoaded || !signUp) {
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      // STEP 0: Check rate limit before proceeding (optional - Clerk has built-in rate limiting)
      try {
        const rateLimitCheck = await checkSignupRateLimit()
        if (!rateLimitCheck.allowed) {
          setIsLoading(false)
          toast({
            variant: 'soft',
            title: 'Too many signup attempts',
            description: rateLimitCheck.error || 'Please wait a few minutes and try again.',
          })
          return
        }
      } catch (rateLimitError: any) {
        // If rate limit check fails, log but continue (fail open)
        console.warn('[SignupForm] Rate limit check failed:', rateLimitError)
      }

      // STEP 1: Check if client already exists with this email
      const { data: existingClient, error: clientCheckError } = await supabase
        .from('clients')
        .select('id, clerk_user_id, email, first_name, loyalty_enrolled, points_balance, lifetime_points_earned, team_id')
        .eq('email', data.email)
        .maybeSingle()
      
      // Handle query errors (not just "not found")
      if (clientCheckError && clientCheckError.code !== 'PGRST116') {
        console.error('Error checking existing client:', clientCheckError)
        // Continue anyway - treat as "not found"
      }

      // Check if client already has Clerk account linked
      if (existingClient && existingClient.clerk_user_id) {
        setIsLoading(false)
        toast({
          variant: 'soft',
          title: 'Account already exists',
          description: 'This email is already registered. Please log in instead.',
        })
        router.push('/login?error=account_exists')
        return
      }

      // STEP 2: Sign up with Clerk
      const result = await signUp.create({
        emailAddress: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      })

      // Handle Clerk signup status
      if (result.status === 'missing_requirements') {
        // Email verification required - send verification code
        try {
          await signUp.prepareEmailAddressVerification({
            strategy: 'email_code',
          })
          
          // Store form data for after verification
          setFormData(data)
          setPendingVerification(true)
          
          toast({
            title: 'Verification code sent',
            description: 'Please check your email for the verification code.',
          })
        } catch (verifyError: any) {
          console.error('Error preparing email verification:', verifyError)
          const errDisplay = getSignupErrorMessage(verifyError, 'signup')
          toast({
            variant: 'soft',
            title: errDisplay.title,
            description: errDisplay.description,
          })
        }
        setIsLoading(false)
        return
      }

      if (result.status === 'complete') {
        const clerkUserId = result.createdUserId
        if (!clerkUserId) {
          toast({
            variant: 'soft',
            title: 'Something went wrong',
            description: 'We couldn’t get your account details. Please try again or contact support.',
          })
          return
        }

        let setActiveFailed = false
        try {
          await setActive({ session: result.createdSessionId })
        } catch (setActiveErr: any) {
          console.error('[SignupForm] setActive failed:', setActiveErr)
          setActiveFailed = true
          // Continue to create/link client so account exists; we’ll ask user to log in
        }

        let clientCreatedOrLinked = false

        try {
        // STEP 3: Handle existing client record and referral codes
        // If referral code provided, process it (handles client creation/update)
        if (data.referralCode) {
          // Normalize referral code (uppercase, trim)
          const normalizedReferralCode = data.referralCode.toUpperCase().trim()
          
          // Note: process_referral_signup may need updating to support clerk_user_id
          // For now, we'll handle it manually after checking if the function supports it
          // Check if referral function exists and supports clerk_user_id, otherwise handle manually
          
          // Call referral function with Clerk user ID
          const { error: referralError } = await supabase.rpc('process_referral_signup', {
            p_referral_code: normalizedReferralCode,
            p_clerk_user_id: clerkUserId, // Use Clerk user ID
            p_email: data.email,
            p_first_name: data.firstName,
            p_last_name: data.lastName,
            p_phone: null,
            p_team_id: null, // Customer portal doesn't use teams
          })

          if (referralError) {
            console.error('Referral error:', referralError)
            // If referral fails but client exists, try to link without referral
            // Link client to Clerk user
            if (existingClient) {
              const { error: updateError } = await supabase
                .from('clients')
                .update({
                  clerk_user_id: clerkUserId, // Use Clerk user ID
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
                description: 'Your existing client record has been linked! (Referral code was invalid)',
              })
              } else {
                // If referral fails and no existing client, create without referral bonus
                const { error: createError } = await supabase.from('clients').insert({
                  clerk_user_id: clerkUserId,
                  user_id: null, // Clerk users don't have a Supabase Auth user_id
                  team_id: '0cef0867-1b40-4de1-9936-16b867a753d7',
                  email: data.email,
                  first_name: data.firstName,
                  last_name: data.lastName,
                  phone: null,
                  status: 'active',
                  loyalty_enrolled: true,
                  loyalty_enrolled_at: new Date().toISOString(),
                  loyalty_signup_source: 'self_signup',
                })

              if (createError) throw createError
              clientCreatedOrLinked = true
              toast({
                title: 'Account created! 🎉',
                description: 'Your account has been created. (Referral code was invalid)',
              })
            }
          } else {
            // Referral succeeded
            // Update client record to ensure clerk_user_id is set (if function doesn't set it)
            if (existingClient) {
              await supabase
                .from('clients')
                .update({ clerk_user_id: clerkUserId })
                .eq('id', existingClient.id)
            }
            
            clientCreatedOrLinked = true
            toast({
              title: 'Success! 🎉',
              description: 'Account created with 100 bonus points!',
            })
          }
        } else {
          // STEP 4: Create or update client record without referral
          if (existingClient) {
            // Client exists - UPDATE to link client to Clerk user
            const updateData: any = {
              clerk_user_id: clerkUserId, // Use Clerk user ID
              team_id: existingClient.team_id || '0cef0867-1b40-4de1-9936-16b867a753d7', // Preserve existing team_id or use default
              loyalty_enrolled: true,
              loyalty_enrolled_at: new Date().toISOString(),
              loyalty_signup_source: 'self_signup',
              updated_at: new Date().toISOString(),
            }
            
            // Optionally update personal info if provided (but preserve existing data if not provided)
            if (data.firstName) updateData.first_name = data.firstName
            if (data.lastName) updateData.last_name = data.lastName

            const { error: updateError } = await supabase
              .from('clients')
              .update(updateData)
              .eq('id', existingClient.id)

            if (updateError) {
              const errDisplay = getSignupErrorMessage(updateError)
              toast({
                variant: 'soft',
                title: errDisplay.title,
                description: errDisplay.description,
              })
              if (setActiveFailed) router.push('/login')
              return
            }

            clientCreatedOrLinked = true

            // Preserve existing points if client had any
            const preservedPoints = existingClient.points_balance > 0 
              ? ` Your existing ${existingClient.points_balance} points have been preserved.`
              : ''

            toast({
              title: 'Account linked! 🎉',
              description: `Your existing client record has been linked to your portal account.${preservedPoints}`,
            })
          } else {
            // New client - create record
            const { error: clientError } = await supabase.from('clients').insert({
              clerk_user_id: clerkUserId, // Use Clerk user ID
              user_id: null, // Clerk users don't have a Supabase Auth user_id
              team_id: '0cef0867-1b40-4de1-9936-16b867a753d7', // Default team ID for customer portal
              email: data.email,
              first_name: data.firstName,
              last_name: data.lastName,
              phone: null,
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
                      clerk_user_id: clerkUserId,
                      team_id: '0cef0867-1b40-4de1-9936-16b867a753d7',
                      loyalty_enrolled: true,
                      loyalty_enrolled_at: new Date().toISOString(),
                      loyalty_signup_source: 'self_signup',
                    })
                    .eq('id', checkClient.id)

                  if (updateError) throw updateError

                  clientCreatedOrLinked = true
                  toast({
                    title: 'Account linked! 🎉',
                    description: 'Your existing account has been linked.',
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
                description: 'Account created!',
              })
            }
          }
        }

          if (clientCreatedOrLinked) {
            if (setActiveFailed) {
              setIsLoading(false)
              toast({
                title: 'Account created',
                description: 'Please log in with your email and password.',
              })
              router.push('/login')
            } else {
              window.location.href = '/'
            }
          }
        } catch (stepError: any) {
          const errDisplay = getSignupErrorMessage(stepError)
          toast({
            variant: 'soft',
            title: errDisplay.title,
            description: setActiveFailed
              ? errDisplay.description
              : `${errDisplay.description} Your account was created — please log in and contact support if you need help.`,
          })
          router.push(setActiveFailed ? '/login' : '/login?error=profile_save_failed')
        }
      } else {
        toast({
          variant: 'soft',
          title: 'Additional verification required',
          description: 'Please check your email for verification instructions.',
        })
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      const errDisplay = getSignupErrorMessage(error)
      toast({
        variant: 'soft',
        title: errDisplay.title,
        description: errDisplay.description,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLoaded || !signUp || !formData) {
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      // Verify the email code
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      })

      console.log('[SignupForm] Verification result:', {
        status: result.status,
        hasCreatedUserId: !!result.createdUserId,
        hasCreatedSessionId: !!result.createdSessionId,
      })

      if (result.status === 'complete') {
        const clerkUserId = result.createdUserId
        if (!clerkUserId) {
          toast({
            variant: 'soft',
            title: 'Verification failed',
            description: 'We couldn’t get your account details. Please try again or contact support.',
          })
          return
        }
        if (!result.createdSessionId) {
          toast({
            variant: 'soft',
            title: 'Verification failed',
            description: 'We couldn’t start your session. Please try again or contact support.',
          })
          return
        }

        try {
          await setActive({ session: result.createdSessionId })
        } catch (setActiveError: any) {
          console.error('[SignupForm] Error setting active session:', setActiveError)
          toast({
            variant: 'soft',
            title: 'Verification failed',
            description: 'Your email is verified but we couldn’t log you in. Please go to the login page and sign in with your email and password.',
          })
          router.push('/login')
          return
        }

        // Track if we need to clean up on error
        let clientCreatedOrLinked = false

        try {
          console.log('[SignupForm] Starting client creation/linking process...', {
            hasReferralCode: !!formData.referralCode,
            email: formData.email,
            clerkUserId,
          })
          
          // Handle existing client record and referral codes
          // If referral code provided, process it (handles client creation/update)
          if (formData.referralCode) {
            // Normalize referral code (uppercase, trim)
            const normalizedReferralCode = formData.referralCode.toUpperCase().trim()
            
            // Call referral function with Clerk user ID
            console.log('[SignupForm] Calling process_referral_signup RPC...')
            const { data: referralData, error: referralError } = await supabase.rpc('process_referral_signup', {
              p_referral_code: normalizedReferralCode,
              p_clerk_user_id: clerkUserId,
              p_email: formData.email,
              p_first_name: formData.firstName,
              p_last_name: formData.lastName,
              p_phone: null,
              p_team_id: null,
            })

            console.log('[SignupForm] Referral RPC result:', {
              hasData: !!referralData,
              hasError: !!referralError,
              errorMessage: referralError?.message,
            })

            if (referralError) {
              console.error('[SignupForm] Referral error:', referralError)
              // Check if client exists by email
              console.log('[SignupForm] Referral failed, checking for existing client by email...')
              const { data: existingClientByEmail, error: checkError } = await supabase
                .from('clients')
                .select('id, team_id')
                .eq('email', formData.email)
                .maybeSingle()

              console.log('[SignupForm] Existing client check:', {
                hasClient: !!existingClientByEmail,
                clientId: existingClientByEmail?.id,
                checkError: checkError?.message,
              })

              if (existingClientByEmail) {
                console.log('[SignupForm] Updating existing client with Clerk user ID...')
                const { error: updateError } = await supabase
                  .from('clients')
                  .update({
                    clerk_user_id: clerkUserId,
                    team_id: existingClientByEmail.team_id || '0cef0867-1b40-4de1-9936-16b867a753d7',
                    loyalty_enrolled: true,
                    loyalty_enrolled_at: new Date().toISOString(),
                    loyalty_signup_source: 'self_signup',
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', existingClientByEmail.id)

                if (updateError) {
                  console.error('[SignupForm] Error updating client:', updateError)
                  throw updateError
                }
                console.log('[SignupForm] Client updated successfully')
                clientCreatedOrLinked = true
              } else {
                console.log('[SignupForm] No existing client found, creating new client...')
                const { data: newClient, error: createError } = await supabase.from('clients').insert({
                  clerk_user_id: clerkUserId,
                  user_id: null, // Clerk users don't have a Supabase Auth user_id
                  team_id: '0cef0867-1b40-4de1-9936-16b867a753d7',
                  email: formData.email,
                  first_name: formData.firstName,
                  last_name: formData.lastName,
                  phone: null,
                  status: 'active',
                  loyalty_enrolled: true,
                  loyalty_enrolled_at: new Date().toISOString(),
                  loyalty_signup_source: 'self_signup',
                }).select().single()

                if (createError) {
                  console.error('[SignupForm] Error creating client:', createError)
                  throw createError
                }
                console.log('[SignupForm] Client created successfully:', newClient?.id)
                clientCreatedOrLinked = true
              }
            } else {
              clientCreatedOrLinked = true
              toast({
                title: 'Success! 🎉',
                description: 'Account created with 100 bonus points!',
              })
            }
          } else {
            // Create or update client record without referral
            const { data: existingClientNoReferral } = await supabase
              .from('clients')
              .select('id, team_id, points_balance')
              .eq('email', formData.email)
              .maybeSingle()

            if (existingClientNoReferral) {
              const updateData: any = {
                clerk_user_id: clerkUserId,
                team_id: existingClientNoReferral.team_id || '0cef0867-1b40-4de1-9936-16b867a753d7',
                loyalty_enrolled: true,
                loyalty_enrolled_at: new Date().toISOString(),
                loyalty_signup_source: 'self_signup',
                updated_at: new Date().toISOString(),
              }
              
              if (formData.firstName) updateData.first_name = formData.firstName
              if (formData.lastName) updateData.last_name = formData.lastName

              const { error: updateError } = await supabase
                .from('clients')
                .update(updateData)
                .eq('id', existingClientNoReferral.id)

              if (updateError) throw updateError
              clientCreatedOrLinked = true

              const preservedPoints = existingClientNoReferral.points_balance > 0 
                ? ` Your existing ${existingClientNoReferral.points_balance} points have been preserved.`
                : ''

              toast({
                title: 'Account linked! 🎉',
                description: `Your existing client record has been linked to your portal account.${preservedPoints}`,
              })
            } else {
              const { error: clientError } = await supabase.from('clients').insert({
                clerk_user_id: clerkUserId,
                user_id: null, // Clerk users don't have a Supabase Auth user_id
                team_id: '0cef0867-1b40-4de1-9936-16b867a753d7',
                email: formData.email,
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone: null,
                status: 'active',
                loyalty_enrolled: true,
                loyalty_enrolled_at: new Date().toISOString(),
                loyalty_signup_source: 'self_signup',
              })

              if (clientError) {
                if (clientError.message.includes('unique constraint') || clientError.message.includes('duplicate')) {
                  const { data: checkClient } = await supabase
                    .from('clients')
                    .select('id')
                    .eq('email', formData.email)
                    .single()

                  if (checkClient) {
                    const { error: updateError } = await supabase
                      .from('clients')
                      .update({
                        clerk_user_id: clerkUserId,
                        team_id: '0cef0867-1b40-4de1-9936-16b867a753d7',
                        loyalty_enrolled: true,
                        loyalty_enrolled_at: new Date().toISOString(),
                        loyalty_signup_source: 'self_signup',
                      })
                      .eq('id', checkClient.id)

                    if (updateError) throw updateError
                    clientCreatedOrLinked = true
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
                  description: 'Account created!',
                })
              }
            }
          }

          if (clientCreatedOrLinked) {
            console.log('[SignupForm] Client created/linked successfully, redirecting to dashboard')
            // Verify client exists before redirecting
            const { data: verifyClient } = await supabase
              .from('clients')
              .select('id')
              .eq('clerk_user_id', clerkUserId)
              .single()
            
            if (!verifyClient) {
              console.warn('[SignupForm] Client not found after creation, waiting and retrying...')
              // Wait a bit longer and check again
              await new Promise(resolve => setTimeout(resolve, 1000))
              const { data: retryClient } = await supabase
                .from('clients')
                .select('id')
                .eq('clerk_user_id', clerkUserId)
                .single()
              
              if (!retryClient) {
                toast({
                  variant: 'soft',
                  title: 'Profile not saved',
                  description: 'Your account was created but we couldn’t save your profile. Please log in and contact support to complete setup.',
                })
                router.push('/login')
                return
              }
            }
            
            console.log('[SignupForm] Client verified, redirecting to dashboard')
            // Small delay to ensure session is fully propagated before navigation
            // Reduced from 500ms to 200ms to avoid user delay while still ensuring session is set
            await new Promise(resolve => setTimeout(resolve, 200))
            // Redirect to / instead of /dashboard to avoid redirect chain
            window.location.href = '/'
          } else {
            toast({
              variant: 'soft',
              title: 'Something went wrong',
              description: 'We couldn’t create your profile. Please try again or contact support.',
            })
            return
          }
        } catch (stepError: any) {
          console.error('[SignupForm] Error in client creation/linking:', stepError)
          const errDisplay = getSignupErrorMessage(stepError, 'verification')
          toast({
            variant: 'soft',
            title: errDisplay.title,
            description: errDisplay.description,
          })
          return
        }
      } else {
        console.log('[SignupForm] Verification status not complete:', result.status)
        toast({
          variant: 'soft',
          title: 'Verification failed',
          description: result.status === 'missing_requirements' 
            ? 'Please check your email and enter the verification code.'
            : 'The verification code is invalid. Please try again.',
        })
      }
    } catch (error: any) {
      console.error('[SignupForm] Verification error:', error)
      const errDisplay = getSignupErrorMessage(error, 'verification')
      toast({
        variant: 'soft',
        title: errDisplay.title,
        description: errDisplay.description,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show verification form if pending
  if (pendingVerification) {
    return (
      <form onSubmit={handleVerification} className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Verify your email</h2>
          <p className="text-muted-foreground mt-2">
            We've sent a verification code to <strong>{formData?.email}</strong>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="verificationCode">Verification Code</Label>
          <Input
            id="verificationCode"
            type="text"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            disabled={isLoading}
            maxLength={6}
            autoComplete="one-time-code"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Check your email for the verification code
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || !verificationCode}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify Email
        </Button>

        <div className="text-center">
          <Button
            type="button"
            variant="link"
            onClick={async () => {
              if (signUp) {
                try {
                  await signUp.prepareEmailAddressVerification({
                    strategy: 'email_code',
                  })
                  toast({
                    title: 'Code resent',
                    description: 'A new verification code has been sent to your email.',
                  })
                } catch (error: any) {
                  const errDisplay = getSignupErrorMessage(error, 'resend')
                  toast({
                    variant: 'soft',
                    title: errDisplay.title,
                    description: errDisplay.description,
                  })
                }
              }
            }}
            className="text-sm"
            disabled={isLoading}
          >
            Resend code
          </Button>
        </div>
      </form>
    )
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

      {/* Clerk CAPTCHA widget for bot protection */}
      <div id="clerk-captcha" />

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Account
      </Button>

      <SocialLoginButtons mode="sign-up" referralCode={initialReferralCode} />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  )
}

