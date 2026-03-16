-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type appointment_status as enum (
  'pending',
  'confirmed',
  'completed',
  'canceled',
  'no_show'
);

-- Core tables
create table if not exists barbers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  slug text unique not null,
  bio text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_min int not null check (duration_min > 0),
  price numeric(10,2) not null check (price >= 0),
  deposit_amount numeric(10,2) not null default 0,
  requires_deposit boolean not null default false,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists business_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  phone text not null,
  email text,
  address_line text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  timezone text not null default 'America/New_York',
  open_time time not null default '09:00',
  close_time time not null default '19:00',
  slot_interval_min int not null default 30,
  booking_buffer_min int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists availability_rules (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid references barbers(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists blocked_times (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references barbers(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  service_id uuid not null references services(id),
  barber_id uuid not null references barbers(id),
  date date not null,
  start_time time not null,
  end_time time not null,
  status appointment_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  quote text not null,
  rating int check (rating between 1 and 5) default 5,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists message_logs (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  purpose text not null,
  channel text not null,
  created_at timestamptz not null default now(),
  unique (appointment_id, purpose)
);

-- Indexes
create index if not exists idx_appointments_barber_date on appointments(barber_id, date);
create index if not exists idx_appointments_status on appointments(status);
create index if not exists idx_blocked_times_barber_date on blocked_times(barber_id, date);
create index if not exists idx_message_logs_appointment on message_logs(appointment_id);

-- RLS
alter table barbers enable row level security;
alter table services enable row level security;
alter table appointments enable row level security;
alter table blocked_times enable row level security;
alter table business_settings enable row level security;
alter table availability_rules enable row level security;
alter table testimonials enable row level security;
alter table message_logs enable row level security;

-- Public can read published data
create policy "public read services" on services for select using (is_active = true);
create policy "public read barbers" on barbers for select using (is_active = true);
create policy "public read testimonials" on testimonials for select using (is_active = true);

-- Public can create appointments (MVP)
create policy "public insert appointments" on appointments for insert with check (true);

-- Prevent public reads of appointment data
create policy "deny public appointment reads" on appointments for select using (false);
create policy "deny public message logs" on message_logs for all using (false) with check (false);

-- Seed
insert into barbers (full_name, slug, bio)
values ('Yohannes', 'yohannes', 'Precision fades, beard sculpting, and premium grooming experience.')
on conflict (slug) do nothing;

insert into services (name, duration_min, price, deposit_amount, requires_deposit, description)
values
('Haircut', 45, 40, 0, false, 'Fade or classic cut with finishing style.'),
('Beard Trim', 25, 25, 0, false, 'Beard shaping and line definition.'),
('Haircut + Beard', 60, 60, 10, true, 'Most booked combo service.'),
('Kids Cut', 30, 30, 0, false, 'Patient, clean, and parent-approved.'),
('Line Up', 20, 20, 0, false, 'Quick refresh between full cuts.'),
('Premium Package', 75, 80, 20, true, 'Cut + beard + wash + style finish')
on conflict do nothing;

insert into business_settings (business_name, phone, email, address_line, city, state, postal_code)
values ('YOH Cuts Studio', '+1 (555) 021-1344', 'bookings@yohcuts.com', '221 Fulton St', 'Brooklyn', 'NY', '11201')
on conflict do nothing;
