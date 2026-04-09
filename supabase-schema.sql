-- Natural Heaven Hotel — Supabase Schema (v2)
-- Run this FULL script in your Supabase SQL Editor
-- Safe to re-run: uses IF NOT EXISTS / DO blocks

-- ─────────────────────────────────────────────
-- 1. ROOMS
-- ─────────────────────────────────────────────
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  room_number text not null unique,
  room_type text not null check (room_type in ('non_ac_standard', 'non_ac_deluxe', 'ac_standard', 'ac_deluxe')),
  floor integer default 1,
  base_rate numeric not null default 1000,
  default_deposit numeric not null default 500,
  status text not null default 'vacant' check (status in ('vacant', 'occupied', 'cleaning', 'maintenance')),
  description text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- 2. GUESTS  (+ is_mobile_verified column)
-- ─────────────────────────────────────────────
create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  mobile text not null,
  is_mobile_verified boolean not null default false,
  address text not null,
  city text,
  state text,
  id_type text not null check (id_type in ('aadhaar', 'pan', 'passport', 'driving_license', 'voter_id')),
  id_number text not null,
  id_document_url text,
  live_photo_url text,
  created_at timestamptz default now()
);

-- Migrate existing rows that lack the column
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name='guests' and column_name='is_mobile_verified'
  ) then
    alter table guests add column is_mobile_verified boolean not null default false;
  end if;
end $$;

-- ─────────────────────────────────────────────
-- 3. OTP VERIFICATIONS
-- ─────────────────────────────────────────────
create table if not exists otp_verifications (
  id uuid primary key default gen_random_uuid(),
  mobile text not null,
  otp_code text not null,
  expires_at timestamptz not null,
  verified boolean not null default false,
  attempts integer not null default 0,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- 4. WORKSPACES
-- ─────────────────────────────────────────────
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Natural Heaven',
  address text not null default 'Bondarwadi, Mahabaleshwar',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- 5. WORKSPACE MEMBERS
-- ─────────────────────────────────────────────
create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'owner' check (role in ('owner', 'manager')),
  status text not null default 'active' check (status in ('active', 'invited', 'revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz default now(),
  joined_at timestamptz,
  unique (workspace_id, user_id),
  unique (workspace_id, email)
);

-- ─────────────────────────────────────────────
-- 6. WORKSPACE INVITES
-- ─────────────────────────────────────────────
create table if not exists workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  email text not null,
  role text not null default 'owner' check (role in ('owner', 'manager')),
  invited_by uuid references auth.users(id) on delete set null,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz default now(),
  unique (workspace_id, email)
);

-- ─────────────────────────────────────────────
-- 7. BOOKINGS
-- ─────────────────────────────────────────────
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete restrict,
  guest_id uuid references guests(id) on delete restrict,
  check_in_date date not null,
  check_out_date date,
  custom_rate numeric,
  deposit_amount numeric not null default 500,
  total_room_amount numeric,
  total_food_amount numeric default 0,
  total_amount numeric,
  payment_status text default 'pending' check (payment_status in ('pending', 'partial', 'paid')),
  notes text,
  status text not null default 'active' check (status in ('active', 'checked_out', 'cancelled')),
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- 8. FOOD ORDERS
-- ─────────────────────────────────────────────
create table if not exists food_orders (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  item_name text not null,
  quantity integer not null default 1,
  rate numeric not null,
  total numeric generated always as (quantity * rate) stored,
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snacks', 'other')),
  ordered_at timestamptz default now(),
  notes text
);

-- ─────────────────────────────────────────────
-- 9. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table rooms enable row level security;
alter table guests enable row level security;
alter table bookings enable row level security;
alter table food_orders enable row level security;
alter table otp_verifications enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table workspace_invites enable row level security;

do $$ begin
  drop policy if exists "Owner full access rooms" on rooms;
  drop policy if exists "Owner full access guests" on guests;
  drop policy if exists "Owner full access bookings" on bookings;
  drop policy if exists "Owner full access food_orders" on food_orders;
  drop policy if exists "Auth access rooms" on rooms;
  drop policy if exists "Auth access guests" on guests;
  drop policy if exists "Auth access bookings" on bookings;
  drop policy if exists "Auth access food_orders" on food_orders;
  drop policy if exists "Anyone insert otp" on otp_verifications;
  drop policy if exists "Auth read otp" on otp_verifications;
  drop policy if exists "Auth update otp" on otp_verifications;
  drop policy if exists "Auth access workspaces" on workspaces;
  drop policy if exists "Auth access workspace_members" on workspace_members;
  drop policy if exists "Auth access workspace_invites" on workspace_invites;
exception when others then null;
end $$;

create policy "Auth access rooms" on rooms for all using (auth.role() = 'authenticated');
create policy "Auth access guests" on guests for all using (auth.role() = 'authenticated');
create policy "Auth access bookings" on bookings for all using (auth.role() = 'authenticated');
create policy "Auth access food_orders" on food_orders for all using (auth.role() = 'authenticated');
create policy "Anyone insert otp" on otp_verifications for insert with check (true);
create policy "Auth read otp" on otp_verifications for select using (auth.role() = 'authenticated');
create policy "Auth update otp" on otp_verifications for update using (auth.role() = 'authenticated');
create policy "Auth access workspaces" on workspaces for all using (auth.role() = 'authenticated');
create policy "Auth access workspace_members" on workspace_members for all using (auth.role() = 'authenticated');
create policy "Auth access workspace_invites" on workspace_invites for all using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────
-- 10. HELPER FUNCTION: cleanup expired OTPs
-- ─────────────────────────────────────────────
create or replace function cleanup_expired_otps()
returns void language plpgsql as $$
begin
  delete from otp_verifications where expires_at < now() - interval '1 hour';
end;
$$;
