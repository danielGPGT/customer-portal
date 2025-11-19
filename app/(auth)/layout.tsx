import type { Metadata } from 'next'

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
      {/* Left side - Branding/Image (hidden on mobile, shown on tablet+) */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 lg:py-16 xl:px-16 bg-gradient-to-br from-black to-gray-900 text-white relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>
        
        <div className="relative z-10 max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl xl:text-5xl font-bold mb-4">
              Welcome to Your
              <br />
              <span className="text-primary">Loyalty Portal</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Manage your points, track your trips, and unlock exclusive rewards.
              Start earning today.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4 mt-12">
            <div className="flex items-start gap-3">
              <div className="mt-1.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Earn Points</h3>
                <p className="text-sm text-muted-foreground">Get rewarded for every booking you make</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Track Trips</h3>
                <p className="text-sm text-muted-foreground">View your past and upcoming bookings in one place</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Refer Friends</h3>
                <p className="text-sm text-muted-foreground">Share the love and earn bonus points together</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 bg-background">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile header */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Customer Loyalty
            </h1>
            <p className="text-foreground">
              Your portal to rewards and exclusive benefits
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}

