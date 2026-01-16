'use client'

import { useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSignIn, useSignUp, useUser } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'

function SSOCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, isLoaded: signInLoaded } = useSignIn()
  const { signUp, isLoaded: signUpLoaded } = useSignUp()
  const { user, isLoaded: userLoaded } = useUser()
  const referralCode = searchParams.get('ref')
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (!signInLoaded && !signUpLoaded) return
    if (hasRedirected.current) return // Prevent multiple redirects

    const handleCallback = async () => {
      if (hasRedirected.current) return // Double check

      try {
        // Try sign-in first (if user already exists)
        if (signInLoaded && signIn) {
          try {
            const signInResult = await signIn.handleRedirectCallback()
            
            if (signInResult.status === 'complete') {
              // Sign-in successful
              hasRedirected.current = true
              await signIn.setActive({ session: signInResult.createdSessionId })
              window.location.href = '/dashboard'
              return
            }
          } catch (signInError: any) {
            // If handleRedirectCallback fails, it might be a sign-up flow
            // Continue to try sign-up below
            console.log('[SSOCallback] Sign-in callback failed, trying sign-up:', signInError.message)
          }
        }

        // If sign-in didn't work, try sign-up
        if (signUpLoaded && signUp) {
          try {
            const signUpResult = await signUp.handleRedirectCallback()
            
            if (signUpResult.status === 'complete') {
            // Sign-up successful - get Clerk user ID
            const clerkUserId = signUpResult.createdUserId
            
            if (!clerkUserId) {
              throw new Error('Failed to get Clerk user ID')
            }

            // Set active session
            await signUp.setActive({ session: signUpResult.createdSessionId })

            // Wait for user to be loaded
            if (!userLoaded) {
              // Wait a bit for user to load
              await new Promise(resolve => setTimeout(resolve, 1000))
            }

            // If referral code exists, process it
            if (referralCode && user) {
              try {
                const { createClient } = await import('@/lib/supabase/client')
                const supabase = createClient()
                
                const email = user.emailAddresses[0]?.emailAddress
                
                if (email) {
                  const normalizedReferralCode = referralCode.toUpperCase().trim()
                  
                  await supabase.rpc('process_referral_signup', {
                    p_referral_code: normalizedReferralCode,
                    p_clerk_user_id: clerkUserId,
                    p_email: email,
                    p_first_name: user.firstName || '',
                    p_last_name: user.lastName || '',
                    p_phone: user.phoneNumbers[0]?.phoneNumber || null,
                    p_team_id: null,
                  })
                }
              } catch (referralError) {
                console.error('Error processing referral code:', referralError)
                // Continue even if referral fails
              }
            } else if (user) {
              // No referral code - create/link client normally
              try {
                const { createClient } = await import('@/lib/supabase/client')
                const supabase = createClient()
                
                const email = user.emailAddresses[0]?.emailAddress
                
                if (email) {
                  // Check if client exists
                  const { data: existingClient } = await supabase
                    .from('clients')
                    .select('id')
                    .eq('email', email)
                    .maybeSingle()

                  if (existingClient) {
                    // Update existing client
                    await supabase
                      .from('clients')
                      .update({
                        clerk_user_id: clerkUserId,
                        loyalty_enrolled: true,
                        loyalty_enrolled_at: new Date().toISOString(),
                        loyalty_signup_source: 'social_signup',
                        updated_at: new Date().toISOString(),
                      })
                      .eq('id', existingClient.id)
                  } else {
                    // Create new client
                    await supabase.from('clients').insert({
                      clerk_user_id: clerkUserId,
                      user_id: null,
                      team_id: '0cef0867-1b40-4de1-9936-16b867a753d7',
                      email: email,
                      first_name: user.firstName || 'User',
                      last_name: user.lastName || '',
                      phone: user.phoneNumbers[0]?.phoneNumber || null,
                      status: 'active',
                      loyalty_enrolled: true,
                      loyalty_enrolled_at: new Date().toISOString(),
                      loyalty_signup_source: 'social_signup',
                    })
                  }
                }
              } catch (clientError) {
                console.error('Error creating/linking client:', clientError)
                // Continue even if client creation fails - getClient() will handle it
              }
            }

            hasRedirected.current = true
            window.location.href = '/dashboard'
            return
          }
          } catch (signUpError: any) {
            // If handleRedirectCallback fails, redirect to login
            if (!hasRedirected.current) {
              hasRedirected.current = true
              console.error('[SSOCallback] Sign-up callback failed:', signUpError)
              router.push('/login?error=oauth_failed')
            }
            return
          }
        }

        // If we get here, something went wrong
        if (!hasRedirected.current) {
          hasRedirected.current = true
          router.push('/login?error=oauth_failed')
        }
      } catch (error) {
        console.error('SSO callback error:', error)
        if (!hasRedirected.current) {
          hasRedirected.current = true
          router.push('/login?error=oauth_failed')
        }
      }
    }

    handleCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signInLoaded, signUpLoaded])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Completing sign-in...</p>
      </div>
    </div>
  )
}

export default function SSOCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <SSOCallbackContent />
    </Suspense>
  )
}
