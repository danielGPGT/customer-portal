"use client"

import * as React from "react"
import { TopHeader } from '@/components/app/top-header'
import { NavBar } from '@/components/app/nav-bar'
import { MobileSidebar } from '@/components/app/mobile-sidebar'
import { AppFooter } from '@/components/app/app-footer'
import { CookieBanner } from '@/components/cookies/cookie-banner'

interface LayoutWrapperProps {
  children: React.ReactNode
  user: any
  client: any
}

export function LayoutWrapper({ 
  children, 
  user, 
  client 
}: LayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className="flex min-h-screen mx-auto flex-col px-4 lg:px-4">
      {/* Top Header - Fixed */}
      <TopHeader
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
        clientId={client.id}
        user={user}
        client={client}
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
  )
}

