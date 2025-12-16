"use client"

import * as React from "react"
import { TopHeader } from '@/components/app/top-header'
import { NavBar } from '@/components/app/nav-bar'
import { MobileSidebar } from '@/components/app/mobile-sidebar'
import { AppFooter } from '@/components/app/app-footer'
import Image from "next/image"

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
    <div className="flex min-h-screen mx-auto flex-col">
        {/* <div className="h-[100vh] bg-image-background bg-gradient-to-bl from-background/40 to-primary/0 fixed top-0 left-0 w-full -z-1"></div> */}
        <div className="h-[100vh] fixed top-0 left-0 w-full -z-10 overflow-hidden">

    {/*<Image
  src="/assets/images/gxhkcqgcvh5wbv7dyrmd.webp"
  alt="Background"
  fill
  className="object-cover"
  quality={100}
  sizes="100vw"
/> */}

</div>
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
      <main className="flex-1 pt-26 container mx-auto lg:pt-38 px-4 lg:px-0 pb-10 overflow-x-hidden">
        <div className="h-full">
          {children}
        </div>
      </main>

      <AppFooter />
    </div>
  )
}

