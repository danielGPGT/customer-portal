# Flight Form RLS Fix – Production

## Problem

The flight form (edit flight information) fails in production: airlines and airports cannot be loaded. It works on localhost.

**Root cause:** Row Level Security (RLS) is enabled on the reference tables `airlines`, `airports`, and `airline_codes`, but there are no policies allowing the client portal (Clerk-authenticated users) to SELECT from them. On localhost, RLS may be disabled or configured differently.

## Solution

Run the migration `ADD_RLS_FOR_FLIGHT_REFERENCE_TABLES.sql` in your production Supabase project.

### Steps

1. Open your **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of `db/ADD_RLS_FOR_FLIGHT_REFERENCE_TABLES.sql`
3. Run the script

### What it does

Adds permissive SELECT policies for:

- `airlines` – airline search and display
- `airports` – airport search and display  
- `airline_codes` – IATA/ICAO codes used by the airline search

These are reference/lookup tables with no sensitive user data. The policies use `TO public` and `USING (true)` so the client portal can read them (same pattern as `events` and `venues`).

### Verification

After running the migration:

```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('airlines', 'airports', 'airline_codes');
```

You should see three policies (one per table) for SELECT.

## Tables involved

| Table           | Used by                                      | Policy added |
|-----------------|-----------------------------------------------|--------------|
| airlines        | Flight form, itinerary card, API /airlines/search | SELECT       |
| airports        | Flight form, itinerary card, API /airports/search | SELECT       |
| airline_codes   | Airlines search (IATA/ICAO)                   | SELECT       |
| bookings_flights| Add/edit/delete client flight details         | INSERT, UPDATE |
