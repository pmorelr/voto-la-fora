-- =====================================================================
-- Voto Lá Fora — schema v2 (interno/PLANO.md §6 e §12)
--
-- Modelo: quem oferece tem conta leve (Supabase Auth, código por e-mail).
-- Quem procura não tem conta: pede vaga com primeiro nome e WhatsApp.
--
-- Princípios
--  * Leitura pública só pelas funções countries_overview, country_overview
--    e city_listings, que devolvem dados mínimos (primeiro nome, nunca contato).
--  * Pedidos, avisos e denúncias de visitantes só pelo servidor (service_role),
--    depois de validar o Turnstile.
--  * Quem oferece escreve por funções que checam auth.uid().
--  * O WhatsApp de quem pede só é lido pelo dono do anúncio (RLS).
--  * Funções auxiliares no schema private, fora da API.
--  * Erros de negócio: raise exception '<chave>' (SQLSTATE P0001).
-- =====================================================================

create schema if not exists private;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.vehicle as enum ('car', 'van');
create type public.listing_status as enum ('open', 'full', 'paused', 'cancelled', 'removed');
create type public.request_status as enum ('pending', 'confirmed', 'declined', 'cancelled', 'expired');
create type public.stay_kind as enum ('room', 'couch', 'mattress');
create type public.alert_kind as enum ('ride', 'stay', 'both');
create type public.listing_kind as enum ('ride', 'stay');

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------
create table public.countries (
  code     text primary key check (code ~ '^[A-Z]{2}$'),
  name     text not null,
  timezone text not null
);

create table public.voting_cities (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9-]+$'),
  tse_code       text not null unique,
  name           text not null,
  country_code   text not null references public.countries (code),
  timezone       text not null,
  lat            double precision,
  lon            double precision,
  voters         integer not null default 0,
  turnout        integer not null default 0,
  abstention_pct numeric(5, 2),
  has_section    boolean not null default true,
  venue_name     text,
  address        text,
  hours          text,
  notes          text,
  sort_order     integer not null default 1000,
  created_at     timestamptz not null default now()
);
create index voting_cities_country_idx on public.voting_cities (country_code);

-- Só quem oferece tem perfil.
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  first_name   text not null check (char_length(btrim(first_name)) between 2 and 30),
  consented_at timestamptz not null,
  banned_at    timestamptz,
  created_at   timestamptz not null default now()
);

create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.rides (
  id             uuid primary key default gen_random_uuid(),
  driver_id      uuid not null references public.profiles (id) on delete cascade,
  voting_city_id uuid not null references public.voting_cities (id),
  origin_city    text not null check (char_length(btrim(origin_city)) between 2 and 80),
  origin_lat     double precision,
  origin_lon     double precision,
  depart_at      timestamptz not null,
  return_at      timestamptz,
  seats_total    smallint not null check (seats_total between 1 and 8),
  seats_taken    smallint not null default 0,
  vehicle        public.vehicle not null default 'car',
  meeting_hint   text check (meeting_hint is null or char_length(meeting_hint) <= 140),
  notes          text check (notes is null or char_length(notes) <= 500),
  women_only     boolean not null default false,
  status         public.listing_status not null default 'open',
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint rides_seats check (seats_taken between 0 and seats_total),
  constraint rides_return check (return_at is null or return_at > depart_at)
);
create index rides_city_idx on public.rides (voting_city_id, depart_at);
create index rides_driver_idx on public.rides (driver_id);

-- nights: cada data é a noite que começa naquele dia (2026-10-24 = noite de 24 para 25).
create table public.stays (
  id             uuid primary key default gen_random_uuid(),
  host_id        uuid not null references public.profiles (id) on delete cascade,
  voting_city_id uuid not null references public.voting_cities (id),
  area_hint      text not null check (char_length(btrim(area_hint)) between 2 and 80),
  nights         date[] not null check (cardinality(nights) between 1 and 4),
  capacity       smallint not null check (capacity between 1 and 6),
  kind           public.stay_kind not null,
  rules          text check (rules is null or char_length(rules) <= 500),
  women_only     boolean not null default false,
  status         public.listing_status not null default 'open',
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index stays_city_idx on public.stays (voting_city_id);
create index stays_host_idx on public.stays (host_id);

create table public.ride_requests (
  id                uuid primary key default gen_random_uuid(),
  ride_id           uuid not null references public.rides (id) on delete cascade,
  first_name        text not null check (char_length(btrim(first_name)) between 2 and 30),
  whatsapp          text not null check (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  email             text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  is_woman          boolean not null default false,
  people            smallint not null check (people between 1 and 4),
  message           text not null check (char_length(btrim(message)) between 5 and 400),
  status            public.request_status not null default 'pending',
  flagged           boolean not null default false,
  cancel_token_hash text not null unique,
  ip_hash           text,
  created_at        timestamptz not null default now(),
  decided_at        timestamptz,
  reminded_at       timestamptz,
  expires_at        timestamptz not null default now() + interval '48 hours'
);
create index ride_requests_ride_idx on public.ride_requests (ride_id);
create index ride_requests_whatsapp_idx on public.ride_requests (whatsapp);
create index ride_requests_ip_idx on public.ride_requests (ip_hash, created_at);

create table public.stay_requests (
  id                uuid primary key default gen_random_uuid(),
  stay_id           uuid not null references public.stays (id) on delete cascade,
  first_name        text not null check (char_length(btrim(first_name)) between 2 and 30),
  whatsapp          text not null check (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  email             text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  is_woman          boolean not null default false,
  people            smallint not null check (people between 1 and 4),
  nights            date[] not null check (cardinality(nights) between 1 and 4),
  message           text not null check (char_length(btrim(message)) between 5 and 400),
  status            public.request_status not null default 'pending',
  flagged           boolean not null default false,
  cancel_token_hash text not null unique,
  ip_hash           text,
  created_at        timestamptz not null default now(),
  decided_at        timestamptz,
  reminded_at       timestamptz,
  expires_at        timestamptz not null default now() + interval '48 hours'
);
create index stay_requests_stay_idx on public.stay_requests (stay_id);
create index stay_requests_whatsapp_idx on public.stay_requests (whatsapp);
create index stay_requests_ip_idx on public.stay_requests (ip_hash, created_at);

create table public.alerts (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  voting_city_id     uuid not null references public.voting_cities (id),
  kind               public.alert_kind not null default 'both',
  origin_hint        text check (origin_hint is null or char_length(origin_hint) <= 80),
  confirm_token_hash text not null unique,
  unsubscribe_token  text not null unique,
  confirmed_at       timestamptz,
  last_sent_at       timestamptz,
  ip_hash            text,
  created_at         timestamptz not null default now()
);
create unique index alerts_email_city_idx on public.alerts (lower(email), voting_city_id);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  target_kind public.listing_kind not null,
  target_id   uuid not null,
  reason      text not null check (char_length(btrim(reason)) between 3 and 1000),
  reporter_id uuid references public.profiles (id) on delete set null,
  ip_hash     text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

-- Coordenadas de cidades de partida já buscadas no Nominatim.
create table public.geocode_cache (
  query      text primary key,
  lat        double precision,
  lon        double precision,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Auxiliares (schema private)
-- ---------------------------------------------------------------------
create function private.hash_token(p_token text) returns text
language sql immutable
as $$ select encode(sha256(convert_to(p_token, 'UTF8')), 'hex') $$;

create function private.new_token() returns text
language sql volatile
as $$ select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '') $$;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admins a where a.user_id = (select auth.uid())) $$;

-- Usuário logado, com perfil e não banido. Devolve o id.
create function private.require_offerer() returns uuid
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception 'profile_required';
  end if;
  if exists (select 1 from public.profiles p where p.id = v_uid and p.banned_at is not null) then
    raise exception 'banned';
  end if;
  return v_uid;
end;
$$;

create function private.require_admin() returns uuid
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_uid uuid := private.require_offerer();
begin
  if not private.is_admin() then
    raise exception 'forbidden';
  end if;
  return v_uid;
end;
$$;

create function private.is_ride_owner(p_ride uuid) returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.rides r where r.id = p_ride and r.driver_id = (select auth.uid())) $$;

create function private.is_stay_owner(p_stay uuid) returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.stays s where s.id = p_stay and s.host_id = (select auth.uid())) $$;

create function private.req_status(p_status public.request_status, p_expires timestamptz)
returns public.request_status
language sql stable
as $$ select case when p_status = 'pending' and p_expires <= now() then 'expired'::public.request_status else p_status end $$;

create function private.stay_remaining(p_stay uuid, p_night date) returns integer
language sql stable security definer set search_path = ''
as $$
  select s.capacity - coalesce((
    select sum(q.people) from public.stay_requests q
    where q.stay_id = s.id and q.status = 'confirmed' and p_night = any (q.nights)
  ), 0)::integer
  from public.stays s where s.id = p_stay
$$;

create function private.stay_is_full(p_stay uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select not exists (
    select 1 from public.stays s, unnest(s.nights) n
    where s.id = p_stay and private.stay_remaining(s.id, n) > 0
  )
$$;

create function private.allowed_nights() returns date[]
language sql immutable
as $$ select array['2026-10-23', '2026-10-24', '2026-10-25']::date[] $$;

create function private.assert_listing_quota(p_uid uuid) returns void
language plpgsql stable security definer set search_path = ''
as $$
begin
  if (select count(*) from public.rides r where r.driver_id = p_uid and r.created_at > now() - interval '24 hours')
   + (select count(*) from public.stays s where s.host_id = p_uid and s.created_at > now() - interval '24 hours') >= 3 then
    raise exception 'rate_limited';
  end if;
  if (select count(*) from public.rides r where r.driver_id = p_uid and r.status in ('open', 'full', 'paused'))
   + (select count(*) from public.stays s where s.host_id = p_uid and s.status in ('open', 'full', 'paused')) >= 5 then
    raise exception 'too_many_listings';
  end if;
end;
$$;

-- Anúncios visíveis ao público: abertos ou lotados, dono não banido, ainda no futuro.
create view private.visible_rides as
  select r.*, p.first_name
    from public.rides r
    join public.profiles p on p.id = r.driver_id
   where r.status in ('open', 'full')
     and p.banned_at is null
     and r.depart_at > now() - interval '12 hours';

create view private.visible_stays as
  select s.*, p.first_name
    from public.stays s
    join public.profiles p on p.id = s.host_id
   where s.status in ('open', 'full')
     and p.banned_at is null
     and (select max(n) from unnest(s.nights) n) >= current_date - 1;

create function private.ride_json(r private.visible_rides) returns jsonb
language sql stable
as $$
  select jsonb_build_object(
    'id', r.id, 'first_name', r.first_name, 'origin_city', r.origin_city,
    'origin_lat', r.origin_lat, 'origin_lon', r.origin_lon,
    'depart_at', r.depart_at, 'return_at', r.return_at,
    'seats_total', r.seats_total, 'seats_left', r.seats_total - r.seats_taken,
    'vehicle', r.vehicle, 'meeting_hint', r.meeting_hint, 'notes', r.notes,
    'women_only', r.women_only, 'status', r.status, 'created_at', r.created_at)
$$;

create function private.stay_json(s private.visible_stays) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'id', s.id, 'first_name', s.first_name, 'area_hint', s.area_hint,
    'nights', (select jsonb_agg(jsonb_build_object('night', n, 'remaining', private.stay_remaining(s.id, n)) order by n)
                 from unnest(s.nights) n),
    'capacity', s.capacity, 'kind', s.kind, 'rules', s.rules,
    'women_only', s.women_only, 'status', s.status, 'created_at', s.created_at)
$$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.countries      enable row level security;
alter table public.voting_cities  enable row level security;
alter table public.profiles       enable row level security;
alter table public.admins         enable row level security;
alter table public.rides          enable row level security;
alter table public.stays          enable row level security;
alter table public.ride_requests  enable row level security;
alter table public.stay_requests  enable row level security;
alter table public.alerts         enable row level security;
alter table public.reports        enable row level security;
alter table public.geocode_cache  enable row level security;

create policy "países: leitura pública" on public.countries for select to anon, authenticated using (true);
create policy "cidades: leitura pública" on public.voting_cities for select to anon, authenticated using (true);
create policy "perfil: o dono e admins" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.is_admin());
create policy "caronas: o dono e admins" on public.rides for select to authenticated
  using (driver_id = (select auth.uid()) or private.is_admin());
create policy "hospedagens: o dono e admins" on public.stays for select to authenticated
  using (host_id = (select auth.uid()) or private.is_admin());
create policy "pedidos de carona: o dono do anúncio e admins" on public.ride_requests for select to authenticated
  using (private.is_ride_owner(ride_id) or private.is_admin());
create policy "pedidos de hospedagem: o dono do anúncio e admins" on public.stay_requests for select to authenticated
  using (private.is_stay_owner(stay_id) or private.is_admin());
create policy "denúncias: admins" on public.reports for select to authenticated using (private.is_admin());
-- alerts, admins e geocode_cache: nenhuma política; só funções e service_role.

-- ---------------------------------------------------------------------
-- Leitura pública
-- ---------------------------------------------------------------------
create function public.countries_overview()
returns table (code text, name text, cities integer, voters integer, abstention_pct numeric,
               lat double precision, lon double precision, open_rides integer, open_stays integer)
language sql stable security definer set search_path = ''
as $$
  select k.code, k.name,
         count(c.id)::integer,
         sum(c.voters)::integer,
         round(100 * (1 - sum(c.turnout)::numeric / nullif(sum(c.voters), 0)), 1),
         avg(c.lat), avg(c.lon),
         (select count(*)::integer from private.visible_rides r join public.voting_cities c2 on c2.id = r.voting_city_id
           where c2.country_code = k.code and r.status = 'open'),
         (select count(*)::integer from private.visible_stays s join public.voting_cities c2 on c2.id = s.voting_city_id
           where c2.country_code = k.code and s.status = 'open')
    from public.countries k
    join public.voting_cities c on c.country_code = k.code and c.has_section
   group by k.code, k.name
   order by sum(c.voters) desc
$$;

create function public.country_overview(p_country text)
returns table (slug text, name text, lat double precision, lon double precision, voters integer,
               abstention_pct numeric, venue_name text, open_rides integer, open_seats integer, open_stays integer)
language sql stable security definer set search_path = ''
as $$
  select c.slug, c.name, c.lat, c.lon, c.voters, c.abstention_pct, c.venue_name,
         (select count(*)::integer from private.visible_rides r where r.voting_city_id = c.id and r.status = 'open'),
         (select coalesce(sum(r.seats_total - r.seats_taken), 0)::integer from private.visible_rides r
           where r.voting_city_id = c.id and r.status = 'open'),
         (select count(*)::integer from private.visible_stays s where s.voting_city_id = c.id and s.status = 'open')
    from public.voting_cities c
   where c.country_code = upper(p_country) and c.has_section
   order by c.voters desc
$$;

create function public.city_listings(p_slug text) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'city', jsonb_build_object(
      'slug', c.slug, 'name', c.name, 'country_code', c.country_code, 'country_name', k.name,
      'timezone', c.timezone, 'lat', c.lat, 'lon', c.lon, 'voters', c.voters, 'turnout', c.turnout,
      'abstention_pct', c.abstention_pct, 'venue_name', c.venue_name, 'address', c.address,
      'hours', c.hours, 'notes', c.notes),
    'rides', coalesce((select jsonb_agg(private.ride_json(r) order by r.depart_at)
                         from private.visible_rides r where r.voting_city_id = c.id), '[]'::jsonb),
    'stays', coalesce((select jsonb_agg(private.stay_json(s) order by s.created_at)
                         from private.visible_stays s where s.voting_city_id = c.id), '[]'::jsonb))
    from public.voting_cities c
    join public.countries k on k.code = c.country_code
   where c.slug = p_slug and c.has_section
$$;

-- ---------------------------------------------------------------------
-- Quem oferece
-- ---------------------------------------------------------------------
create function public.save_profile(p_first_name text, p_consent boolean) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from public.profiles p where p.id = v_uid and p.banned_at is not null) then
    raise exception 'banned';
  end if;
  if not coalesce(p_consent, false) then
    raise exception 'consent_required';
  end if;
  insert into public.profiles (id, first_name, consented_at)
  values (v_uid, btrim(p_first_name), now())
  on conflict (id) do update set first_name = excluded.first_name;
end;
$$;

create function public.create_ride(
  p_city_slug text, p_origin_city text, p_origin_lat double precision, p_origin_lon double precision,
  p_depart_at timestamptz, p_return_at timestamptz, p_seats_total integer, p_vehicle public.vehicle,
  p_meeting_hint text, p_notes text, p_women_only boolean
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid  uuid := private.require_offerer();
  v_city uuid;
  v_id   uuid;
begin
  select c.id into v_city from public.voting_cities c where c.slug = p_city_slug and c.has_section;
  if v_city is null then
    raise exception 'city_not_found';
  end if;
  if p_depart_at < timestamptz '2026-10-19 00:00:00+00' or p_depart_at > timestamptz '2026-10-28 00:00:00+00' then
    raise exception 'depart_out_of_window';
  end if;
  perform private.assert_listing_quota(v_uid);
  insert into public.rides (driver_id, voting_city_id, origin_city, origin_lat, origin_lon, depart_at, return_at,
                            seats_total, vehicle, meeting_hint, notes, women_only)
  values (v_uid, v_city, btrim(p_origin_city), p_origin_lat, p_origin_lon, p_depart_at, p_return_at,
          p_seats_total, coalesce(p_vehicle, 'car'), nullif(btrim(p_meeting_hint), ''), nullif(btrim(p_notes), ''),
          coalesce(p_women_only, false))
  returning id into v_id;
  return v_id;
end;
$$;

create function public.update_ride(
  p_id uuid, p_origin_city text, p_origin_lat double precision, p_origin_lon double precision,
  p_depart_at timestamptz, p_return_at timestamptz, p_seats_total integer, p_vehicle public.vehicle,
  p_meeting_hint text, p_notes text, p_women_only boolean
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid  uuid := private.require_offerer();
  v_ride public.rides;
begin
  select * into v_ride from public.rides r where r.id = p_id and r.driver_id = v_uid for update;
  if not found or v_ride.status in ('cancelled', 'removed') then
    raise exception 'not_found';
  end if;
  if p_depart_at < timestamptz '2026-10-19 00:00:00+00' or p_depart_at > timestamptz '2026-10-28 00:00:00+00' then
    raise exception 'depart_out_of_window';
  end if;
  if p_seats_total < v_ride.seats_taken then
    raise exception 'seats_below_confirmed';
  end if;
  update public.rides r set
    origin_city = btrim(p_origin_city), origin_lat = p_origin_lat, origin_lon = p_origin_lon,
    depart_at = p_depart_at, return_at = p_return_at, seats_total = p_seats_total,
    vehicle = coalesce(p_vehicle, 'car'), meeting_hint = nullif(btrim(p_meeting_hint), ''),
    notes = nullif(btrim(p_notes), ''), women_only = coalesce(p_women_only, false),
    status = case
      when r.status = 'paused' then 'paused'::public.listing_status
      when p_seats_total = r.seats_taken then 'full'::public.listing_status
      else 'open'::public.listing_status end,
    updated_at = now()
  where r.id = p_id;
end;
$$;

create function public.create_stay(
  p_city_slug text, p_area_hint text, p_nights date[], p_capacity integer,
  p_kind public.stay_kind, p_rules text, p_women_only boolean
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid    uuid := private.require_offerer();
  v_city   uuid;
  v_nights date[];
  v_id     uuid;
begin
  select c.id into v_city from public.voting_cities c where c.slug = p_city_slug and c.has_section;
  if v_city is null then
    raise exception 'city_not_found';
  end if;
  select array_agg(distinct n order by n) into v_nights from unnest(p_nights) n;
  if v_nights is null or not (v_nights <@ private.allowed_nights()) then
    raise exception 'invalid_nights';
  end if;
  perform private.assert_listing_quota(v_uid);
  insert into public.stays (host_id, voting_city_id, area_hint, nights, capacity, kind, rules, women_only)
  values (v_uid, v_city, btrim(p_area_hint), v_nights, p_capacity, p_kind, nullif(btrim(p_rules), ''),
          coalesce(p_women_only, false))
  returning id into v_id;
  return v_id;
end;
$$;

create function public.update_stay(
  p_id uuid, p_area_hint text, p_nights date[], p_capacity integer,
  p_kind public.stay_kind, p_rules text, p_women_only boolean
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid    uuid := private.require_offerer();
  v_stay   public.stays;
  v_nights date[];
  v_night  date;
  v_used   integer;
begin
  select * into v_stay from public.stays s where s.id = p_id and s.host_id = v_uid for update;
  if not found or v_stay.status in ('cancelled', 'removed') then
    raise exception 'not_found';
  end if;
  select array_agg(distinct n order by n) into v_nights from unnest(p_nights) n;
  if v_nights is null or not (v_nights <@ private.allowed_nights()) then
    raise exception 'invalid_nights';
  end if;
  for v_night in
    select distinct n from public.stay_requests q, unnest(q.nights) n where q.stay_id = p_id and q.status = 'confirmed'
  loop
    if not (v_night = any (v_nights)) then
      raise exception 'nights_below_confirmed';
    end if;
    select coalesce(sum(q.people), 0) into v_used from public.stay_requests q
     where q.stay_id = p_id and q.status = 'confirmed' and v_night = any (q.nights);
    if p_capacity < v_used then
      raise exception 'capacity_below_confirmed';
    end if;
  end loop;
  update public.stays s set
    area_hint = btrim(p_area_hint), nights = v_nights, capacity = p_capacity, kind = p_kind,
    rules = nullif(btrim(p_rules), ''), women_only = coalesce(p_women_only, false), updated_at = now()
  where s.id = p_id;
  update public.stays s set
    status = case
      when s.status = 'paused' then 'paused'::public.listing_status
      when private.stay_is_full(s.id) then 'full'::public.listing_status
      else 'open'::public.listing_status end
  where s.id = p_id;
end;
$$;

-- Pausar, reabrir ou cancelar. No cancelamento, devolve os ids dos pedidos afetados;
-- o servidor busca os e-mails com a chave secreta e avisa quem deixou e-mail.
create function public.set_listing_status(p_kind public.listing_kind, p_id uuid, p_status public.listing_status)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid      uuid := private.require_offerer();
  v_current  public.listing_status;
  v_affected jsonb := '[]'::jsonb;
  v_next     public.listing_status;
begin
  if p_status not in ('open', 'paused', 'cancelled') then
    raise exception 'invalid_status';
  end if;
  if p_kind = 'ride' then
    select r.status into v_current from public.rides r where r.id = p_id and r.driver_id = v_uid for update;
  else
    select s.status into v_current from public.stays s where s.id = p_id and s.host_id = v_uid for update;
  end if;
  if v_current is null or v_current in ('cancelled', 'removed') then
    raise exception 'not_found';
  end if;

  if p_status = 'cancelled' then
    if p_kind = 'ride' then
      with upd as (
        update public.ride_requests q set status = 'cancelled', decided_at = now()
         where q.ride_id = p_id and q.status in ('pending', 'confirmed')
        returning q.id
      ) select coalesce(jsonb_agg(id), '[]'::jsonb) into v_affected from upd;
      update public.rides r set status = 'cancelled', updated_at = now() where r.id = p_id;
    else
      with upd as (
        update public.stay_requests q set status = 'cancelled', decided_at = now()
         where q.stay_id = p_id and q.status in ('pending', 'confirmed')
        returning q.id
      ) select coalesce(jsonb_agg(id), '[]'::jsonb) into v_affected from upd;
      update public.stays s set status = 'cancelled', updated_at = now() where s.id = p_id;
    end if;
    return jsonb_build_object('status', 'cancelled', 'affected', v_affected);
  end if;

  if p_status = 'paused' then
    v_next := 'paused';
  elsif p_kind = 'ride' then
    select case when r.seats_taken >= r.seats_total then 'full'::public.listing_status else 'open'::public.listing_status end
      into v_next from public.rides r where r.id = p_id;
  else
    v_next := case when private.stay_is_full(p_id) then 'full'::public.listing_status else 'open'::public.listing_status end;
  end if;

  if p_kind = 'ride' then
    update public.rides r set status = v_next, updated_at = now() where r.id = p_id;
  else
    update public.stays s set status = v_next, updated_at = now() where s.id = p_id;
  end if;
  return jsonb_build_object('status', v_next, 'affected', v_affected);
end;
$$;

-- Confirmar ou recusar um pedido. Devolve o novo status e, só na confirmação, o WhatsApp.
-- O e-mail de quem pediu nunca sai para quem oferece: o servidor busca com a chave secreta.
create function public.decide_request(p_kind public.listing_kind, p_request_id uuid, p_accept boolean)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid   uuid := private.require_offerer();
  v_rreq  public.ride_requests;
  v_sreq  public.stay_requests;
  v_ride  public.rides;
  v_stay  public.stays;
  v_night date;
begin
  if p_kind = 'ride' then
    select * into v_rreq from public.ride_requests q where q.id = p_request_id for update;
    if not found then
      raise exception 'not_found';
    end if;
    select * into v_ride from public.rides r where r.id = v_rreq.ride_id for update;
    if v_ride.driver_id <> v_uid then
      raise exception 'not_found';
    end if;
    if private.req_status(v_rreq.status, v_rreq.expires_at) = 'expired' then
      raise exception 'request_expired';
    end if;
    if v_rreq.status <> 'pending' then
      raise exception 'not_pending';
    end if;
    if p_accept then
      if v_ride.status <> 'open' then
        raise exception 'listing_not_open';
      end if;
      if v_rreq.people > v_ride.seats_total - v_ride.seats_taken then
        raise exception 'not_enough_seats';
      end if;
      update public.rides r
         set seats_taken = r.seats_taken + v_rreq.people,
             status = case when r.seats_taken + v_rreq.people >= r.seats_total
                           then 'full'::public.listing_status else r.status end,
             updated_at = now()
       where r.id = v_ride.id;
      update public.ride_requests q set status = 'confirmed', decided_at = now() where q.id = v_rreq.id;
    else
      update public.ride_requests q set status = 'declined', decided_at = now() where q.id = v_rreq.id;
    end if;
    return jsonb_build_object('status', case when p_accept then 'confirmed' else 'declined' end,
                              'first_name', v_rreq.first_name,
                              'whatsapp', case when p_accept then v_rreq.whatsapp end);
  end if;

  select * into v_sreq from public.stay_requests q where q.id = p_request_id for update;
  if not found then
    raise exception 'not_found';
  end if;
  select * into v_stay from public.stays s where s.id = v_sreq.stay_id for update;
  if v_stay.host_id <> v_uid then
    raise exception 'not_found';
  end if;
  if private.req_status(v_sreq.status, v_sreq.expires_at) = 'expired' then
    raise exception 'request_expired';
  end if;
  if v_sreq.status <> 'pending' then
    raise exception 'not_pending';
  end if;
  if p_accept then
    if v_stay.status <> 'open' then
      raise exception 'listing_not_open';
    end if;
    foreach v_night in array v_sreq.nights loop
      if v_sreq.people > private.stay_remaining(v_stay.id, v_night) then
        raise exception 'not_enough_space';
      end if;
    end loop;
    update public.stay_requests q set status = 'confirmed', decided_at = now() where q.id = v_sreq.id;
    if private.stay_is_full(v_stay.id) then
      update public.stays s set status = 'full', updated_at = now() where s.id = v_stay.id;
    end if;
  else
    update public.stay_requests q set status = 'declined', decided_at = now() where q.id = v_sreq.id;
  end if;
  return jsonb_build_object('status', case when p_accept then 'confirmed' else 'declined' end,
                            'first_name', v_sreq.first_name,
                            'whatsapp', case when p_accept then v_sreq.whatsapp end);
end;
$$;

-- "Número não confere" ou spam: recusa e marca.
create function public.flag_request(p_kind public.listing_kind, p_request_id uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := private.require_offerer();
begin
  if p_kind = 'ride' then
    update public.ride_requests q
       set flagged = true,
           status = case when q.status = 'pending' then 'declined'::public.request_status else q.status end,
           decided_at = coalesce(q.decided_at, now())
     where q.id = p_request_id and private.is_ride_owner(q.ride_id);
  else
    update public.stay_requests q
       set flagged = true,
           status = case when q.status = 'pending' then 'declined'::public.request_status else q.status end,
           decided_at = coalesce(q.decided_at, now())
     where q.id = p_request_id and private.is_stay_owner(q.stay_id);
  end if;
  if not found then
    raise exception 'not_found';
  end if;
end;
$$;

create function public.my_dashboard() returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'profile', (select jsonb_build_object('first_name', p.first_name, 'email', u.email,
                                          'is_admin', private.is_admin(), 'banned', p.banned_at is not null)
                  from public.profiles p join auth.users u on u.id = p.id where p.id = (select auth.uid())),
    'rides', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'city', jsonb_build_object('slug', c.slug, 'name', c.name, 'timezone', c.timezone),
        'origin_city', r.origin_city, 'origin_lat', r.origin_lat, 'origin_lon', r.origin_lon,
        'depart_at', r.depart_at, 'return_at', r.return_at,
        'seats_total', r.seats_total, 'seats_taken', r.seats_taken, 'vehicle', r.vehicle,
        'meeting_hint', r.meeting_hint, 'notes', r.notes, 'women_only', r.women_only, 'status', r.status,
        'requests', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', q.id, 'first_name', q.first_name,
            'whatsapp', case when q.status = 'confirmed' then q.whatsapp end,
            'is_woman', q.is_woman, 'people', q.people, 'message', q.message, 'flagged', q.flagged,
            'status', private.req_status(q.status, q.expires_at), 'created_at', q.created_at,
            'expires_at', q.expires_at) order by q.created_at desc)
            from public.ride_requests q where q.ride_id = r.id), '[]'::jsonb)
      ) order by r.depart_at)
        from public.rides r join public.voting_cities c on c.id = r.voting_city_id
       where r.driver_id = (select auth.uid()) and r.status <> 'removed'), '[]'::jsonb),
    'stays', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'city', jsonb_build_object('slug', c.slug, 'name', c.name, 'timezone', c.timezone),
        'area_hint', s.area_hint, 'capacity', s.capacity, 'kind', s.kind, 'rules', s.rules,
        'women_only', s.women_only, 'status', s.status,
        'nights', (select jsonb_agg(jsonb_build_object('night', n, 'remaining', private.stay_remaining(s.id, n)) order by n)
                     from unnest(s.nights) n),
        'requests', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', q.id, 'first_name', q.first_name,
            'whatsapp', case when q.status = 'confirmed' then q.whatsapp end,
            'is_woman', q.is_woman, 'people', q.people, 'nights', q.nights, 'message', q.message,
            'flagged', q.flagged, 'status', private.req_status(q.status, q.expires_at),
            'created_at', q.created_at, 'expires_at', q.expires_at) order by q.created_at desc)
            from public.stay_requests q where q.stay_id = s.id), '[]'::jsonb)
      ) order by s.created_at)
        from public.stays s join public.voting_cities c on c.id = s.voting_city_id
       where s.host_id = (select auth.uid()) and s.status <> 'removed'), '[]'::jsonb))
$$;

create function public.delete_my_account() returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  delete from auth.users where id = v_uid;
end;
$$;

-- ---------------------------------------------------------------------
-- Servidor (service_role): pedidos, cancelamentos, avisos, rotinas
-- ---------------------------------------------------------------------
create function public.create_request(
  p_kind public.listing_kind, p_listing_id uuid, p_first_name text, p_whatsapp text, p_email text,
  p_is_woman boolean, p_people integer, p_nights date[], p_message text, p_ip_hash text
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_token  text := private.new_token();
  v_id     uuid;
  v_ride   private.visible_rides;
  v_stay   private.visible_stays;
  v_nights date[];
  v_night  date;
  v_owner  uuid;
  v_city   text;
begin
  if (select count(*) from public.ride_requests q where q.whatsapp = p_whatsapp
        and private.req_status(q.status, q.expires_at) = 'pending')
   + (select count(*) from public.stay_requests q where q.whatsapp = p_whatsapp
        and private.req_status(q.status, q.expires_at) = 'pending') >= 3 then
    raise exception 'too_many_pending';
  end if;
  if p_ip_hash is not null and
     (select count(*) from public.ride_requests q where q.ip_hash = p_ip_hash and q.created_at > now() - interval '24 hours')
   + (select count(*) from public.stay_requests q where q.ip_hash = p_ip_hash and q.created_at > now() - interval '24 hours') >= 10 then
    raise exception 'rate_limited';
  end if;

  if p_kind = 'ride' then
    select * into v_ride from private.visible_rides r where r.id = p_listing_id;
    if not found or v_ride.status <> 'open' then
      raise exception 'listing_not_open';
    end if;
    if v_ride.women_only and not coalesce(p_is_woman, false) then
      raise exception 'women_only';
    end if;
    if p_people > v_ride.seats_total - v_ride.seats_taken then
      raise exception 'not_enough_seats';
    end if;
    if exists (select 1 from public.ride_requests q where q.ride_id = p_listing_id and q.whatsapp = p_whatsapp
                 and private.req_status(q.status, q.expires_at) in ('pending', 'confirmed')) then
      raise exception 'already_requested';
    end if;
    insert into public.ride_requests (ride_id, first_name, whatsapp, email, is_woman, people, message,
                                      cancel_token_hash, ip_hash)
    values (p_listing_id, btrim(p_first_name), p_whatsapp, nullif(lower(btrim(p_email)), ''),
            coalesce(p_is_woman, false), p_people, btrim(p_message), private.hash_token(v_token), p_ip_hash)
    returning id into v_id;
    v_owner := v_ride.driver_id;
    select c.name into v_city from public.voting_cities c where c.id = v_ride.voting_city_id;
  else
    select * into v_stay from private.visible_stays s where s.id = p_listing_id;
    if not found or v_stay.status <> 'open' then
      raise exception 'listing_not_open';
    end if;
    if v_stay.women_only and not coalesce(p_is_woman, false) then
      raise exception 'women_only';
    end if;
    select array_agg(distinct n order by n) into v_nights from unnest(p_nights) n;
    if v_nights is null or not (v_nights <@ v_stay.nights) then
      raise exception 'invalid_nights';
    end if;
    foreach v_night in array v_nights loop
      if p_people > private.stay_remaining(v_stay.id, v_night) then
        raise exception 'not_enough_space';
      end if;
    end loop;
    if exists (select 1 from public.stay_requests q where q.stay_id = p_listing_id and q.whatsapp = p_whatsapp
                 and private.req_status(q.status, q.expires_at) in ('pending', 'confirmed')) then
      raise exception 'already_requested';
    end if;
    insert into public.stay_requests (stay_id, first_name, whatsapp, email, is_woman, people, nights, message,
                                      cancel_token_hash, ip_hash)
    values (p_listing_id, btrim(p_first_name), p_whatsapp, nullif(lower(btrim(p_email)), ''),
            coalesce(p_is_woman, false), p_people, v_nights, btrim(p_message), private.hash_token(v_token), p_ip_hash)
    returning id into v_id;
    v_owner := v_stay.host_id;
    select c.name into v_city from public.voting_cities c where c.id = v_stay.voting_city_id;
  end if;

  return jsonb_build_object(
    'id', v_id, 'cancel_token', v_token, 'city_name', v_city,
    'offerer_first_name', (select p.first_name from public.profiles p where p.id = v_owner),
    'offerer_email', (select u.email from auth.users u where u.id = v_owner));
end;
$$;

create function public.cancel_request_by_token(p_token text) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_hash  text := private.hash_token(p_token);
  v_rreq  public.ride_requests;
  v_sreq  public.stay_requests;
  v_owner uuid;
begin
  select * into v_rreq from public.ride_requests q where q.cancel_token_hash = v_hash for update;
  if found then
    if v_rreq.status not in ('pending', 'confirmed') then
      raise exception 'not_cancellable';
    end if;
    update public.ride_requests q set status = 'cancelled', decided_at = now() where q.id = v_rreq.id;
    if v_rreq.status = 'confirmed' then
      update public.rides r
         set seats_taken = r.seats_taken - v_rreq.people,
             status = case when r.status = 'full' then 'open'::public.listing_status else r.status end,
             updated_at = now()
       where r.id = v_rreq.ride_id;
    end if;
    select r.driver_id into v_owner from public.rides r where r.id = v_rreq.ride_id;
    return jsonb_build_object('kind', 'ride', 'was_confirmed', v_rreq.status = 'confirmed',
      'requester_first_name', v_rreq.first_name,
      'offerer_first_name', (select p.first_name from public.profiles p where p.id = v_owner),
      'offerer_email', (select u.email from auth.users u where u.id = v_owner));
  end if;

  select * into v_sreq from public.stay_requests q where q.cancel_token_hash = v_hash for update;
  if not found then
    raise exception 'not_found';
  end if;
  if v_sreq.status not in ('pending', 'confirmed') then
    raise exception 'not_cancellable';
  end if;
  update public.stay_requests q set status = 'cancelled', decided_at = now() where q.id = v_sreq.id;
  if v_sreq.status = 'confirmed' then
    update public.stays s set status = 'open', updated_at = now() where s.id = v_sreq.stay_id and s.status = 'full';
  end if;
  select s.host_id into v_owner from public.stays s where s.id = v_sreq.stay_id;
  return jsonb_build_object('kind', 'stay', 'was_confirmed', v_sreq.status = 'confirmed',
    'requester_first_name', v_sreq.first_name,
    'offerer_first_name', (select p.first_name from public.profiles p where p.id = v_owner),
    'offerer_email', (select u.email from auth.users u where u.id = v_owner));
end;
$$;

create function public.create_alert(
  p_email text, p_city_slug text, p_kind public.alert_kind, p_origin_hint text, p_ip_hash text
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_city    public.voting_cities;
  v_confirm text := private.new_token();
  v_unsub   text := private.new_token();
begin
  select * into v_city from public.voting_cities c where c.slug = p_city_slug and c.has_section;
  if not found then
    raise exception 'city_not_found';
  end if;
  if p_ip_hash is not null and
     (select count(*) from public.alerts a where a.ip_hash = p_ip_hash and a.created_at > now() - interval '24 hours') >= 10 then
    raise exception 'rate_limited';
  end if;
  insert into public.alerts as a (email, voting_city_id, kind, origin_hint, confirm_token_hash, unsubscribe_token, ip_hash)
  values (lower(btrim(p_email)), v_city.id, coalesce(p_kind, 'both'), nullif(btrim(p_origin_hint), ''),
          private.hash_token(v_confirm), v_unsub, p_ip_hash)
  on conflict (lower(email), voting_city_id) do update
    set kind = excluded.kind, origin_hint = excluded.origin_hint,
        confirm_token_hash = excluded.confirm_token_hash, unsubscribe_token = excluded.unsubscribe_token,
        confirmed_at = null, ip_hash = excluded.ip_hash, created_at = now();
  return jsonb_build_object('confirm_token', v_confirm, 'unsubscribe_token', v_unsub,
                            'city_name', v_city.name, 'city_slug', v_city.slug);
end;
$$;

create function public.confirm_alert(p_token text) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_alert public.alerts;
begin
  update public.alerts a set confirmed_at = coalesce(a.confirmed_at, now())
   where a.confirm_token_hash = private.hash_token(p_token)
  returning * into v_alert;
  if not found then
    raise exception 'not_found';
  end if;
  return (select jsonb_build_object('city_slug', c.slug, 'city_name', c.name)
            from public.voting_cities c where c.id = v_alert.voting_city_id);
end;
$$;

create function public.unsubscribe_alert(p_token text) returns boolean
language sql security definer set search_path = ''
as $$
  with del as (delete from public.alerts a where a.unsubscribe_token = p_token returning 1)
  select exists (select 1 from del)
$$;

-- Avisos com novidades desde o último envio. O servidor manda os e-mails e depois chama mark_alerts_sent.
create function public.alerts_digest() returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce(jsonb_agg(x), '[]'::jsonb) from (
    select jsonb_build_object(
      'alert_id', a.id, 'email', a.email, 'unsubscribe_token', a.unsubscribe_token,
      'city', jsonb_build_object('slug', c.slug, 'name', c.name, 'timezone', c.timezone),
      'rides', coalesce((
        select jsonb_agg(private.ride_json(r) order by r.depart_at) from private.visible_rides r
         where a.kind in ('ride', 'both') and r.voting_city_id = c.id and r.status = 'open'
           and r.created_at > coalesce(a.last_sent_at, a.confirmed_at)
           and (a.origin_hint is null or r.origin_city ilike '%' || a.origin_hint || '%')), '[]'::jsonb),
      'stays', coalesce((
        select jsonb_agg(private.stay_json(s) order by s.created_at) from private.visible_stays s
         where a.kind in ('stay', 'both') and s.voting_city_id = c.id and s.status = 'open'
           and s.created_at > coalesce(a.last_sent_at, a.confirmed_at)), '[]'::jsonb)
    ) as x
      from public.alerts a
      join public.voting_cities c on c.id = a.voting_city_id
     where a.confirmed_at is not null
  ) t
  where jsonb_array_length(x -> 'rides') > 0 or jsonb_array_length(x -> 'stays') > 0
$$;

create function public.mark_alerts_sent(p_ids uuid[]) returns void
language sql security definer set search_path = ''
as $$ update public.alerts a set last_sent_at = now() where a.id = any (p_ids) $$;

-- Lembrete para quem oferece: pedidos pendentes há mais de 24 horas, ainda não lembrados.
create function public.pending_reminders() returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_out jsonb;
begin
  with due as (
    select r.driver_id as owner, q.id, 'ride' as kind
      from public.ride_requests q join public.rides r on r.id = q.ride_id
     where private.req_status(q.status, q.expires_at) = 'pending'
       and q.created_at < now() - interval '24 hours' and q.reminded_at is null
    union all
    select s.host_id, q.id, 'stay'
      from public.stay_requests q join public.stays s on s.id = q.stay_id
     where private.req_status(q.status, q.expires_at) = 'pending'
       and q.created_at < now() - interval '24 hours' and q.reminded_at is null
  ), mark_r as (
    update public.ride_requests q set reminded_at = now() from due where due.kind = 'ride' and q.id = due.id
  ), mark_s as (
    update public.stay_requests q set reminded_at = now() from due where due.kind = 'stay' and q.id = due.id
  )
  select coalesce(jsonb_agg(jsonb_build_object('email', u.email, 'first_name', p.first_name, 'pending', d.n)), '[]'::jsonb)
    into v_out
    from (select owner, count(*) as n from due group by owner) d
    join public.profiles p on p.id = d.owner
    join auth.users u on u.id = d.owner;
  return v_out;
end;
$$;

create function public.expire_stale_requests() returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_r integer;
  v_s integer;
begin
  update public.ride_requests q set status = 'expired' where q.status = 'pending' and q.expires_at <= now();
  get diagnostics v_r = row_count;
  update public.stay_requests q set status = 'expired' where q.status = 'pending' and q.expires_at <= now();
  get diagnostics v_s = row_count;
  return v_r + v_s;
end;
$$;

-- Limpeza diária prometida na política de privacidade (seção 11): "Me avise" sem confirmação some em
-- 48 horas, o resumo do IP some em 7 dias e todos os avisos somem no dia seguinte ao 2º turno.
create function public.purge_stale_data(p_now timestamptz default now()) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_alerts integer;
  v_ips    integer := 0;
  v_n      integer;
begin
  if p_now >= timestamptz '2026-10-26 12:00:00+00' then
    delete from public.alerts a where true;
  else
    delete from public.alerts a where a.confirmed_at is null and a.created_at < p_now - interval '48 hours';
  end if;
  get diagnostics v_alerts = row_count;

  update public.ride_requests q set ip_hash = null where q.ip_hash is not null and q.created_at < p_now - interval '7 days';
  get diagnostics v_n = row_count;
  v_ips := v_ips + v_n;
  update public.stay_requests q set ip_hash = null where q.ip_hash is not null and q.created_at < p_now - interval '7 days';
  get diagnostics v_n = row_count;
  v_ips := v_ips + v_n;
  update public.alerts a set ip_hash = null where a.ip_hash is not null and a.created_at < p_now - interval '7 days';
  get diagnostics v_n = row_count;
  v_ips := v_ips + v_n;
  update public.reports x set ip_hash = null where x.ip_hash is not null and x.created_at < p_now - interval '7 days';
  get diagnostics v_n = row_count;
  v_ips := v_ips + v_n;

  return jsonb_build_object('alerts_deleted', v_alerts, 'ip_hashes_cleared', v_ips);
end;
$$;

create function public.report_listing(
  p_kind public.listing_kind, p_id uuid, p_reason text, p_reporter uuid, p_ip_hash text
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if (p_kind = 'ride' and not exists (select 1 from public.rides r where r.id = p_id))
     or (p_kind = 'stay' and not exists (select 1 from public.stays s where s.id = p_id)) then
    raise exception 'not_found';
  end if;
  if p_ip_hash is not null and
     (select count(*) from public.reports x where x.ip_hash = p_ip_hash and x.created_at > now() - interval '24 hours') >= 20 then
    raise exception 'rate_limited';
  end if;
  insert into public.reports (target_kind, target_id, reason, reporter_id, ip_hash)
  values (p_kind, p_id, btrim(p_reason), p_reporter, p_ip_hash);
end;
$$;

-- ---------------------------------------------------------------------
-- Moderação (admins)
-- ---------------------------------------------------------------------
create function public.admin_queue() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform private.require_admin();
  return jsonb_build_object(
    'rides', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'driver_id', r.driver_id, 'city', c.name, 'first_name', p.first_name, 'email', u.email,
        'origin_city', r.origin_city, 'depart_at', r.depart_at, 'seats_total', r.seats_total,
        'meeting_hint', r.meeting_hint, 'notes', r.notes, 'status', r.status, 'created_at', r.created_at)
        order by r.created_at)
        from public.rides r join public.profiles p on p.id = r.driver_id join auth.users u on u.id = r.driver_id
        join public.voting_cities c on c.id = r.voting_city_id
       where r.reviewed_at is null and r.status in ('open', 'full', 'paused')), '[]'::jsonb),
    'stays', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'host_id', s.host_id, 'city', c.name, 'first_name', p.first_name, 'email', u.email,
        'area_hint', s.area_hint, 'nights', s.nights, 'capacity', s.capacity, 'rules', s.rules,
        'status', s.status, 'created_at', s.created_at) order by s.created_at)
        from public.stays s join public.profiles p on p.id = s.host_id join auth.users u on u.id = s.host_id
        join public.voting_cities c on c.id = s.voting_city_id
       where s.reviewed_at is null and s.status in ('open', 'full', 'paused')), '[]'::jsonb),
    'reports', coalesce((
      select jsonb_agg(jsonb_build_object('id', x.id, 'target_kind', x.target_kind, 'target_id', x.target_id,
                                          'reason', x.reason, 'created_at', x.created_at) order by x.created_at)
        from public.reports x where x.resolved_at is null), '[]'::jsonb));
end;
$$;

create function public.admin_review(p_kind public.listing_kind, p_id uuid, p_approve boolean) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_affected jsonb := '[]'::jsonb;
begin
  perform private.require_admin();
  if p_approve then
    if p_kind = 'ride' then
      update public.rides r set reviewed_at = now() where r.id = p_id;
    else
      update public.stays s set reviewed_at = now() where s.id = p_id;
    end if;
    return jsonb_build_object('status', 'approved', 'affected', v_affected);
  end if;
  if p_kind = 'ride' then
    with upd as (
      update public.ride_requests q set status = 'cancelled', decided_at = now()
       where q.ride_id = p_id and q.status in ('pending', 'confirmed') returning q.first_name, q.email
    ) select coalesce(jsonb_agg(jsonb_build_object('first_name', first_name, 'email', email)), '[]'::jsonb)
        into v_affected from upd;
    update public.rides r set status = 'removed', reviewed_at = now(), updated_at = now() where r.id = p_id;
  else
    with upd as (
      update public.stay_requests q set status = 'cancelled', decided_at = now()
       where q.stay_id = p_id and q.status in ('pending', 'confirmed') returning q.first_name, q.email
    ) select coalesce(jsonb_agg(jsonb_build_object('first_name', first_name, 'email', email)), '[]'::jsonb)
        into v_affected from upd;
    update public.stays s set status = 'removed', reviewed_at = now(), updated_at = now() where s.id = p_id;
  end if;
  return jsonb_build_object('status', 'removed', 'affected', v_affected);
end;
$$;

create function public.admin_ban(p_user_id uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.require_admin();
  update public.profiles p set banned_at = now() where p.id = p_user_id and p.banned_at is null;
  update public.ride_requests q set status = 'cancelled', decided_at = now()
   where q.status in ('pending', 'confirmed')
     and q.ride_id in (select r.id from public.rides r where r.driver_id = p_user_id);
  update public.stay_requests q set status = 'cancelled', decided_at = now()
   where q.status in ('pending', 'confirmed')
     and q.stay_id in (select s.id from public.stays s where s.host_id = p_user_id);
  update public.rides r set status = 'removed', updated_at = now() where r.driver_id = p_user_id and r.status <> 'removed';
  update public.stays s set status = 'removed', updated_at = now() where s.host_id = p_user_id and s.status <> 'removed';
end;
$$;

create function public.admin_resolve_report(p_id uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.require_admin();
  update public.reports x set resolved_at = now() where x.id = p_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Privilégios: defesa em profundidade além do RLS
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
grant select on public.countries, public.voting_cities to anon, authenticated;
grant select on public.profiles, public.rides, public.stays, public.reports to authenticated;
-- Pedidos: quem oferece lê tudo menos o contato. WhatsApp só pelo painel, e só de pedido confirmado.
grant select (id, ride_id, first_name, is_woman, people, message, status, flagged, created_at, decided_at, expires_at)
  on public.ride_requests to authenticated;
grant select (id, stay_id, first_name, is_woman, people, nights, message, status, flagged, created_at, decided_at, expires_at)
  on public.stay_requests to authenticated;
grant select, insert, update on public.geocode_cache to service_role;

revoke execute on all functions in schema public from public, anon, authenticated, service_role;
grant execute on function public.countries_overview, public.country_overview, public.city_listings
  to anon, authenticated, service_role;
grant execute on function public.save_profile, public.create_ride, public.update_ride, public.create_stay,
  public.update_stay, public.set_listing_status, public.decide_request, public.flag_request,
  public.my_dashboard, public.delete_my_account, public.admin_queue, public.admin_review,
  public.admin_ban, public.admin_resolve_report
  to authenticated;
grant execute on function public.create_request, public.cancel_request_by_token, public.create_alert,
  public.confirm_alert, public.unsubscribe_alert, public.alerts_digest, public.mark_alerts_sent,
  public.pending_reminders, public.expire_stale_requests, public.purge_stale_data, public.report_listing
  to service_role;

revoke all on all tables in schema private from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;
