-- Painel de números para a moderação (/moderacao/numeros): só admins. Só totais e contagens, nunca contatos.
-- Anúncio conta se não foi cancelado nem removido e o dono não foi banido. Pedido "confirmado" = as pessoas foram
-- postas em contato (o WhatsApp de quem pediu foi revelado a quem oferece). Dias no fuso de Paris.

create function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v jsonb;
begin
  perform private.require_admin();

  with
  anuncios as (
    select 'ride'::text as tipo, r.id, r.voting_city_id, r.driver_id as dono, r.seats_total as vagas, r.created_at
      from public.rides r join public.profiles p on p.id = r.driver_id
     where r.status not in ('cancelled', 'removed') and p.banned_at is null
    union all
    select 'stay', s.id, s.voting_city_id, s.host_id, s.capacity, s.created_at
      from public.stays s join public.profiles p on p.id = s.host_id
     where s.status not in ('cancelled', 'removed') and p.banned_at is null
  ),
  pedidos as (
    select 'ride'::text as tipo, q.ride_id as anuncio, q.status::text as status, q.people, q.whatsapp, q.created_at, q.decided_at
      from public.ride_requests q
    union all
    select 'stay', q.stay_id, q.status::text, q.people, q.whatsapp, q.created_at, q.decided_at
      from public.stay_requests q
  ),
  locais as (
    select a.*, c.name as cidade, c.slug, c.country_code, k.name as pais
      from anuncios a
      join public.voting_cities c on c.id = a.voting_city_id
      join public.countries k on k.code = c.country_code
  ),
  por_tipo as (
    select t.tipo,
           (select count(*) from anuncios a where a.tipo = t.tipo) as anuncios,
           (select coalesce(sum(a.vagas), 0) from anuncios a where a.tipo = t.tipo) as vagas,
           (select count(*) from pedidos q where q.tipo = t.tipo) as pedidos,
           (select count(*) from pedidos q where q.tipo = t.tipo and q.status = 'pending') as pendentes,
           (select count(*) from pedidos q where q.tipo = t.tipo and q.status = 'confirmed') as confirmados,
           (select count(*) from pedidos q where q.tipo = t.tipo and q.status = 'declined') as recusados,
           (select count(*) from pedidos q where q.tipo = t.tipo and q.status = 'expired') as vencidos,
           (select count(*) from pedidos q where q.tipo = t.tipo and q.status = 'cancelled') as cancelados,
           (select coalesce(sum(q.people), 0) from pedidos q where q.tipo = t.tipo and q.status = 'confirmed') as pessoas_confirmadas,
           (select count(distinct q.anuncio) from pedidos q where q.tipo = t.tipo) as anuncios_com_pedido,
           (select count(distinct q.anuncio) from pedidos q where q.tipo = t.tipo and q.status = 'confirmed') as anuncios_com_confirmado
      from (values ('ride'), ('stay')) as t(tipo)
  ),
  dias as (
    select d::date as dia from generate_series(date '2026-10-06', (now() at time zone 'Europe/Paris')::date, interval '1 day') d
  )
  select jsonb_build_object(
    'gerado_em', now(),
    'totais', jsonb_build_object(
      'anuncios', (select count(*) from anuncios),
      'paises', (select count(distinct country_code) from locais),
      'cidades', (select count(distinct voting_city_id) from locais),
      'quem_oferece', (select count(distinct dono) from anuncios),
      'quem_pede', (select count(distinct whatsapp) from pedidos),
      'contas', (select count(*) from auth.users),
      'avisos_confirmados', (select count(*) from public.alerts a where a.confirmed_at is not null)
    ),
    'por_tipo', (select jsonb_object_agg(tipo, to_jsonb(p) - 'tipo') from por_tipo p),
    'por_dia', (select jsonb_agg(jsonb_build_object(
        'dia', d.dia,
        'caronas', (select count(*) from anuncios a where a.tipo = 'ride' and (a.created_at at time zone 'Europe/Paris')::date = d.dia),
        'hospedagens', (select count(*) from anuncios a where a.tipo = 'stay' and (a.created_at at time zone 'Europe/Paris')::date = d.dia),
        'pedidos', (select count(*) from pedidos q where (q.created_at at time zone 'Europe/Paris')::date = d.dia),
        'confirmados', (select count(*) from pedidos q where q.status = 'confirmed' and (q.decided_at at time zone 'Europe/Paris')::date = d.dia)
      ) order by d.dia) from dias d),
    'paises', (select coalesce(jsonb_agg(x order by x.anuncios desc, x.nome), '[]') from (
        select l.country_code as codigo, l.pais as nome, count(*) as anuncios,
               count(*) filter (where l.tipo = 'ride') as caronas, count(*) filter (where l.tipo = 'stay') as hospedagens,
               (select count(*) from pedidos q join locais l2 on l2.id = q.anuncio where l2.country_code = l.country_code) as pedidos,
               (select count(*) from pedidos q join locais l2 on l2.id = q.anuncio where l2.country_code = l.country_code and q.status = 'confirmed') as confirmados
          from locais l group by l.country_code, l.pais) x),
    'cidades', (select coalesce(jsonb_agg(x order by x.anuncios desc, x.nome), '[]') from (
        select l.slug, l.cidade as nome, l.pais, count(*) as anuncios,
               count(*) filter (where l.tipo = 'ride') as caronas, count(*) filter (where l.tipo = 'stay') as hospedagens,
               (select count(*) from pedidos q join locais l2 on l2.id = q.anuncio where l2.voting_city_id = l.voting_city_id) as pedidos,
               (select count(*) from pedidos q join locais l2 on l2.id = q.anuncio where l2.voting_city_id = l.voting_city_id and q.status = 'confirmed') as confirmados
          from locais l group by l.voting_city_id, l.slug, l.cidade, l.pais) x)
  ) into v;
  return v;
end;
$$;

revoke execute on function public.admin_stats from public, anon;
grant execute on function public.admin_stats to authenticated;
