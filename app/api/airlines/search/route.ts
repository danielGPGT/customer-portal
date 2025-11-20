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

      if (nameError) {
        console.error('Error searching airlines by name:', nameError)
      }

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

      if (codeError) {
        console.error('Error searching airlines by code:', codeError)
      }

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
      console.error('Error searching airlines:', error)
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
  } catch (error) {
    console.error('Error in airlines search API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

