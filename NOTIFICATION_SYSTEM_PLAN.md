# Internal portal – notification system plan

## 1. Goal and problem

**Problem:** There is no central place for staff to see important updates. People miss:
- New bookings (created from quotes or intake)
- Contract deadlines (payments, rooming lists, attrition) approaching or overdue
- Other time-sensitive or “someone did something” events

**Goal:** A single **notification centre** (bell in header + optional “See all” page) that shows:
- **What happened** (e.g. “Booking ABC123 created”)
- **What needs attention** (e.g. “Contract X – payment due in 3 days”)
- **Links** to the relevant resource (booking, contract, rooming list, etc.)

So staff can rely on one place instead of checking multiple screens.

---

## 2. What already exists

| Piece | Location | Notes |
|-------|----------|--------|
| **Bell + dropdown** | `Header.tsx` | Already shows “Notifications” and, for non-B2B, PTO outstanding count + one link to `/inventory/pto`. Otherwise “No new notifications”. |
| **Contract deadlines** | `hotel_contract_deadlines` table, `DeadlineAlertService` | Deadlines with type, date, status (pending/completed/overdue/waived). Urgency: overdue, critical (≤7d), warning (≤14d), upcoming (≤30d). Used on Hotel Contracts and Hotel Rooms. |
| **Booking creation** | `BookingService.createBookingFromQuote`, CreateBooking / CreateBookingFromQuoteV2 | Bookings created in app; no central “booking created” event written for notifications. |
| **Audit logs** | `operations_audit_log` (operations), `booking_audit_log` (booking changes) | Event/booking-scoped audit trails, not a user-facing notification feed. |

So we have:
- A ready-made **UI hook** (bell dropdown).
- **Contract deadline** logic we can reuse for “deadline” notifications.
- **No** shared “notification” store yet (no table, no unified list).

---

## 3. Notification types (scope)

Proposed in-app notification types:

| Type | Description | Source / trigger | Link target |
|------|-------------|------------------|-------------|
| **booking_created** | New booking created (from quote or intake). | On successful `createBookingFromQuote` (and any other booking-creation path we want). | `/booking/:id` |
| **contract_deadline** | Contract deadline upcoming or overdue (payment, rooming list, attrition, etc.). | Derived from `hotel_contract_deadlines` (status = pending, deadline_date near or past). Reuse `DeadlineAlertService` urgency. | Hotel Contracts or specific contract. |
| **pto_fulfillment** (existing) | PTO lines need fulfillment. | Keep current logic (provisional tickets/hotel rooms on bookings). | `/inventory/pto` |

**Optional / later:**
- Rooming list sign-off (e.g. “Rooming list has unsigned changes”).
- Quote accepted / converted.
- Payment due (if not covered by contract_deadline).
- Low inventory / allocation warnings.

For **Phase 1** we focus on:
1. **booking_created**
2. **contract_deadline** (upcoming + overdue)
3. Keep **pto_fulfillment** in the same dropdown.

---

## 4. Data model options

### Option A – Dedicated `notifications` table (recommended)

- **Table:** e.g. `notifications` with: `id`, `team_id`, `user_id` (optional; null = all team), `type` (booking_created, contract_deadline, …), `title`, `body` or `message`, `link_path`, `link_id`, `read_at`, `created_at`, `metadata` (jsonb for refs like booking_id, contract_id, deadline_id).
- **Writing:** When a booking is created, insert a row. For contract deadlines we can either (i) **write rows** when we run a job that finds upcoming/overdue deadlines, or (ii) **derive** deadline items in the feed without storing them (see Option B).
- **Pros:** Single place to query “what to show”, supports mark-as-read, dismiss, and future email/push. Clear ownership and filtering (by user/role if we add it).
- **Cons:** Need to maintain triggers or service calls when events happen; for deadlines we need a strategy (write periodically vs. derive).

### Option B – Aggregated feed (no notifications table)

- **Query at read time:** Bell dropdown (and “See all” page) query:
  - Recent bookings (e.g. `bookings.created_at` last 7 days, team-scoped) → “Booking X created”.
  - Pending contract deadlines (from `hotel_contract_deadlines` + `DeadlineAlertService`) → “Contract Y – payment in 3 days”.
  - Existing PTO count logic.
- **Pros:** No new table; always in sync with source data.
- **Cons:** “Mark as read” and “dismiss” are awkward (would need a separate “dismissed” store). Harder to add email later. Mixing “events” (bookings) with “alerts” (deadlines) in one list needs clear UX.

**Recommendation:** **Option A** for a proper notification system: add a `notifications` table, write **booking_created** when a booking is created, and for **contract_deadline** either:
- **A1:** A small job (or on-demand when loading notifications) that creates/updates notification rows for pending deadlines (e.g. next 30 days + overdue), so the bell shows stored items and we can support read/dismiss; or
- **A2:** Store only “booking_created” (and similar events) in the table, and **compute** “contract_deadline” items in the same API/query that returns the list (so deadline items are always fresh, no duplicate rows per deadline).

We can start with **A2** for deadlines (derive in API) and **A** for booking_created (write on create), then move deadlines to A1 if we want “mark deadline as read”.

---

## 5. UX and UI

- **Bell in header (existing):**
  - Badge: total count of “unread” or “attention needed” items (e.g. new bookings in last 24h + overdue/critical/warning deadlines + PTO count).
  - Dropdown: list of recent/active items (e.g. last 10–20), grouped or ordered by date.
  - Each row: icon + title + optional short detail + “View” link. For deadlines, show urgency (e.g. “Due in 3 days”, “Overdue”).
- **“See all” page (optional but useful):**
  - Route e.g. `/notifications` or `/activity`.
  - Tabs or filters: “All”, “Bookings”, “Deadlines”, “PTO”.
  - List with pagination; link each item to booking/contract/pto.
- **Mark as read:** If we use a notifications table, `read_at` and an endpoint to mark one or all as read. Bell count excludes read items (or we only show “unread” in dropdown).
- **Scope:** Notifications are **team-scoped** (same as rest of portal). Optionally later: filter by “my events” or role.

---

## 6. Implementation phases

### Phase 1 – MVP (in-app only)

1. **Data**
   - Add `notifications` table (team_id, type, title, message, link_path, link_id, read_at, created_at, metadata). Indexes: team_id, created_at, read_at.
   - RLS: team members can select/update only their team’s notifications.

2. **Booking created**
   - After successful `BookingService.createBookingFromQuote` (and any other create path we care about), insert a notification: type `booking_created`, title “Booking {reference} created”, link to `/booking/:id`. Optionally include event name or quote ref in message/metadata.

3. **Contract deadlines**
   - **Derived in API:** One function or API that returns “deadline” items: load pending `hotel_contract_deadlines` (team’s contracts), run through `DeadlineAlertService.getAlerts` (or getUrgentAlerts), return list of { type: 'contract_deadline', deadline, contract, urgency, link }.
   - Bell dropdown (and “See all”) merge: notifications from DB (booking_created, etc.) + derived deadline items. Sort by date/urgency.

4. **Header dropdown**
   - Replace current content with a single “notification list”:
     - PTO item (existing logic) if count > 0.
     - Contract deadline items (from derived list).
     - Booking-created items (from `notifications` table).
   - Badge count = PTO count + unread notifications count + “urgent” deadline count (or similar).
   - “See all” link to `/notifications`.

5. **Optional “See all” page**
   - Page at `/notifications` that loads the same merged list (with pagination for DB notifications), tabs or filters for Bookings / Deadlines / PTO.

### Phase 2 – Polish

- Mark as read: API to set `read_at`; dropdown and page only show unread (or show recent read with lower emphasis).
- “Dismiss” for deadline items (store dismissed_deadline_ids in user prefs or a small table).
- Clear “Mark all as read” in dropdown and on page.

### Phase 3 – Later (if needed)

- Email digest (e.g. daily): “New bookings and deadlines” from notifications table + deadlines.
- Optional push/browser notifications.
- Role-based or event-based filtering (“only my events”).

---

## 7. Technical notes

- **Reuse:** `DeadlineAlertService` (urgency, message, badge variant) for contract_deadline. Existing Header bell + dropdown structure. Team scoping via `team_id` and RLS.
- **Idempotency:** For booking_created, one row per booking (idempotent by booking_id in metadata or link_id).
- **Performance:** Notifications table kept lean; index by team_id + created_at. Deadline derivation can be cached (e.g. 5–15 min) if needed.
- **Audit:** Writing to `notifications` is separate from audit logs; audit logs stay as-is for compliance. Notifications are for “what to show in the UI”.

---

## 8. Summary

| Item | Recommendation |
|------|----------------|
| **Scope (Phase 1)** | Booking created, contract deadlines (upcoming/overdue), keep PTO. |
| **Data** | New `notifications` table for events (e.g. booking_created). Contract deadlines derived at read time (no duplicate rows). |
| **UI** | Current bell + dropdown as main entry; add “See all” page. |
| **Delivery** | In-app only first; email/digest later. |
| **Reuse** | Header dropdown, `DeadlineAlertService`, team RLS. |

Next step: agree on this scope and then implement Phase 1 (table + booking_created write + deadline derivation + Header dropdown merge + optional “See all” page).
