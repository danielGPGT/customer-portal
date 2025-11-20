import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let queryBuilder = supabase
      .from('airports')
      .select('id, iata_code, name, city, country', { count: 'exact' })
      .order('name')

    // If there's a search query, filter by code, name, or city
    if (query) {
      queryBuilder = queryBuilder.or(
        `iata_code.ilike.%${query}%,name.ilike.%${query}%,city.ilike.%${query}%`
      )
    }

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    const { data, error, count } = await queryBuilder

    if (error) {
      console.error('Error searching airports:', error)
      return NextResponse.json(
        { error: 'Failed to search airports' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error in airports search API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

