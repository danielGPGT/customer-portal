import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Clerk handles signout via the UserButton component or signOut() function
  // This route can be used for programmatic signout if needed
  // For now, we'll redirect to login - Clerk middleware will handle the actual signout
  return NextResponse.redirect(new URL('/login', request.url))
}

