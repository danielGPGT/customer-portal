import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50') || 50), 100)
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0') || 0)

    let queryBuilder = supabase
      .from('airlines')
      .select(`
        id,
        name,
        airline_codes (
          iata_code,
          icao_code,
          is_primary
        )
      `, { count: 'exact' })
      .order('name')

    // If there's a search query, filter by name or by IATA/ICAO codes
    if (query) {
      // Search by name
      const { data: airlinesByName, error: nameError } = await supabase
        .from('airlines')
        .select(`
          id,
          name,
          airline_codes (
            iata_code,
            icao_code,
            is_primary
          )
        `)
        .ilike('name', `%${query}%`)

      // Search by airline codes (IATA or ICAO)
      const { data: codesByCode, error: codeError } = await supabase
        .from('airline_codes')
        .select(`
          airline_id,
          iata_code,
          icao_code,
          is_primary,
          airlines (
            id,
            name,
            airline_codes (
              iata_code,
              icao_code,
              is_primary
            )
          )
        `)
        .or(`iata_code.ilike.%${query}%,icao_code.ilike.%${query}%`)

      // Combine results
      const airlineIds = new Set<string>()
      const result: any[] = []

      // Add airlines found by name
      if (airlinesByName) {
        airlinesByName.forEach((airline: any) => {
          if (!airlineIds.has(airline.id)) {
            airlineIds.add(airline.id)
            result.push({
              id: airline.id,
              name: airline.name,
              codes: (airline.airline_codes || []).filter((c: any) => c !== null)
            })
          }
        })
      }

      // Add airlines found by code
      if (codesByCode) {
        codesByCode.forEach((code: any) => {
          const airline = code.airlines
          if (airline && !airlineIds.has(airline.id)) {
            airlineIds.add(airline.id)
            result.push({
              id: airline.id,
              name: airline.name,
              codes: (airline.airline_codes || []).filter((c: any) => c !== null)
            })
          }
        })
      }

      // Sort by name
      result.sort((a, b) => a.name.localeCompare(b.name))

      // Apply pagination manually
      const paginatedResult = result.slice(offset, offset + limit)

      return NextResponse.json({
        data: paginatedResult,
        count: result.length,
        limit,
        offset,
      })
    }

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    const { data, error, count } = await queryBuilder

    if (error) {
      return NextResponse.json(
        { error: 'Failed to search airlines' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const airlines = (data || []).map(airline => ({
      ...airline,
      codes: (airline.airline_codes || []) as any[]
    }))

    return NextResponse.json({
      data: airlines,
      count: count || 0,
      limit,
      offset,
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

