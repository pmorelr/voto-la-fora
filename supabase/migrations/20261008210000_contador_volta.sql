-- Contador público da página inicial (de volta em 08/10/2026, depois de 20261008200000_remove_contador): quantas
-- pessoas já usaram o site para oferecer ou pedir.
-- Só totais, nunca quem. Não contam anúncios cancelados ou removidos, perfis banidos nem pedidos cancelados
-- ou marcados como abuso. Quem pede é contado uma vez por WhatsApp; quem oferece, uma vez por conta.

create function public.site_stats()
returns table (people integer, offerers integer, requesters integer, rides integer, stays integer, requests integer)
language sql stable security definer set search_path = ''
as $$
  with ofertas as (
    select r.driver_id as dono, 'ride'::public.listing_kind as tipo
      from public.rides r join public.profiles p on p.id = r.driver_id
     where r.status not in ('cancelled', 'removed') and p.banned_at is null
    union all
    select s.host_id, 'stay'::public.listing_kind
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
         (select count(*) from pedidos)::integer;
$$;

revoke execute on function public.site_stats from public;
grant execute on function public.site_stats to anon, authenticated, service_role;
