import type { Metadata } from 'next'
import { AuthNavbar } from '@/components/auth/auth-navbar'
import { AuthRightNav } from '@/components/auth/auth-right-nav'

export const metadata: Metadata = {
  title: 'Account | Customer Loyalty Portal',
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
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 lg:pt-8">
          <AuthNavbar />
        </div>

        {/* Auth Form - Centered */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
          <div className="w-full max-w-md mx-auto">
            {children}
          </div>
        </div>

        {/* Footer Contact Info */}
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 pb-6 lg:pb-8">
          <div className="w-full max-w-md mx-auto">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              If you have questions email us at{' '}
              <a href="mailto:support@grandprixgrandtours.com" className="text-primary hover:underline">
                support@grandprixgrandtours.com
              </a>
              {' '}or call us at (UK) 0203 474 0512 or (US) 213 808 6027. For more detail go to{' '}
              <a href="https://www.grandprixgrandtours.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                www.grandprixgrandtours.com
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Background Image with Navigation & Promotional Content */}
      <div 
        className="hidden lg:flex lg:flex-1 lg:flex-col relative min-h-screen"
        style={{
          backgroundImage: 'url(/assets/images/67b4ad50c55779bb94474065_Canada-Home-Tile-1-min-e1741342952168.webp)',
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

        {/* Cookie Management Button - Bottom Right */}
        <div className="relative z-10 flex justify-end items-end px-6 xl:px-12 pb-6 lg:pb-8">
          <button className="text-xs text-white/80 bg-black/30 hover:bg-black/50 px-3 py-1.5 rounded transition-colors">
            Manage cookies
          </button>
        </div>
      </div>
    </div>
  )
}

