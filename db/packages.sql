create table public.events (
  id uuid not null default gen_random_uuid (),
  sport_id uuid null,
  name text not null,
  location text null,
  start_date date null,
  end_date date null,
  venue_id uuid null,
  updated_at timestamp with time zone null default now(),
  event_image jsonb null,
  primary_consultant_id uuid null,
  is_provisional boolean not null default true,
  status text null default 'Coming Soon'::text,
  active boolean null,
  hide_b2b boolean null default false,
  team_id uuid not null default '0cef0867-1b40-4de1-9936-16b867a753d7'::uuid,
  constraint events_pkey primary key (id),
  constraint events_primary_consultant_id_fkey foreign KEY (primary_consultant_id) references team_members (id),
  constraint events_sport_id_fkey foreign KEY (sport_id) references sports (id) on delete CASCADE,
  constraint events_team_id_fkey foreign KEY (team_id) references teams (id) on delete CASCADE,
  constraint events_venue_id_fkey foreign KEY (venue_id) references venues (id) on delete set null,
  constraint events_status_check check (
    (
      status = any (
        array[
          'Sales Open'::text,
          'Sales Closed'::text,
          'Coming Soon'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_events_status on public.events using btree (status) TABLESPACE pg_default;

create index IF not exists idx_events_primary_consultant on public.events using btree (primary_consultant_id) TABLESPACE pg_default;

create index IF not exists idx_events_team_id on public.events using btree (team_id) TABLESPACE pg_default;

create index IF not exists idx_events_team_status on public.events using btree (team_id, status) TABLESPACE pg_default;

create trigger trg_create_system_reports_on_event_creation
after INSERT on events for EACH row
execute FUNCTION trigger_create_system_reports_for_event ();

create table public.packages (
  id uuid not null default gen_random_uuid (),
  event_id uuid null,
  name text not null,
  slug text null,
  description text null,
  base_type text null,
  active boolean null default true,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  package_image jsonb null,
  status text null default 'Coming Soon'::text,
  team_id uuid not null default '0cef0867-1b40-4de1-9936-16b867a753d7'::uuid,
  constraint packages_pkey primary key (id),
  constraint packages_slug_key unique (slug),
  constraint packages_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint packages_team_id_fkey foreign KEY (team_id) references teams (id) on delete CASCADE,
  constraint packages_base_type_check check (
    (
      base_type = any (array['Grandstand'::text, 'VIP'::text])
    )
  ),
  constraint packages_status_check check (
    (
      status = any (
        array[
          'Sales Open'::text,
          'Sales Closed'::text,
          'Coming Soon'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_packages_status on public.packages using btree (status) TABLESPACE pg_default;

create index IF not exists idx_packages_event_id on public.packages using btree (event_id) TABLESPACE pg_default;

create index IF not exists idx_packages_team_id on public.packages using btree (team_id) TABLESPACE pg_default;

create index IF not exists idx_packages_team_event on public.packages using btree (team_id, event_id) TABLESPACE pg_default;

create trigger trigger_update_event_status_on_package_delete
after DELETE on packages for EACH row
execute FUNCTION update_event_status ();

create trigger trigger_update_event_status_on_package_insert
after INSERT on packages for EACH row
execute FUNCTION update_event_status ();

create trigger trigger_update_event_status_on_package_update
after
update on packages for EACH row when (old.status is distinct from new.status)
execute FUNCTION update_event_status ();

create table public.package_tiers (
  id uuid not null default gen_random_uuid (),
  package_id uuid null,
  name text not null,
  description text null,
  price_override numeric(10, 2) null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  short_label text null,
  display_order integer null,
  status text null default 'Coming Soon'::text,
  constraint package_tiers_pkey primary key (id),
  constraint package_tiers_package_id_fkey foreign KEY (package_id) references packages (id) on delete CASCADE,
  constraint package_tiers_status_check check (
    (
      status = any (
        array[
          'Sales Open'::text,
          'Sales Closed'::text,
          'Coming Soon'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_package_tiers_status on public.package_tiers using btree (status) TABLESPACE pg_default;

create index IF not exists idx_package_tiers_package_id on public.package_tiers using btree (package_id) TABLESPACE pg_default;

create trigger trigger_update_package_status_on_tier_delete
after DELETE on package_tiers for EACH row
execute FUNCTION update_package_status ();

create trigger trigger_update_package_status_on_tier_insert
after INSERT on package_tiers for EACH row
execute FUNCTION update_package_status ();

create trigger trigger_update_package_status_on_tier_update
after
update on package_tiers for EACH row when (old.status is distinct from new.status)
execute FUNCTION update_package_status ();

create table public.package_components (
  id uuid not null default gen_random_uuid (),
  tier_id uuid not null,
  event_id uuid not null,
  component_type text not null,
  component_id uuid not null,
  default_quantity integer null default 1,
  price_override numeric(10, 2) null,
  notes text null,
  constraint package_components_pkey primary key (id),
  constraint package_components_id_key unique (id),
  constraint package_components_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint package_components_tier_id_fkey foreign KEY (tier_id) references package_tiers (id) on delete CASCADE,
  constraint package_components_component_type_check check (
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


create table public.venues (
  id uuid not null default gen_random_uuid (),
  name text not null,
  slug text null,
  country text null,
  city text null,
  timezone text null,
  latitude numeric(9, 6) null,
  longitude numeric(9, 6) null,
  description text null,
  images jsonb null,
  website text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  map_img jsonb null,
  constraint venues_pkey primary key (id),
  constraint venues_slug_key unique (slug)
) TABLESPACE pg_default;

create table public.ticket_categories (
  id uuid not null default gen_random_uuid (),
  category_name text not null,
  venue_id text null,
  sport_type text null,
  category_type text null,
  description jsonb null,
  options jsonb null,
  ticket_delivery_days integer null,
  media_files jsonb null,
  created_at timestamp without time zone null default now(),
  features text[] null default '{}'::text[],
  constraint ticket_categories_pkey primary key (id),
  constraint ticket_categories_features_max_length check ((array_length(features, 1) <= 6))
) TABLESPACE pg_default;
create table public.tickets (
  id uuid not null default gen_random_uuid (),
  event_id uuid not null,
  ticket_category_id uuid null,
  quantity_total integer not null,
  quantity_reserved integer not null default 0,
  price numeric(10, 2) not null,
  markup_percent numeric(5, 2) null default 0.00,
  price_with_markup numeric GENERATED ALWAYS as (
    (
      price + ((price * markup_percent) / (100)::numeric)
    )
  ) STORED (10, 2) null,
  currency text not null default 'EUR'::text,
  ticket_type text null,
  refundable boolean null default false,
  resellable boolean null default false,
  supplier text null,
  supplier_ref text null,
  ordered boolean null default false,
  ordered_at timestamp without time zone null,
  paid boolean null default false,
  paid_at timestamp without time zone null,
  tickets_received boolean null default false,
  tickets_received_at timestamp without time zone null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  metadata jsonb null,
  supplier_currency text null default 'EUR'::text,
  supplier_price numeric(10, 2) null,
  price_gbp numeric GENERATED ALWAYS as (
    (
      supplier_price + (
        (supplier_price * markup_percent) / (100)::numeric
      )
    )
  ) STORED (10, 2) null,
  ticket_days text null,
  active boolean null default true,
  is_provisional boolean not null default false,
  quantity_available integer GENERATED ALWAYS as (
    case
      when is_provisional then 0
      else (quantity_total - quantity_reserved)
    end
  ) STORED null,
  team_id uuid not null default '0cef0867-1b40-4de1-9936-16b867a753d7'::uuid,
  constraint tickets_pkey primary key (id),
  constraint tickets_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint tickets_team_id_fkey foreign KEY (team_id) references teams (id) on delete CASCADE,
  constraint tickets_ticket_category_id_fkey foreign KEY (ticket_category_id) references ticket_categories (id) on delete set null,
  constraint tickets_quantity_reserved_check check ((quantity_reserved >= 0)),
  constraint tickets_quantity_total_check check ((quantity_total >= 0)),
  constraint tickets_markup_percent_check check ((markup_percent >= (0)::numeric)),
  constraint tickets_price_check check ((price >= (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_tickets_team_id on public.tickets using btree (team_id) TABLESPACE pg_default;

create index IF not exists idx_tickets_team_event on public.tickets using btree (team_id, event_id) TABLESPACE pg_default;

create index IF not exists idx_tickets_team_active on public.tickets using btree (team_id, active) TABLESPACE pg_default;

create trigger audit_tickets_qty_trg
after INSERT
or
update on tickets for EACH row
execute FUNCTION audit_tickets_qty ();

create trigger trigger_broadcast_tickets_changes
after
update on tickets for EACH row
execute FUNCTION broadcast_inventory_change ();

create trigger trigger_broadcast_tickets_insert
after INSERT on tickets for EACH row
execute FUNCTION broadcast_inventory_change ();
create table public.hotel_rooms (
  id uuid not null default gen_random_uuid (),
  hotel_id uuid not null,
  room_type_id text not null,
  event_id uuid null,
  check_in date not null,
  check_out date not null,
  quantity_total integer not null,
  quantity_reserved integer null default 0,
  supplier_price_per_night numeric(10, 2) null,
  supplier_currency text null default 'EUR'::text,
  markup_percent numeric(5, 2) null default 0.00,
  vat_percentage numeric(5, 2) null,
  resort_fee numeric(10, 2) null,
  resort_fee_type text null default 'per_night'::text,
  city_tax numeric(10, 2) null,
  city_tax_type text null default 'per_person_per_night'::text,
  extra_night_markup_percent numeric(5, 2) null,
  contracted boolean null default false,
  attrition_deadline date null,
  release_allowed_percent numeric(5, 2) null,
  penalty_terms text null,
  supplier text null,
  supplier_ref text null,
  contract_file_path text null,
  active boolean null default true,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  max_people integer null,
  total_supplier_price_per_night numeric(10, 2) null,
  total_price_per_night_gbp numeric(10, 2) null,
  total_price_per_stay_gbp numeric(10, 2) null,
  total_price_per_night_gbp_with_markup numeric GENERATED ALWAYS as (
    (
      total_price_per_night_gbp + (
        (total_price_per_night_gbp * markup_percent) / (100)::numeric
      )
    )
  ) STORED (10, 2) null,
  total_price_per_stay_gbp_with_markup numeric GENERATED ALWAYS as (
    (
      total_price_per_stay_gbp + (
        (total_price_per_stay_gbp * markup_percent) / (100)::numeric
      )
    )
  ) STORED (10, 2) null,
  is_provisional boolean not null default false,
  quantity_available integer GENERATED ALWAYS as (
    case
      when is_provisional then 0
      else (quantity_total - quantity_reserved)
    end
  ) STORED null,
  bed_type text null default 'Double Room'::text,
  commission_percent numeric(5, 2) null default 0.00,
  flexibility text not null default 'Flex'::text,
  board_type text not null default 'Bed & Breakfast'::text,
  board_price_per_person_per_night numeric(10, 2) null,
  extra_night_cost numeric null,
  contract_id uuid null,
  extra_night_price_gbp numeric GENERATED ALWAYS as (
    (
      extra_night_cost * (
        (1)::numeric + (extra_night_markup_percent / (100)::numeric)
      )
    )
  ) STORED (10, 2) null,
  team_id uuid not null default '0cef0867-1b40-4de1-9936-16b867a753d7'::uuid,
  constraint hotel_rooms_pkey primary key (id),
  constraint hotel_rooms_hotel_id_fkey foreign KEY (hotel_id) references gpgt_hotels (id) on delete CASCADE,
  constraint hotel_rooms_team_id_fkey foreign KEY (team_id) references teams (id) on delete CASCADE,
  constraint hotel_rooms_event_id_fkey foreign KEY (event_id) references events (id),
  constraint hotel_rooms_contract_id_fkey foreign KEY (contract_id) references hotel_contracts (id) on delete set null,
  constraint hotel_rooms_flexibility_check check (
    (
      flexibility = any (array['Flex'::text, 'Non Flex'::text])
    )
  ),
  constraint hotel_rooms_commission_percent_check check ((commission_percent >= (0)::numeric)),
  constraint hotel_rooms_board_type_check check (
    (
      board_type = any (
        array[
          'Room Only'::text,
          'Bed & Breakfast'::text,
          'Half Board'::text,
          'Full Board'::text,
          'All Inclusive'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_hotel_rooms_contract_id on public.hotel_rooms using btree (contract_id) TABLESPACE pg_default;

create index IF not exists idx_hotel_rooms_team_id on public.hotel_rooms using btree (team_id) TABLESPACE pg_default;

create index IF not exists idx_hotel_rooms_team_hotel on public.hotel_rooms using btree (team_id, hotel_id) TABLESPACE pg_default;

create index IF not exists idx_hotel_rooms_team_event on public.hotel_rooms using btree (team_id, event_id) TABLESPACE pg_default;

create trigger audit_hotel_rooms_qty_trg
after INSERT
or
update on hotel_rooms for EACH row
execute FUNCTION audit_hotel_rooms_qty ();

create trigger trigger_broadcast_hotel_rooms_changes
after
update on hotel_rooms for EACH row
execute FUNCTION broadcast_inventory_change ();

create trigger trigger_broadcast_hotel_rooms_insert
after INSERT on hotel_rooms for EACH row
execute FUNCTION broadcast_inventory_change ();

create table public.gpgt_hotels (
  id uuid not null default gen_random_uuid (),
  name text not null,
  brand text null,
  star_rating integer null,
  address text null,
  city text null,
  country text null,
  latitude numeric null,
  longitude numeric null,
  description text null,
  images jsonb null,
  amenities jsonb null,
  check_in_time time without time zone null,
  check_out_time time without time zone null,
  contact_email text null,
  phone text null,
  room_types jsonb null,
  created_at timestamp without time zone null default now(),
  team_id uuid not null default '0cef0867-1b40-4de1-9936-16b867a753d7'::uuid,
  constraint gpgt_hotels_pkey primary key (id),
  constraint gpgt_hotels_team_id_fkey foreign KEY (team_id) references teams (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_gpgt_hotels_team_id on public.gpgt_hotels using btree (team_id) TABLESPACE pg_default;

create index IF not exists idx_gpgt_hotels_team_city on public.gpgt_hotels using btree (team_id, city) TABLESPACE pg_default;

create table public.extras (
  id uuid not null default gen_random_uuid (),
  team_id uuid not null,
  event_id uuid not null,
  extra_type text not null,
  name text not null,
  description text null,
  cost numeric(10, 2) not null,
  markup numeric(5, 2) not null,
  currency text null default 'GBP'::text,
  is_active boolean null default true,
  notes text null,
  max_quantity integer null,
  quantity_used integer null default 0,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  sell_price numeric GENERATED ALWAYS as (
    round(
      (cost * ((1)::numeric + (markup / (100)::numeric))),
      2
    )
  ) STORED null,
  constraint extras_pkey primary key (id),
  constraint extras_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint extras_team_id_fkey foreign KEY (team_id) references teams (id) on delete CASCADE,
  constraint extras_markup_check check ((markup >= (0)::numeric)),
  constraint extras_cost_check check ((cost >= (0)::numeric)),
  constraint extras_quantity_used_check check ((quantity_used >= 0)),
  constraint extras_type_check check (
    (
      extra_type = any (
        array[
          'lounge_pass'::text,
          'meet_greet'::text,
          'pit_lane_walk'::text,
          'hospitality'::text,
          'parking'::text,
          'transport'::text,
          'accommodation'::text,
          'other'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_extras_team_id on public.extras using btree (team_id) TABLESPACE pg_default;

create index IF not exists idx_extras_event_id on public.extras using btree (event_id) TABLESPACE pg_default;

create index IF not exists idx_extras_extra_type on public.extras using btree (extra_type) TABLESPACE pg_default;

create index IF not exists idx_extras_is_active on public.extras using btree (is_active) TABLESPACE pg_default;

create trigger trigger_broadcast_extras_changes
after
update on extras for EACH row
execute FUNCTION broadcast_inventory_change ();

create trigger trigger_broadcast_extras_insert
after INSERT on extras for EACH row
execute FUNCTION broadcast_inventory_change ();

create trigger trigger_update_extras_updated_at BEFORE
update on extras for EACH row
execute FUNCTION update_extras_updated_at ();

create table public.extras (
  id uuid not null default gen_random_uuid (),
  team_id uuid not null,
  event_id uuid not null,
  extra_type text not null,
  name text not null,
  description text null,
  cost numeric(10, 2) not null,
  markup numeric(5, 2) not null,
  currency text null default 'GBP'::text,
  is_active boolean null default true,
  notes text null,
  max_quantity integer null,
  quantity_used integer null default 0,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  sell_price numeric GENERATED ALWAYS as (
    round(
      (cost * ((1)::numeric + (markup / (100)::numeric))),
      2
    )
  ) STORED null,
  constraint extras_pkey primary key (id),
  constraint extras_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint extras_team_id_fkey foreign KEY (team_id) references teams (id) on delete CASCADE,
  constraint extras_markup_check check ((markup >= (0)::numeric)),
  constraint extras_cost_check check ((cost >= (0)::numeric)),
  constraint extras_quantity_used_check check ((quantity_used >= 0)),
  constraint extras_type_check check (
    (
      extra_type = any (
        array[
          'lounge_pass'::text,
          'meet_greet'::text,
          'pit_lane_walk'::text,
          'hospitality'::text,
          'parking'::text,
          'transport'::text,
          'accommodation'::text,
          'other'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_extras_team_id on public.extras using btree (team_id) TABLESPACE pg_default;

create index IF not exists idx_extras_event_id on public.extras using btree (event_id) TABLESPACE pg_default;

create index IF not exists idx_extras_extra_type on public.extras using btree (extra_type) TABLESPACE pg_default;

create index IF not exists idx_extras_is_active on public.extras using btree (is_active) TABLESPACE pg_default;

create trigger trigger_broadcast_extras_changes
after
update on extras for EACH row
execute FUNCTION broadcast_inventory_change ();

create trigger trigger_broadcast_extras_insert
after INSERT on extras for EACH row
execute FUNCTION broadcast_inventory_change ();

create trigger trigger_update_extras_updated_at BEFORE
update on extras for EACH row
execute FUNCTION update_extras_updated_at ();

create table public.extras (
  id uuid not null default gen_random_uuid (),
  team_id uuid not null,
  event_id uuid not null,
  extra_type text not null,
  name text not null,
  description text null,
  cost numeric(10, 2) not null,
  markup numeric(5, 2) not null,
  currency text null default 'GBP'::text,
  is_active boolean null default true,
  notes text null,
  max_quantity integer null,
  quantity_used integer null default 0,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  sell_price numeric GENERATED ALWAYS as (
    round(
      (cost * ((1)::numeric + (markup / (100)::numeric))),
      2
    )
  ) STORED null,
  constraint extras_pkey primary key (id),
  constraint extras_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint extras_team_id_fkey foreign KEY (team_id) references teams (id) on delete CASCADE,
  constraint extras_markup_check check ((markup >= (0)::numeric)),
  constraint extras_cost_check check ((cost >= (0)::numeric)),
  constraint extras_quantity_used_check check ((quantity_used >= 0)),
  constraint extras_type_check check (
    (
      extra_type = any (
        array[
          'lounge_pass'::text,
          'meet_greet'::text,
          'pit_lane_walk'::text,
          'hospitality'::text,
          'parking'::text,
          'transport'::text,
          'accommodation'::text,
          'other'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_extras_team_id on public.extras using btree (team_id) TABLESPACE pg_default;

create index IF not exists idx_extras_event_id on public.extras using btree (event_id) TABLESPACE pg_default;

create index IF not exists idx_extras_extra_type on public.extras using btree (extra_type) TABLESPACE pg_default;

create index IF not exists idx_extras_is_active on public.extras using btree (is_active) TABLESPACE pg_default;

create trigger trigger_broadcast_extras_changes
after
update on extras for EACH row
execute FUNCTION broadcast_inventory_change ();

create trigger trigger_broadcast_extras_insert
after INSERT on extras for EACH row
execute FUNCTION broadcast_inventory_change ();

create trigger trigger_update_extras_updated_at BEFORE
update on extras for EACH row
execute FUNCTION update_extras_updated_at ();