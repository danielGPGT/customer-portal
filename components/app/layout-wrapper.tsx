"use client"

import * as React from "react"
import { usePathname, useRouter } from 'next/navigation'
import { TopHeader } from '@/components/app/top-header'
import { NavBar } from '@/components/app/nav-bar'
import { MobileSidebar } from '@/components/app/mobile-sidebar'
import { AppFooter } from '@/components/app/app-footer'
import { CookieBanner } from '@/components/cookies/cookie-banner'
import { CurrencyProvider } from '@/components/providers/currency-provider'
import { getClientPreferredCurrency } from '@/lib/utils/currency'

interface LayoutWrapperProps {
  children: React.ReactNode
  user: any
  client: any
  baseCurrency?: string
}

export function LayoutWrapper({ 
  children, 
  user, 
  client,
  baseCurrency = 'GBP'
}: LayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const prevPathnameRef = React.useRef(pathname)

  // Get initial currency from client preferences
  const initialCurrency = getClientPreferredCurrency(client, baseCurrency)

  // Check for currency updates on route change
  React.useEffect(() => {
    // Only check if pathname changed (navigation occurred)
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname
      
      // Check if currency was updated recently (within last 5 seconds)
      if (typeof window !== 'undefined') {
        const currencyUpdated = sessionStorage.getItem('currency-updated')
        if (currencyUpdated) {
          const updateTime = parseInt(currencyUpdated, 10)
          const timeSinceUpdate = Date.now() - updateTime
          
          // If currency was updated within last 5 seconds, refresh to get fresh data
          if (timeSinceUpdate < 5000) {
            // Clear the flag to prevent infinite refreshes
            sessionStorage.removeItem('currency-updated')
            // Small delay to ensure navigation completes
            setTimeout(() => {
              router.refresh()
            }, 100)
          }
        }
      }
    }
  }, [pathname, router])

  // LayoutWrapper mounted - no debug logs needed

  return (
    <CurrencyProvider
      initialCurrency={initialCurrency}
      clientId={client.id}
      baseCurrency={baseCurrency}
    >
      <div className="flex min-h-screen mx-auto flex-col px-4 lg:px-4">
        {/* Top Header - Fixed */}
        <TopHeader
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          isSidebarOpen={sidebarOpen}
          clientId={client.id}
          user={user}
          client={client}
          baseCurrency={baseCurrency}
        />

      {/* Navigation Bar - Fixed (Desktop only) */}
      <div className="hidden lg:block">
        <NavBar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 pt-20 lg:pt-36 pb-10 overflow-x-hidden">
        <div className="mx-auto w-full container">
          {children}
        </div>
      </main>

        <AppFooter />
        
        {/* Cookie Banner */}
        <CookieBanner />
      </div>
    </CurrencyProvider>
  )
}

