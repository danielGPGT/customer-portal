'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plane, Coins, UserPlus, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  /** Paths that count as active for this item (e.g. /points/earn for Points) */
  activePaths?: string[]
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Trips', href: '/trips', icon: Plane },
  { label: 'Points', href: '/points', icon: Coins, activePaths: ['/points', '/points/earn', '/points/redeem'] },
  { label: 'Refer', href: '/refer', icon: UserPlus },
  { label: 'Profile', href: '/profile', icon: User, activePaths: ['/profile', '/profile/edit', '/profile/preferences', '/profile/password'] },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  const isActive = (item: NavItem) => {
    if (item.href === '/') {
      return pathname === '/' || pathname === '/dashboard'
    }
    if (item.activePaths) {
      return item.activePaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
    }
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 pb-[env(safe-area-inset-bottom)]"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const active = isActive(item)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-2 px-1 rounded-lg transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                className={cn('shrink-0', active ? 'text-primary' : '')}
                size={22}
              />
              <span className="text-[10px] font-medium truncate w-full text-center">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
