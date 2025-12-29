import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getCookieOptions } from '@/lib/utils/cookies'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Merge with consistent cookie options
          const cookieOptions = getCookieOptions(options)
          request.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Merge with consistent cookie options for removal
          const cookieOptions = getCookieOptions({
            ...options,
            maxAge: 0, // Expire immediately
          })
          request.cookies.set({
            name,
            value: '',
            ...cookieOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...cookieOptions,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Auth routes (redirect if already logged in, but allow error messages to be shown)
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') && user) {
    // Don't redirect if there's an error parameter - allow error messages to be displayed
    const hasError = request.nextUrl.searchParams.has('error')
    if (!hasError) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

