-- Moderação de denúncias (12/10/2026): a moderação passa a ver o anúncio denunciado inteiro, com as denúncias
-- agrupadas, e pode manter o anúncio, tirar só o texto livre, remover o anúncio ou banir a pessoa.

-- Denúncias abertas agrupadas por anúncio, com o conteúdo do anúncio e quem anunciou.
create function public.admin_reports() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform private.require_admin();
  return coalesce((
    select jsonb_agg(g.item order by g.primeira)
      from (
        select min(x.created_at) as primeira,
               jsonb_build_object(
                 'kind', x.target_kind,
                 'id', x.target_id,
                 'reports', jsonb_agg(jsonb_build_object('id', x.id, 'reason', x.reason, 'created_at', x.created_at) order by x.created_at),
                 'listing', case x.target_kind
                   when 'ride' then (
                     select jsonb_build_object(
                       'status', r.status, 'owner_id', r.driver_id, 'first_name', p.first_name, 'email', u.email,
                       'city', c.name, 'city_slug', c.slug, 'origin_city', r.origin_city, 'depart_at', r.depart_at,
                       'return_at', r.return_at, 'seats_total', r.seats_total, 'seats_taken', r.seats_taken,
                       'vehicle', r.vehicle, 'meeting_hint', r.meeting_hint, 'notes', r.notes, 'women_only', r.women_only,
                       'created_at', r.created_at, 'banned', p.banned_at is not null)
                       from public.rides r join public.profiles p on p.id = r.driver_id
                       join auth.users u on u.id = r.driver_id join public.voting_cities c on c.id = r.voting_city_id
                      where r.id = x.target_id)
                   else (
                     select jsonb_build_object(
                       'status', s.status, 'owner_id', s.host_id, 'first_name', p.first_name, 'email', u.email,
                       'city', c.name, 'city_slug', c.slug, 'area_hint', s.area_hint, 'nights', s.nights,
                       'capacity', s.capacity, 'kind', s.kind, 'rules', s.rules, 'women_only', s.women_only,
                       'created_at', s.created_at, 'banned', p.banned_at is not null)
                       from public.stays s join public.profiles p on p.id = s.host_id
                       join auth.users u on u.id = s.host_id join public.voting_cities c on c.id = s.voting_city_id
                      where s.id = x.target_id)
                 end) as item
          from public.reports x
         where x.resolved_at is null
         group by x.target_kind, x.target_id
      ) g), '[]'::jsonb);
end;
$$;

-- Fecha todas as denúncias abertas de um anúncio.
create function public.admin_close_reports(p_kind public.listing_kind, p_id uuid) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_n integer;
begin
  perform private.require_admin();
  update public.reports x set resolved_at = now()
   where x.target_kind = p_kind and x.target_id = p_id and x.resolved_at is null;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- Tira o texto livre do anúncio (observações e ponto de encontro da carona; regras da hospedagem) e o deixa no ar.
create function public.admin_clear_text(p_kind public.listing_kind, p_id uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.require_admin();
  if p_kind = 'ride' then
    update public.rides r set notes = null, meeting_hint = null, reviewed_at = now(), updated_at = now() where r.id = p_id;
  else
    update public.stays s set rules = null, reviewed_at = now(), updated_at = now() where s.id = p_id;
  end if;
  if not found then
    raise exception 'not_found';
  end if;
end;
$$;

revoke execute on function public.admin_reports, public.admin_close_reports, public.admin_clear_text from public, anon;
grant execute on function public.admin_reports, public.admin_close_reports, public.admin_clear_text to authenticated;
