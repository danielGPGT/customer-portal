create table public.clients (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  team_id uuid null,
  first_name text not null,
  last_name text not null,
  email text null,
  phone text null,
  company text null,
  job_title text null,
  date_of_birth date null,
  passport_number text null,
  nationality text null,
  preferred_language text null default 'English'::text,
  address jsonb null,
  preferences jsonb null,
  notes text null,
  status text null default 'active'::text,
  source text null,
  tags text[] null default '{}'::text[],
  budget_preference jsonb null,
  payment_preference text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  last_contact_at timestamp with time zone null,
  search_vector tsvector null,
  hubspot_contact_id text null,
  acquisition text null,
  original_source text null,
  properties jsonb not null default '{}'::jsonb,
  points_balance integer not null default 0,
  lifetime_points_earned integer not null default 0,
  lifetime_points_spent integer not null default 0,
  loyalty_enrolled boolean null,
  loyalty_enrolled_at timestamp with time zone null,
  loyalty_signup_source text null,
  first_loyalty_booking_at timestamp with time zone null,
  referral_code text null,
  auth_user_id uuid null,
  constraint clients_pkey primary key (id),
  constraint clients_email_key unique (email),
  constraint clients_referral_code_key unique (referral_code),
  constraint clients_auth_user_id_fkey foreign KEY (auth_user_id) references auth.users (id) on delete set null,
  constraint clients_team_id_fkey foreign KEY (team_id) references teams (id),
  constraint clients_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint clients_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'inactive'::text,
          'prospect'::text,
          'vip'::text
        ]
      )
    )
  ),
  constraint clients_points_balance_check check ((points_balance >= 0)),
  constraint clients_loyalty_signup_source_check check (
    (
      loyalty_signup_source = any (
        array[
          'referral'::text,
          'auto_enrolled'::text,
          'self_signup'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_clients_acquisition on public.clients using btree (acquisition) TABLESPACE pg_default;

create index IF not exists idx_clients_original_source on public.clients using btree (original_source) TABLESPACE pg_default;

create index IF not exists idx_clients_referral_code on public.clients using btree (referral_code) TABLESPACE pg_default
where
  (referral_code is not null);

create index IF not exists idx_clients_loyalty_enrolled on public.clients using btree (loyalty_enrolled) TABLESPACE pg_default
where
  (loyalty_enrolled = true);

create index IF not exists clients_search_vector_idx on public.clients using gin (search_vector) TABLESPACE pg_default;

create index IF not exists idx_clients_hubspot_contact_id on public.clients using btree (hubspot_contact_id) TABLESPACE pg_default;

create unique INDEX IF not exists idx_clients_team_hubspot_contact_id on public.clients using btree (team_id, hubspot_contact_id) TABLESPACE pg_default
where
  (hubspot_contact_id is not null);

create index IF not exists idx_clients_team_email on public.clients using btree (team_id, email) TABLESPACE pg_default
where
  (email is not null);

create index IF not exists idx_clients_points_balance on public.clients using btree (points_balance) TABLESPACE pg_default
where
  (loyalty_enrolled = true);

create index IF not exists idx_clients_loyalty_enrolled_at on public.clients using btree (loyalty_enrolled_at) TABLESPACE pg_default;

create index IF not exists idx_clients_properties_gin on public.clients using gin (properties) TABLESPACE pg_default;

create index IF not exists idx_clients_auth_user_id on public.clients using btree (auth_user_id) TABLESPACE pg_default
where
  (auth_user_id is not null);

create trigger clients_enqueue_klaviyo_ins
after INSERT on clients for EACH row
execute FUNCTION trg_clients_enqueue_klaviyo ();

create trigger clients_enqueue_klaviyo_upd
after
update OF email,
first_name,
last_name,
phone,
properties on clients for EACH row
execute FUNCTION trg_clients_enqueue_klaviyo ();

create trigger on_client_created
after INSERT
or
update OF user_id on clients for EACH row
execute FUNCTION grant_client_portal_access ();

create trigger trigger_hubspot_sync_clients_insert
after INSERT on clients for EACH row
execute FUNCTION queue_hubspot_sync ();

create trigger trigger_hubspot_sync_clients_update
after
update on clients for EACH row
execute FUNCTION queue_hubspot_sync ();

create trigger update_client_search_vector_trigger BEFORE INSERT
or
update on clients for EACH row
execute FUNCTION update_client_search_vector ();


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
