-- Locais de votação no exterior (planilha de seções do TSE, 2026). Algumas cidades do TSE têm locais em outras
-- cidades: quem é de Hamburgo vota em Hamburgo, dentro da seção de Berlim. Cada um desses locais vira um destino
-- próprio (com mapa, página, caronas e hospedagens), ligado à cidade do TSE por parent_id.
-- Os totais do TSE (voters, turnout, abstention_pct) continuam só na cidade-mãe; o local extra tem só os aptos dele.

alter table public.voting_cities
  add column parent_id    uuid references public.voting_cities (id) on delete cascade,
  add column place_voters integer;

comment on column public.voting_cities.parent_id is 'Cidade do TSE a que este local pertence; nulo nas cidades do TSE.';
comment on column public.voting_cities.place_voters is 'Eleitores aptos neste local de votação (planilha de seções).';

create index voting_cities_parent_idx on public.voting_cities (parent_id);

-- Países: cada local conta como cidade com seção; eleitores e abstenção só das cidades do TSE.
create or replace function public.countries_overview()
returns table (code text, name text, cities integer, voters integer, abstention_pct numeric,
               lat double precision, lon double precision, open_rides integer, open_stays integer)
language sql stable security definer set search_path = ''
as $$
  select k.code, k.name,
         count(c.id)::integer,
         coalesce(sum(c.voters) filter (where c.parent_id is null), sum(c.place_voters))::integer,
         round(100 * (1 - sum(c.turnout) filter (where c.parent_id is null)::numeric
                         / nullif(sum(c.voters) filter (where c.parent_id is null), 0)), 1),
         avg(c.lat), avg(c.lon),
         (select count(*)::integer from private.visible_rides r join public.voting_cities c2 on c2.id = r.voting_city_id
           where c2.country_code = k.code and r.status = 'open'),
         (select count(*)::integer from private.visible_stays s join public.voting_cities c2 on c2.id = s.voting_city_id
           where c2.country_code = k.code and s.status = 'open')
    from public.countries k
    join public.voting_cities c on c.country_code = k.code and c.has_section
   group by k.code, k.name
   order by 4 desc nulls last
$$;

-- Pinos do país: cada local com os eleitores dele.
create or replace function public.country_overview(p_country text)
returns table (slug text, name text, lat double precision, lon double precision, voters integer,
               abstention_pct numeric, venue_name text, open_rides integer, open_seats integer, open_stays integer)
language sql stable security definer set search_path = ''
as $$
  select c.slug, c.name, c.lat, c.lon, coalesce(c.place_voters, c.voters), c.abstention_pct, c.venue_name,
         (select count(*)::integer from private.visible_rides r where r.voting_city_id = c.id and r.status = 'open'),
         (select coalesce(sum(r.seats_total - r.seats_taken), 0)::integer from private.visible_rides r
           where r.voting_city_id = c.id and r.status = 'open'),
         (select count(*)::integer from private.visible_stays s where s.voting_city_id = c.id and s.status = 'open')
    from public.voting_cities c
   where c.country_code = upper(p_country) and c.has_section
   order by coalesce(c.place_voters, c.voters) desc
$$;

-- Página da cidade: também a seção do TSE e todos os locais dela.
create or replace function public.city_listings(p_slug text) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'city', jsonb_build_object(
      'slug', c.slug, 'name', c.name, 'country_code', c.country_code, 'country_name', k.name,
      'timezone', c.timezone, 'lat', c.lat, 'lon', c.lon, 'voters', c.voters, 'turnout', c.turnout,
      'abstention_pct', c.abstention_pct, 'venue_name', c.venue_name, 'address', c.address,
      'hours', c.hours, 'notes', c.notes, 'place_voters', c.place_voters,
      'jurisdiction', m.name,
      'jurisdiction_voters', m.voters,
      'jurisdiction_abstention_pct', m.abstention_pct,
      'places', (select jsonb_agg(jsonb_build_object('slug', l.slug, 'name', l.name, 'venue_name', l.venue_name,
                                                     'voters', coalesce(l.place_voters, l.voters))
                                  order by l.parent_id nulls first, coalesce(l.place_voters, l.voters) desc)
                   from public.voting_cities l
                  where (l.id = m.id or l.parent_id = m.id) and l.has_section)),
    'rides', coalesce((select jsonb_agg(private.ride_json(r) order by r.depart_at)
                         from private.visible_rides r where r.voting_city_id = c.id), '[]'::jsonb),
    'stays', coalesce((select jsonb_agg(private.stay_json(s) order by s.created_at)
                         from private.visible_stays s where s.voting_city_id = c.id), '[]'::jsonb))
    from public.voting_cities c
    join public.voting_cities m on m.id = coalesce(c.parent_id, c.id)
    join public.countries k on k.code = c.country_code
   where c.slug = p_slug and c.has_section
$$;
