# Client portal → internal notification (booking updated by client)

When a **client** updates their booking in the **client portal** (traveler info or their own flights), staff should see a notification in the **internal portal** bell: “Booking {ref} updated by client”.

The internal app no longer triggers this from its own edit booking flow (clients use the client portal, not the internal one).

---

## What the client portal needs to do

After the client successfully saves changes to their booking (travelers and/or their own flights), the client portal should create an **internal notification** so staff see it.

### Option A – Insert into Supabase from the client portal

If the client portal uses Supabase with a service role or a server-side function that has access to `internal_notifications`, insert a row after the client’s save:

```ts
// After client has saved booking (travelers / their flights)
await supabase.from('internal_notifications').insert({
  team_id: booking.team_id,   // from the booking row
  type: 'booking_updated_by_client',
  title: `Booking ${booking.booking_reference} updated by client`,
  message: 'Traveler details or client flights were changed. Review in booking.',
  link_path: `/booking/${booking.id}`,
  link_id: null,
  read_at: null,
  metadata: { booking_id: booking.id },
});
```

- Use the **booking’s** `team_id` (from `bookings.team_id`).
- `link_id: null` so each update creates a new notification (no unique constraint on this type).

### Option B – Call a server/API in the internal app

If the client portal can call an endpoint on the internal app (e.g. with a shared secret or server-to-server auth), add something like:

- **POST** `/api/notifications/booking-updated-by-client`
- Body: `{ "bookingId": "uuid" }` (and optionally `teamId` if you don’t want to look it up).
- Handler: load `bookings.team_id` and `booking_reference` for that `bookingId`, then insert into `internal_notifications` as in Option A.

### Option C – Shared package / function

If the client portal and internal app share TypeScript code, call the same helper:

```ts
import { NotificationService } from '@your-org/notification-service';

await NotificationService.insertBookingUpdatedByClient(teamId, bookingId);
```

The internal app’s implementation lives in `src/lib/notificationService.ts`: `insertBookingUpdatedByClient(teamId, bookingId)`.

---

## When to trigger

Trigger **once per save** when the client has successfully updated:

- **Traveler info** (e.g. name, email, phone, DOB, passport, dietary, accessibility), and/or  
- **Their own flights** (add/edit/delete of flights they booked themselves – not “our” booked flights).

Do not trigger when only staff edits from the internal portal.

---

## Summary

| Item | Value |
|------|--------|
| Notification type | `booking_updated_by_client` |
| Table | `internal_notifications` |
| Who sees it | Internal portal users (bell + /notifications) |
| Trigger | Client portal, after client saves traveler and/or their flight changes |

If you tell me how the client portal is built (e.g. same repo, separate repo, Supabase only, serverless), I can suggest the exact integration point (e.g. which file/function to call or which API to add).
