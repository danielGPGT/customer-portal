"use client"

import * as React from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  title: string
  message: string
  notification_type: string
  read: boolean
  created_at: string
  action_url?: string | null
  metadata?: any
}

export function NotificationsPopover({ clientId }: { clientId: string }) {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isOpen, setIsOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch by only rendering Radix UI components after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!clientId) return

    const supabase = createClient()

    // Fetch notifications
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!error && data) {
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.read).length)
      }
      setIsLoading(false)
    }

    fetchNotifications()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `client_id=eq.${clientId}`,
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clientId])

  const markAsRead = async (notificationId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return

    const supabase = createClient()
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .in('id', unreadIds)

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      )
      setUnreadCount(0)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'points_earned':
        return '🎉'
      case 'points_spent':
        return '💳'
      case 'referral_signup':
        return '👥'
      case 'referral_completed':
        return '✅'
      case 'booking_confirmed':
        return '✈️'
      case 'booking_cancelled':
        return '❌'
      case 'promotion':
        return '🎁'
      default:
        return '📢'
    }
  }

  const getNotificationUrl = (notification: Notification): string => {
    // Always navigate to notifications page
    return '/notifications'
  }

  // Render simple button during SSR to avoid hydration mismatch
  // Then render Popover after mount when Radix UI IDs are stable
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        className="relative h-10 w-10 p-0 text-background dark:text-primary-foreground hover:bg-secondary-950"
        disabled
      >
        <Bell size={32} className="text-background size-8" />
        {unreadCount > 0 && (
          <Badge
            variant="default"
            className="absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-semibold"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
        <span className="sr-only">Notifications</span>
      </Button>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 p-0 text-background dark:text-primary-foreground hover:bg-secondary-950"
        >
          <Bell size={32} className="text-background size-5" />
          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-semibold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-80 p-0 ml-4" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : (() => {
            const unreadNotifications = notifications.filter((n) => !n.read)
            
            if (unreadNotifications.length === 0) {
              return (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No notifications
                  </p>
                </div>
              )
            }
            
            return (
              <div className="divide-y">
                {unreadNotifications.map((notification) => {
                  const url = getNotificationUrl(notification)
                  return (
                    <Link
                      key={notification.id}
                      href={url}
                      prefetch={true}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id)
                        }
                      }}
                      className="block p-4 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg shrink-0">
                          {getNotificationIcon(notification.notification_type)}
                        </span>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {notification.title}
                            </p>
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )
          })()}
        </ScrollArea>
        {unreadCount > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              asChild
            >
              <Link href="/notifications" prefetch={true} onClick={() => setIsOpen(false)}>
                View all notifications
              </Link>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

