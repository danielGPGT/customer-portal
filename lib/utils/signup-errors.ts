/**
 * User-facing error messages for signup and verification.
 * Every failure path should show a clear reason so users know what went wrong.
 */

export interface SignupErrorDisplay {
  title: string
  description: string
}

/**
 * Get a clear title and description for any signup/verification error.
 * Handles Clerk errors, Supabase errors, and generic/network errors.
 */
export function getSignupErrorMessage(error: unknown, context: 'signup' | 'verification' | 'resend' = 'signup'): SignupErrorDisplay {
  const err = error as any
  const clerkMessage = err?.errors?.[0]?.message ?? err?.message ?? ''
  const clerkCode = err?.errors?.[0]?.code ?? ''

  // —— Clerk: already registered ——
  if (
    clerkCode === 'form_identifier_exists' ||
    /already exists|already registered|identifier exists/i.test(clerkMessage)
  ) {
    return {
      title: 'Already have an account',
      description: 'This email is already registered. You can log in instead.',
    }
  }

  // —— Clerk: password ——
  if (/password|too weak|too short|minimum length/i.test(clerkMessage) || clerkCode?.toLowerCase().includes('password')) {
    return {
      title: 'Password needs a small update',
      description: 'Use at least 8 characters, one number, and one special character (e.g. !@#$%).',
    }
  }

  // —— Clerk: email format ——
  if (/invalid email|valid email|email format/i.test(clerkMessage) || clerkCode?.toLowerCase().includes('email')) {
    return {
      title: 'Check your email address',
      description: 'Please enter a valid email address and try again.',
    }
  }

  // —— Clerk: phone ——
  if (/phone|invalid number|e\.164|country code/i.test(clerkMessage) || clerkCode?.toLowerCase().includes('phone')) {
    return {
      title: 'Phone number format',
      description: 'Use a number with country code (e.g. +44 7123 456789). You can leave phone blank and add it later.',
    }
  }

  // —— Clerk: rate limit ——
  if (/rate limit|too many|try again later|throttl/i.test(clerkMessage) || clerkCode?.toLowerCase().includes('rate')) {
    return {
      title: 'Taking a short break',
      description: 'Please wait a few minutes and try again.',
    }
  }

  // —— Clerk: verification code ——
  if (context === 'verification' || context === 'resend') {
    if (/expired|invalid code|incorrect code|wrong code/i.test(clerkMessage)) {
      return {
        title: 'Code didn’t work',
        description: 'That code may have expired. Check your email for the latest code, or click “Resend code”.',
      }
    }
    if (/rate limit|too many|try again later/i.test(clerkMessage)) {
      return {
        title: 'Taking a short break',
        description: 'Please wait a few minutes before requesting another code.',
      }
    }
  }

  // —— Supabase: RLS / permission ——
  const msg = typeof err?.message === 'string' ? err.message : String(clerkMessage)
  if (/policy|permission|row-level security|RLS|access denied|new row violates/i.test(msg)) {
    return {
      title: 'We couldn’t save your account',
      description: 'Something on our side prevented signup. Please try again in a moment or contact us if it keeps happening.',
    }
  }

  // —— Supabase: foreign key ——
  if (/foreign key|violates foreign key|referenced/i.test(msg)) {
    return {
      title: 'Almost there',
      description: 'We couldn’t link your account just yet. Please contact us and we’ll sort it out.',
    }
  }

  // —— Supabase: unique / duplicate ——
  if (/unique constraint|duplicate key|already exists/i.test(msg)) {
    return {
      title: 'Already have an account',
      description: 'This email is already registered. You can log in instead.',
    }
  }

  // —— Network / connection ——
  if (/network|fetch|connection|failed to fetch|timeout|unable to reach/i.test(msg)) {
    return {
      title: 'Connection issue',
      description: 'Please check your internet connection and try again.',
    }
  }

  // —— Use Clerk or provider message only if it's a real, readable message ——
  const raw = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message
  const isHelpfulRaw =
    raw &&
    typeof raw === 'string' &&
    raw.length > 15 &&
    raw.length < 200 &&
    !/^unknown$|^error$|^failed$/i.test(raw.trim())
  if (isHelpfulRaw) {
    return {
      title: context === 'verification' ? 'Code didn’t work' : context === 'resend' ? 'Resend didn’t go through' : 'Something went wrong',
      description: raw,
    }
  }

  // —— Fallback ——
  if (context === 'verification') {
    return {
      title: 'Code didn’t work',
      description: 'That code may be wrong or expired. Check your email and try again, or request a new code.',
    }
  }
  if (context === 'resend') {
    return {
      title: 'Resend didn’t go through',
      description: 'Please wait a minute and try again, or check your email for an existing code.',
    }
  }
  return {
    title: 'Something went wrong',
    description: 'We couldn’t create your account just now. Please try again in a moment or contact us if it keeps happening.',
  }
}
