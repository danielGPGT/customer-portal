# Client portal – notification setup (booking updated by client)

This guide is for the **client portal** team. When a client saves changes to their booking (traveler details or their own flights), staff should see a notification in the **internal portal** bell. The notification is stored in the **same Supabase database**; the client portal creates it by inserting a row into `internal_notifications`.

---

## 1. Prerequisites

| Requirement | Details |
|------------|---------|
| **Same database** | Client portal and internal app use the same Supabase project. |
| **Clerk auth** | Clients sign in with Clerk; you have the Clerk user ID in the session. |
| **`clients.clerk_user_id`** | The `clients` table has a `clerk_user_id` (text) column. The row for the logged-in client must have this set to their Clerk user ID (e.g. `user_2abc...`). |
| **Supabase + Clerk JWT** | For **direct insert** from the client app, Supabase must be configured to accept Clerk’s JWT (custom JWT). The Clerk user ID must be available in the token (e.g. in the `sub` claim). |

If you do **not** use Clerk JWT with Supabase, you must create the notification from a **backend or Edge Function** with the Supabase **service role** key (see section 4).

---

## 2. When to trigger

Call the insert **once per successful save** when the client has updated:

- **Traveler info** (name, email, phone, DOB, passport, dietary, accessibility, etc.), and/or  
- **Their own flights** (add / edit / delete of flights they booked themselves).

Do **not** trigger when:

- Only staff edits from the internal portal.
- The save failed or was a no-op.

---

## 3. Direct insert from the client app (recommended if Clerk JWT is configured)

Use the **same Supabase client** that sends the Clerk JWT so RLS can match `auth.jwt() ->> 'sub'` to `clients.clerk_user_id`.

**Where to call:** Right after a successful save of the booking (travelers and/or client flights), in the same request/flow that updated the database.

**Insert payload:**

```ts
// After client has successfully saved booking (travelers / their flights)
const { error } = await supabase.from('internal_notifications').insert({
  team_id: booking.team_id,   // from the booking row you already have
  type: 'booking_updated_by_client',
  title: `Booking ${booking.booking_reference} updated by client`,
  message: 'Traveler details or client flights were changed. Review in booking.',
  link_path: `/booking/${booking.id}`,
  link_id: null,
  read_at: null,
  metadata: { booking_id: booking.id },
});
```

**Notes:**

- `team_id` must be the **booking’s** `team_id` (from `bookings.team_id`).
- `link_id: null` so each save creates a new notification (no unique constraint on this type).
- The booking’s client must have `clients.clerk_user_id` set to the current Clerk user ID, and the JWT’s `sub` (or the claim used in RLS) must match that value.

**Example integration point (pseudo):**

```ts
async function onClientSaveBooking(booking: Booking, updatedTravelersOrFlights: unknown) {
  // 1. Save to DB (travelers, flights, etc.)
  const { error: saveError } = await supabase.from('bookings').update(...).eq('id', booking.id);
  if (saveError) throw saveError;

  // 2. Create internal notification so staff see it
  await supabase.from('internal_notifications').insert({
    team_id: booking.team_id,
    type: 'booking_updated_by_client',
    title: `Booking ${booking.booking_reference} updated by client`,
    message: 'Traveler details or client flights were changed. Review in booking.',
    link_path: `/booking/${booking.id}`,
    link_id: null,
    read_at: null,
    metadata: { booking_id: booking.id },
  });
}
```

---

## 4. Fallback: backend or Edge Function (no Clerk JWT with Supabase)

If Supabase does **not** accept Clerk’s JWT:

1. After the client saves, the client portal calls **your backend** or a **Supabase Edge Function**.
2. The backend validates the Clerk session (e.g. verify Clerk token, resolve client).
3. The backend uses the Supabase **service role** client to insert the same row into `internal_notifications` (same payload as in section 3).

RLS does not apply to the service role, so the insert will succeed. The backend must still ensure the booking belongs to the authenticated client before inserting.

---

## 5. Summary

| Item | Value |
|------|--------|
| Table | `internal_notifications` |
| Type | `booking_updated_by_client` |
| Who sees it | Internal portal (staff) – bell icon and /notifications page |
| Trigger | Client portal, once per successful client save of travelers and/or their flights |
| Key link | `clients.clerk_user_id` (text) = Clerk user ID; RLS uses JWT claim (e.g. `sub`) to allow insert |

For more context and alternative options (e.g. internal app API), see `NOTIFICATION_CLIENT_PORTAL_INTEGRATION.md`.
