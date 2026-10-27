-- Onde falta carona (14/10/2026): mapa na página inicial com as cidades de onde há gente esperando carona.
-- A fonte é o "Me avise" confirmado que pede carona e informa a cidade de partida. Só totais: o mapa mostra o nome do
-- lugar devolvido pelo OpenStreetMap (cidade ou vila, nunca endereço), nunca o texto digitado nem o e-mail.

alter table public.alerts
  add column origin_lat   double precision,
  add column origin_lon   double precision,
  add column origin_place text check (origin_place is null or char_length(origin_place) <= 120);

comment on column public.alerts.origin_place is 'Nome da cidade de partida segundo o OpenStreetMap (nível cidade ou vila).';

alter table public.geocode_cache add column name text;

create function private.km(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
returns double precision language sql immutable set search_path = ''
as $$
  select 6371 * 2 * asin(sqrt(power(sin(radians(lat2 - lat1) / 2), 2)
       + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lon2 - lon1) / 2), 2)));
$$;

-- Por cidade de partida: quantas pessoas esperam carona, para quais cidades de votação, e quantas caronas abertas já
-- saem dali (até 40 km) para esses destinos.
create function public.ride_demand() returns jsonb
language sql stable security definer set search_path = ''
as $$
  with espera as (
    select a.origin_place as lugar, round(a.origin_lat::numeric, 1) as glat, round(a.origin_lon::numeric, 1) as glon,
           a.origin_lat, a.origin_lon, c.id as cidade_id, c.slug, c.name as cidade, c.country_code
      from public.alerts a join public.voting_cities c on c.id = a.voting_city_id and c.has_section
     where a.confirmed_at is not null and a.kind in ('ride', 'both') and a.origin_lat is not null and a.origin_place is not null
  ),
  origens as (
    select lugar, glat, glon, avg(origin_lat) as lat, avg(origin_lon) as lon, count(*) as pessoas
      from espera group by lugar, glat, glon
  ),
  destinos as (
    select e.lugar, e.glat, e.glon, e.slug, e.cidade, e.country_code, count(*) as pessoas,
           (select count(*) from public.rides r join public.profiles p on p.id = r.driver_id
             where r.voting_city_id = e.cidade_id and r.status = 'open' and r.depart_at > now() and p.banned_at is null
               and r.origin_lat is not null
               and private.km(r.origin_lat, r.origin_lon, avg(e.origin_lat), avg(e.origin_lon)) <= 40) as caronas
      from espera e group by e.lugar, e.glat, e.glon, e.slug, e.cidade, e.country_code, e.cidade_id
  )
  select jsonb_build_object(
    'pessoas', coalesce((select sum(pessoas) from origens), 0),
    'origens', coalesce((
      select jsonb_agg(jsonb_build_object(
        'lugar', o.lugar, 'lat', round(o.lat::numeric, 3), 'lon', round(o.lon::numeric, 3), 'pessoas', o.pessoas,
        'destinos', (select jsonb_agg(jsonb_build_object('slug', d.slug, 'cidade', d.cidade, 'pais', d.country_code,
                                                         'pessoas', d.pessoas, 'caronas', d.caronas) order by d.pessoas desc, d.cidade)
                       from destinos d where d.lugar = o.lugar and d.glat = o.glat and d.glon = o.glon))
        order by o.pessoas desc, o.lugar)
        from origens o), '[]'::jsonb));
$$;

revoke execute on function public.ride_demand from public;
grant execute on function public.ride_demand to anon, authenticated, service_role;
