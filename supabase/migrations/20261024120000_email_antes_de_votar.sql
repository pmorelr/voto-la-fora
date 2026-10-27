-- E-mail "antes de votar" (24/10/2026): um e-mail por pessoa com contato confirmado, de cada lado (quem pediu e
-- quem oferece), com a lista dos contatos, dicas e o pedido de relato. Envio único, pela rotina /api/cron/antes-de-votar;
-- private.campaign_sent impede que alguém receba duas vezes.

create table private.campaign_sent (
  campaign text not null,
  role     text not null check (role in ('requester', 'offerer')),
  email    text not null,
  sent_at  timestamptz not null default now(),
  primary key (campaign, role, email)
);

create function public.trip_tips_recipients(p_campaign text) returns jsonb
language sql stable security definer set search_path = ''
as $$
  with conf as (
    select 'ride'::text as kind, lower(q.email) as req_email, q.first_name as req_name, q.people, q.created_at,
           r.driver_id as owner, p.first_name as owner_name, c.name as city, c.timezone,
           r.depart_at, null::date[] as nights
      from public.ride_requests q join public.rides r on r.id = q.ride_id
      join public.profiles p on p.id = r.driver_id join public.voting_cities c on c.id = r.voting_city_id
     where q.status = 'confirmed' and p.banned_at is null
    union all
    select 'stay', lower(q.email), q.first_name, q.people, q.created_at,
           s.host_id, p.first_name, c.name, c.timezone, null, q.nights
      from public.stay_requests q join public.stays s on s.id = q.stay_id
      join public.profiles p on p.id = s.host_id join public.voting_cities c on c.id = s.voting_city_id
     where q.status = 'confirmed' and p.banned_at is null
  ),
  pending as (
    select r.driver_id as owner, count(*) as n from public.ride_requests q join public.rides r on r.id = q.ride_id
     where private.req_status(q.status, q.expires_at) = 'pending' group by r.driver_id
    union all
    select s.host_id, count(*) from public.stay_requests q join public.stays s on s.id = q.stay_id
     where private.req_status(q.status, q.expires_at) = 'pending' group by s.host_id
  ),
  requesters as (
    select jsonb_build_object(
             'role', 'requester', 'email', req_email,
             'first_name', (array_agg(req_name order by created_at desc))[1],
             'contacts', jsonb_agg(jsonb_build_object('kind', kind, 'other', owner_name, 'people', people, 'city', city,
                                                      'timezone', timezone, 'depart_at', depart_at, 'nights', nights)
                                   order by coalesce(depart_at::date, nights[1]))) as r
      from conf where req_email is not null
       and not exists (select 1 from private.campaign_sent s where s.campaign = p_campaign and s.role = 'requester' and s.email = conf.req_email)
     group by req_email
  ),
  offerers as (
    select jsonb_build_object(
             'role', 'offerer', 'email', lower(u.email), 'first_name', min(conf.owner_name),
             'contacts', jsonb_agg(jsonb_build_object('kind', kind, 'other', req_name, 'people', people, 'city', city,
                                                      'timezone', timezone, 'depart_at', depart_at, 'nights', nights)
                                   order by coalesce(depart_at::date, nights[1]), req_name),
             'without_email', count(*) filter (where req_email is null),
             'pending', coalesce((select sum(n) from pending pe where pe.owner = conf.owner), 0)) as r
      from conf join auth.users u on u.id = conf.owner
     where not exists (select 1 from private.campaign_sent s where s.campaign = p_campaign and s.role = 'offerer' and s.email = lower(u.email))
     group by conf.owner, u.email
  )
  select coalesce(jsonb_agg(r), '[]'::jsonb) from (select r from requesters union all select r from offerers) x;
$$;

create function public.mark_campaign_sent(p_campaign text, p_role text, p_emails text[]) returns void
language sql security definer set search_path = ''
as $$
  insert into private.campaign_sent (campaign, role, email)
  select p_campaign, p_role, lower(e) from unnest(p_emails) e
  on conflict do nothing;
$$;

revoke execute on function public.trip_tips_recipients from public, anon, authenticated;
revoke execute on function public.mark_campaign_sent from public, anon, authenticated;
grant execute on function public.trip_tips_recipients to service_role;
grant execute on function public.mark_campaign_sent to service_role;
