'use client'

import * as React from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface Notification {
  id: string
  title: string
  message: string
  notification_type: string
  read: boolean
  read_at: string | null
  created_at: string
  action_url?: string | null
  metadata?: any
}

interface NotificationsListProps {
  notifications: Notification[]
  clientId: string
}

export function NotificationsList({ notifications: initialNotifications, clientId }: NotificationsListProps) {
  const [notifications, setNotifications] = React.useState<Notification[]>(initialNotifications)
  const [isLoading, setIsLoading] = React.useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  // Subscribe to real-time updates
  React.useEffect(() => {
    const channel = supabase
      .channel('notifications-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `client_id=eq.${clientId}`,
        },
        () => {
          // Refetch notifications on change
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clientId, supabase])

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setNotifications(data)
    }
  }

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n))
      )
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return

    setIsLoading(true)
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .in('id', unreadIds)

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() }))
      )
      toast({
        title: 'All notifications marked as read',
      })
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark all notifications as read',
      })
    }
    setIsLoading(false)
  }

  const getNotificationUrl = (notification: Notification): string => {
    // If action_url is provided, use it
    if (notification.action_url) {
      return notification.action_url
    }

    // Otherwise, route based on notification type and metadata
    const metadata = notification.metadata || {}
    
    switch (notification.notification_type) {
      case 'points_earned':
      case 'points_spent':
        // If there's a booking_id in metadata, link to that booking's points section
        if (metadata.booking_id) {
          return `/trips/${metadata.booking_id}?tab=points`
        }
        return '/points'
      
      case 'referral_signup':
      case 'referral_completed':
        return '/refer'
      
      case 'booking_confirmed':
      case 'booking_cancelled':
        if (metadata.booking_id) {
          return `/trips/${metadata.booking_id}`
        }
        return '/trips'
      
      case 'promotion':
        if (metadata.url) {
          return metadata.url
        }
        return '#'
      
      case 'system':
      default:
        return '#'
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

  const unreadCount = notifications.filter((n) => !n.read).length

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
          <p className="text-sm text-muted-foreground">
            When you receive notifications about your bookings, points, or referrals, they'll appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with mark all as read */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">All Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="h-5 text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={isLoading}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {notifications.map((notification) => {
              const url = getNotificationUrl(notification)
              const isClickable = url !== '#'
              
              const NotificationContent = (
                <div
                  className={`flex items-start gap-4 p-4 transition-colors ${
                    !notification.read ? 'bg-accent/50' : ''
                  } ${isClickable ? 'hover:bg-accent cursor-pointer' : ''}`}
                  onClick={() => {
                    if (!notification.read && isClickable) {
                      markAsRead(notification.id)
                    }
                  }}
                >
                  <span className="text-2xl shrink-0">
                    {getNotificationIcon(notification.notification_type)}
                  </span>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            !notification.read ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {notification.title}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      <span>•</span>
                      <span>
                        {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(notification.id)
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )

              if (isClickable) {
                return (
                  <Link key={notification.id} href={url}>
                    {NotificationContent}
                  </Link>
                )
              }

              return <div key={notification.id}>{NotificationContent}</div>
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
