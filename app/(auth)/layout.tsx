import type { Metadata } from 'next'
import { AuthNavbar } from '@/components/auth/auth-navbar'
import { AuthRightNav } from '@/components/auth/auth-right-nav'
import { CookieBanner } from '@/components/cookies/cookie-banner'

export const metadata: Metadata = {
  title: 'Account | Grand Prix Grand Tours Portal',
  description: 'Sign in or create an account to access your loyalty program',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth Form (White Background) */}
      <div className="flex-1 flex flex-col bg-background min-h-screen">
        {/* Logo in top-left */}
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 pt-4 sm:pt-6 lg:pt-8">
          <AuthNavbar />
        </div>

        {/* Auth Form - Centered */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8">
          <div className="w-full max-w-md mx-auto">
            {children}
          </div>
        </div>

        {/* Footer Contact Info - Mobile Optimized */}
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 pb-4 sm:pb-6 lg:pb-8">
          <div className="w-full max-w-md mx-auto">
            <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <p className="leading-relaxed">
                Questions? Email us at{' '}
                <a href="mailto:bookings@grandprixgrandtours.com" className="text-primary hover:underline font-medium">
                  bookings@grandprixgrandtours.com
                </a>
              </p>
              <p className="leading-relaxed">
                Call us: <a href="tel:+442034740512" className="text-primary hover:underline font-medium">(UK) 0203 474 0512</a>{' '}
                or <a href="tel:+12138086027" className="text-primary hover:underline font-medium">(US) 213 808 6027</a>
              </p>
              <p className="leading-relaxed">
                Visit{' '}
                <a href="https://www.grandprixgrandtours.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                  grandprixgrandtours.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Background Image with Navigation & Promotional Content */}
      <div 
        className="hidden lg:flex lg:flex-1 lg:flex-col relative min-h-screen"
        style={{
          backgroundImage: 'url(/assets/images/67b47522e00a9d3b8432bdd7_67b4739ca8ab15bb14dcff85_Singapore-Home-Tile-min.avif)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Navigation Bar - Top Right */}
        <div className="relative z-10 flex justify-end items-center px-6 xl:px-12 pt-6 lg:pt-8">
          <AuthRightNav />
        </div>

        {/* Promotional Text - Center Left */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 xl:px-12">
          <div className="max-w-xl">
            <p className="text-white text-base xl:text-2xl leading-relaxed">
              Grand Prix Grand Tours - the customer portal that allows you to manage your loyalty points, 
              track your trips, and unlock exclusive rewards - all accessible from your phone, tablet, or desktop.
            </p>
          </div>
        </div>

      </div>
      
      {/* Cookie Banner */}
      <CookieBanner />
    </div>
  )
}

