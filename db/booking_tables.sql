
create table public.bookings (
  id uuid not null default gen_random_uuid (),
  booking_reference text not null,
  quote_id uuid null,
  parent_quote_id uuid null,
  quote_version integer null,
  event_id uuid null,
  client_id uuid null,
  consultant_id uuid null,
  user_id uuid null,
  team_id uuid null,
  status text not null,
  total_price numeric(10, 2) not null,
  currency text null default 'GBP'::text,
  payment_schedule_snapshot jsonb null,
  package_snapshot jsonb null,
  provisional_expires_at timestamp with time zone null,
  provisional_reason text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  deleted_at timestamp with time zone null,
  lead_traveler_id uuid null,
  booking_type character varying(32) not null default 'actual'::character varying,
  protection_scheme text not null default 'none'::text,
  booking_notes text null,
  internal_notes text null,
  special_requests text null,
  package_type text null,
  payment_status text null default 'pending'::text,
  confirmed_at timestamp with time zone null,
  cancelled_at timestamp with time zone null,
  acquisition_source_id uuid null,
  commission_payable boolean null default false,
  commission_amount numeric(10, 2) null default 0,
  commission_paid boolean null default false,
  exchange_rate numeric(10, 6) null default 1.000000,
  points_earned integer null default 0,
  points_used integer null default 0,
  discount_applied numeric(10, 2) null default 0,
  is_first_loyalty_booking boolean null default false,
  earn_transaction_id uuid null,
  spend_transaction_id uuid null,
  constraint bookings_pkey primary key (id),
  constraint bookings_booking_reference_key unique (booking_reference),
  constraint bookings_earn_transaction_id_fkey foreign KEY (earn_transaction_id) references loyalty_transactions (id),
  constraint bookings_team_id_fkey foreign KEY (team_id) references teams (id),
  constraint bookings_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint bookings_acquisition_source_id_fkey foreign KEY (acquisition_source_id) references acquisition_sources (id),
  constraint bookings_quote_id_fkey foreign KEY (quote_id) references quotes (id),
  constraint bookings_lead_traveler_id_fkey foreign KEY (lead_traveler_id) references booking_travelers (id),
  constraint bookings_parent_quote_id_fkey foreign KEY (parent_quote_id) references quotes (id),
  constraint bookings_client_id_fkey foreign KEY (client_id) references clients (id),
  constraint bookings_consultant_id_fkey foreign KEY (consultant_id) references team_members (id),
  constraint bookings_event_id_fkey foreign KEY (event_id) references events (id),
  constraint bookings_spend_transaction_id_fkey foreign KEY (spend_transaction_id) references loyalty_transactions (id),
  constraint protection_scheme_check check (
    (
      protection_scheme = any (array['ATOL'::text, 'ABTOT'::text, 'none'::text])
    )
  ),
  constraint bookings_discount_applied_check check ((discount_applied >= (0)::numeric)),
  constraint bookings_payment_status_check check (
    (
      payment_status = any (
        array[
          'pending'::text,
          'partial'::text,
          'paid'::text,
          'overdue'::text,
          'partial_refund'::text,
          'refunded'::text
        ]
      )
    )
  ),
  constraint bookings_points_earned_check check ((points_earned >= 0)),
  constraint bookings_points_used_check check ((points_used >= 0)),
  constraint bookings_status_check check (
    (
      status = any (
        array[
          'draft'::text,
          'provisional'::text,
          'pending_payment'::text,
          'confirmed'::text,
          'cancelled'::text,
          'completed'::text,
          'refunded'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_bookings_quote_id on public.bookings using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_status on public.bookings using btree (status) TABLESPACE pg_default;

create index IF not exists idx_bookings_client_id on public.bookings using btree (client_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_team_id on public.bookings using btree (team_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_team_status on public.bookings using btree (team_id, status) TABLESPACE pg_default;

create index IF not exists idx_bookings_event_status on public.bookings using btree (event_id, status) TABLESPACE pg_default;

create index IF not exists idx_bookings_provisional_expires_at on public.bookings using btree (provisional_expires_at) TABLESPACE pg_default;

create index IF not exists idx_bookings_package_type on public.bookings using btree (package_type) TABLESPACE pg_default;

create index IF not exists idx_bookings_payment_status on public.bookings using btree (payment_status) TABLESPACE pg_default;

create index IF not exists idx_bookings_status_payment_status on public.bookings using btree (status, payment_status) TABLESPACE pg_default;

create index IF not exists idx_bookings_confirmed_at on public.bookings using btree (confirmed_at) TABLESPACE pg_default;

create index IF not exists idx_bookings_cancelled_at on public.bookings using btree (cancelled_at) TABLESPACE pg_default;

create index IF not exists idx_bookings_exchange_rate on public.bookings using btree (exchange_rate) TABLESPACE pg_default;

create index IF not exists idx_bookings_deleted_at on public.bookings using btree (deleted_at) TABLESPACE pg_default;

create index IF not exists idx_bookings_acquisition_source_id on public.bookings using btree (acquisition_source_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_commission_payable on public.bookings using btree (commission_payable) TABLESPACE pg_default;

create index IF not exists idx_bookings_commission_paid on public.bookings using btree (commission_paid) TABLESPACE pg_default;

create index IF not exists idx_bookings_points_earned on public.bookings using btree (points_earned) TABLESPACE pg_default
where
  (points_earned > 0);

create index IF not exists idx_bookings_points_used on public.bookings using btree (points_used) TABLESPACE pg_default
where
  (points_used > 0);

create index IF not exists idx_bookings_is_first_loyalty_booking on public.bookings using btree (is_first_loyalty_booking) TABLESPACE pg_default
where
  (is_first_loyalty_booking = true);

create index IF not exists idx_bookings_earn_transaction_id on public.bookings using btree (earn_transaction_id) TABLESPACE pg_default
where
  (earn_transaction_id is not null);

create index IF not exists idx_bookings_spend_transaction_id on public.bookings using btree (spend_transaction_id) TABLESPACE pg_default
where
  (spend_transaction_id is not null);

create index IF not exists idx_bookings_id_deleted on public.bookings using btree (id) TABLESPACE pg_default
where
  (deleted_at is null);

create trigger booking_status_change
after
update OF status on bookings for EACH row when (old.status is distinct from new.status)
execute FUNCTION handle_booking_status_change ();

create trigger bookings_cancel_release_inventory_trg
after
update on bookings for EACH row
execute FUNCTION bookings_cancel_release_inventory_trg_fn ();

create trigger trigger_auto_generate_itinerary
after INSERT on bookings for EACH row
execute FUNCTION auto_generate_itinerary_from_booking ();

create trigger trigger_booking_version_creation
after
update on bookings for EACH row
execute FUNCTION trigger_booking_version_creation ();

create trigger trigger_set_booking_package_type BEFORE INSERT
or
update on bookings for EACH row
execute FUNCTION set_booking_package_type ();

create table public.booking_payments (
  id uuid not null default gen_random_uuid (),
  booking_id uuid not null,
  payment_type text not null,
  payment_number integer not null,
  amount numeric(10, 2) not null,
  currency text null default 'GBP'::text,
  due_date date null,
  paid boolean not null default false,
  paid_at timestamp with time zone null,
  payment_reference text null,
  payment_method text null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  deleted_at timestamp with time zone null,
  xero_invoice_id text null,
  xero_invoice_number text null,
  xero_synced_at timestamp with time zone null,
  xero_sync_status text null default 'pending'::text,
  xero_last_synced_amount numeric null,
  xero_last_synced_due_date date null,
  xero_last_synced_description text null,
  xero_tracking_overrides jsonb null,
  xero_sync_error text null,
  xero_sync_payload jsonb null,
  refunded boolean null default false,
  refunded_at timestamp with time zone null,
  refund_amount numeric null,
  refund_reason text null,
  constraint booking_payments_pkey primary key (id),
  constraint booking_payments_booking_id_fkey foreign KEY (booking_id) references bookings (id) on delete CASCADE,
  constraint booking_payments_payment_type_check check (
    (
      payment_type = any (
        array[
          'deposit'::text,
          'second_payment'::text,
          'third_payment'::text,
          'final_payment'::text,
          'additional'::text,
          'refund'::text
        ]
      )
    )
  ),
  constraint booking_payments_xero_sync_status_check check (
    (
      xero_sync_status = any (
        array[
          'pending'::text,
          'pending_edit'::text,
          'synced'::text,
          'failed'::text,
          'ignored'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_booking_payments_booking_id on public.booking_payments using btree (booking_id) TABLESPACE pg_default;

create index IF not exists idx_booking_payments_status_due_date on public.booking_payments using btree (paid, due_date) TABLESPACE pg_default;

create index IF not exists idx_booking_payments_xero_invoice_id on public.booking_payments using btree (xero_invoice_id) TABLESPACE pg_default;

create index IF not exists idx_booking_payments_xero_sync_status on public.booking_payments using btree (xero_sync_status) TABLESPACE pg_default;

create index IF not exists idx_booking_payments_refunded on public.booking_payments using btree (refunded) TABLESPACE pg_default;

create trigger update_booking_payment_status_trigger
after INSERT
or DELETE
or
update on booking_payments for EACH row
execute FUNCTION trigger_update_booking_payment_status ();

create table public.booking_components (
  id uuid not null default gen_random_uuid (),
  booking_id uuid not null,
  component_type text not null,
  component_id uuid null,
  component_name text null,
  quantity integer null,
  unit_price numeric(10, 2) null,
  total_price numeric(10, 2) null,
  component_data jsonb null,
  component_snapshot jsonb null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  deleted_at timestamp with time zone null,
  constraint booking_components_pkey primary key (id),
  constraint booking_components_booking_id_fkey foreign KEY (booking_id) references bookings (id) on delete CASCADE,
  constraint booking_components_component_type_check check (
    (
      component_type = any (
        array[
          'ticket'::text,
          'hotel_room'::text,
          'circuit_transfer'::text,
          'airport_transfer'::text,
          'flight'::text,
          'extra'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_booking_components_booking_id on public.booking_components using btree (booking_id) TABLESPACE pg_default;

create index IF not exists idx_booking_components_component_type on public.booking_components using btree (component_type) TABLESPACE pg_default;

create trigger auto_assign_travelers_on_insert BEFORE INSERT on booking_components for EACH row when (new.component_type = 'hotel_room'::text)
execute FUNCTION trigger_auto_assign_travelers_on_insert ();

create trigger auto_assign_travelers_on_update BEFORE
update on booking_components for EACH row when (new.component_type = 'hotel_room'::text)
execute FUNCTION trigger_auto_assign_travelers_on_update ();

create trigger booking_components_inventory_trg
after INSERT
or DELETE
or
update on booking_components for EACH row
execute FUNCTION booking_components_inventory_trg_fn ();

create trigger booking_components_normalize_trg BEFORE
update on booking_components for EACH row
execute FUNCTION booking_components_normalize_trg_fn ();

create trigger generate_room_nights_on_insert
after INSERT on booking_components for EACH row when (new.component_type = 'hotel_room'::text)
execute FUNCTION trigger_generate_room_nights_on_insert ();

create trigger sync_room_nights_on_update
after
update on booking_components for EACH row when (new.component_type = 'hotel_room'::text)
execute FUNCTION trigger_sync_room_nights_on_update ();

create table public.booking_components (
  id uuid not null default gen_random_uuid (),
  booking_id uuid not null,
  component_type text not null,
  component_id uuid null,
  component_name text null,
  quantity integer null,
  unit_price numeric(10, 2) null,
  total_price numeric(10, 2) null,
  component_data jsonb null,
  component_snapshot jsonb null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  deleted_at timestamp with time zone null,
  constraint booking_components_pkey primary key (id),
  constraint booking_components_booking_id_fkey foreign KEY (booking_id) references bookings (id) on delete CASCADE,
  constraint booking_components_component_type_check check (
    (
      component_type = any (
        array[
          'ticket'::text,
          'hotel_room'::text,
          'circuit_transfer'::text,
          'airport_transfer'::text,
          'flight'::text,
          'extra'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_booking_components_booking_id on public.booking_components using btree (booking_id) TABLESPACE pg_default;

create index IF not exists idx_booking_components_component_type on public.booking_components using btree (component_type) TABLESPACE pg_default;

create trigger auto_assign_travelers_on_insert BEFORE INSERT on booking_components for EACH row when (new.component_type = 'hotel_room'::text)
execute FUNCTION trigger_auto_assign_travelers_on_insert ();

create trigger auto_assign_travelers_on_update BEFORE
update on booking_components for EACH row when (new.component_type = 'hotel_room'::text)
execute FUNCTION trigger_auto_assign_travelers_on_update ();

create trigger booking_components_inventory_trg
after INSERT
or DELETE
or
update on booking_components for EACH row
execute FUNCTION booking_components_inventory_trg_fn ();

create trigger booking_components_normalize_trg BEFORE
update on booking_components for EACH row
execute FUNCTION booking_components_normalize_trg_fn ();

create trigger generate_room_nights_on_insert
after INSERT on booking_components for EACH row when (new.component_type = 'hotel_room'::text)
execute FUNCTION trigger_generate_room_nights_on_insert ();

create trigger sync_room_nights_on_update
after
update on booking_components for EACH row when (new.component_type = 'hotel_room'::text)
execute FUNCTION trigger_sync_room_nights_on_update ();