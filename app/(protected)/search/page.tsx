import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/app/page-header'
import { getClient } from '@/lib/utils/get-client'

// Search results should be fresh
export const revalidate = 0
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plane, Coins, FileText, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { client, user } = await getClient()
  const params = await searchParams
  const query = params.q?.trim() || ''

  if (!user || !client) {
    redirect('/login')
  }

  if (!query) {
    redirect('/')
  }

  const supabase = await createClient()

  // Search bookings/trips - search by booking reference or event name
  // Get all bookings first, then filter in memory for better flexibility
  const { data: allClientBookings } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_reference,
      event_name,
      status,
      start_date,
      end_date,
      event_id,
      events (
        id,
        name,
        location,
        venues (
          name,
          city,
          country
        )
      )
    `)
    .eq('client_id', client.id)
    .is('deleted_at', null)
  
  // Filter bookings in memory by query
  const queryLower = query.toLowerCase()
  const matchingBookings = (allClientBookings || []).filter((booking: any) => {
    const refMatch = booking.booking_reference?.toLowerCase().includes(queryLower)
    const eventNameMatch = booking.event_name?.toLowerCase().includes(queryLower)
    const event = booking.events as any
    const venue = event?.venues as any
    const eventMatch = event?.name?.toLowerCase().includes(queryLower)
    const locationMatch = event?.location?.toLowerCase().includes(queryLower)
    const venueCityMatch = venue?.city?.toLowerCase().includes(queryLower)
    const venueCountryMatch = venue?.country?.toLowerCase().includes(queryLower)
    const venueNameMatch = venue?.name?.toLowerCase().includes(queryLower)
    return refMatch || eventNameMatch || eventMatch || locationMatch || venueCityMatch || venueCountryMatch || venueNameMatch
  })
  
  // Deduplicate bookings
  const uniqueBookings = Array.from(
    new Map(matchingBookings.map((b: any) => [b.id, b])).values()
  )

  // Search points transactions
  const { data: transactions } = await supabase
    .from('loyalty_transactions')
    .select(`
      id,
      points,
      source_type,
      description,
      created_at,
      source_reference_id,
      bookings (
        id,
        booking_reference,
        event_name
      )
    `)
    .eq('client_id', client.id)
    .ilike('description', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(10)

  const bookingResults = uniqueBookings.map((booking) => {
    const event = booking.events as any
    const venue = event?.venues as any
    const location = event?.location || venue?.city || venue?.country || 'Location TBD'
    
    return {
      id: booking.id,
      type: 'booking' as const,
      title: booking.event_name || event?.name || 'Trip',
      subtitle: booking.booking_reference || '',
      location,
      date: booking.start_date || booking.end_date,
      status: booking.status,
      url: `/trips/${booking.id}`,
    }
  })

  const transactionResults = (transactions || []).map((tx) => {
    const booking = tx.bookings as any
    return {
      id: tx.id,
      type: 'transaction' as const,
      title: tx.description || `${tx.source_type} transaction`,
      subtitle: booking?.booking_reference || '',
      points: tx.points,
      date: tx.created_at,
      sourceType: tx.source_type,
      url: '/points/statement',
    }
  })

  const allResults = [...bookingResults, ...transactionResults]
  const hasResults = allResults.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Search Results"
        description={
          hasResults 
            ? `Found ${allResults.length} result${allResults.length !== 1 ? 's' : ''} for "${query}"`
            : `No results found for "${query}"`
        }
      />

      {!hasResults ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              Try searching for a booking reference, event name, or transaction description.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookingResults.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                Trips ({bookingResults.length})
              </h2>
              <div className="grid gap-4">
                {bookingResults.map((result) => (
                  <Card key={result.id} className="hover:bg-accent/50 transition-colors">
                    <Link href={result.url}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold truncate">{result.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {result.status}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {result.subtitle && (
                                <p className="flex items-center gap-1.5">
                                  <FileText className="h-3.5 w-3.5" />
                                  {result.subtitle}
                                </p>
                              )}
                              {result.location && (
                                <p className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {result.location}
                                </p>
                              )}
                              {result.date && (
                                <p className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {format(new Date(result.date), 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {transactionResults.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                Points Transactions ({transactionResults.length})
              </h2>
              <div className="grid gap-4">
                {transactionResults.map((result) => (
                  <Card key={result.id} className="hover:bg-accent/50 transition-colors">
                    <Link href={result.url}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{result.title}</h3>
                              <Badge 
                                variant={result.points && result.points > 0 ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {result.points && result.points > 0 ? '+' : ''}{result.points || 0} pts
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {result.subtitle && (
                                <p className="flex items-center gap-1.5">
                                  <FileText className="h-3.5 w-3.5" />
                                  {result.subtitle}
                                </p>
                              )}
                              {result.date && (
                                <p className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {format(new Date(result.date), 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


