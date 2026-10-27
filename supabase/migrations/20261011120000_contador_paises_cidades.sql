-- Contador da página inicial: passa a contar também os países e as cidades de votação com pelo menos uma oferta.
-- A assinatura muda (colunas novas), então a função é recriada.
drop function public.site_stats();

create function public.site_stats()
returns table (people integer, offerers integer, requesters integer, rides integer, stays integer, requests integer,
               countries integer, cities integer)
language sql stable security definer set search_path = ''
as $$
  with ofertas as (
    select r.driver_id as dono, 'ride'::public.listing_kind as tipo, r.voting_city_id as cidade
      from public.rides r join public.profiles p on p.id = r.driver_id
     where r.status not in ('cancelled', 'removed') and p.banned_at is null
    union all
    select s.host_id, 'stay'::public.listing_kind, s.voting_city_id
      from public.stays s join public.profiles p on p.id = s.host_id
     where s.status not in ('cancelled', 'removed') and p.banned_at is null
  ),
  pedidos as (
    select whatsapp from public.ride_requests where status <> 'cancelled' and not flagged
    union all
    select whatsapp from public.stay_requests where status <> 'cancelled' and not flagged
  )
  select ((select count(distinct dono) from ofertas) + (select count(distinct whatsapp) from pedidos))::integer,
         (select count(distinct dono) from ofertas)::integer,
         (select count(distinct whatsapp) from pedidos)::integer,
         (select count(*) from ofertas where tipo = 'ride')::integer,
         (select count(*) from ofertas where tipo = 'stay')::integer,
         (select count(*) from pedidos)::integer,
         (select count(distinct c.country_code) from ofertas o join public.voting_cities c on c.id = o.cidade)::integer,
         (select count(distinct o.cidade) from ofertas o)::integer;
$$;

revoke execute on function public.site_stats from public;
grant execute on function public.site_stats to anon, authenticated, service_role;
