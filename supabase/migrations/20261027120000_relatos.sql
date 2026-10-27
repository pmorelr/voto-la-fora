-- Mural de relatos (26/10/2026). Um e-mail a quem usou o site leva um link pessoal (/relato?c=...) para um formulário:
-- relato, primeiro nome e cidade opcionais e a autorização de publicar. Nada aparece sem aprovação na moderação.
-- O convite liga o link ao e-mail só até a limpeza de 15/11/2026; o relato guarda apenas o resumo do código, nunca o
-- e-mail, e fica depois dessa data se a pessoa autorizou.

alter table private.campaign_sent drop constraint campaign_sent_role_check;
alter table private.campaign_sent add constraint campaign_sent_role_check check (role in ('requester', 'offerer', 'all'));

create table private.story_invites (
  token_hash text primary key,
  campaign   text not null,
  email      text not null,
  created_at timestamptz not null default now()
);

create table public.stories (
  id           uuid primary key default gen_random_uuid(),
  invite_hash  text not null unique,
  body         text not null check (char_length(btrim(body)) between 10 and 1500),
  first_name   text check (first_name is null or char_length(btrim(first_name)) between 1 and 30),
  city         text check (city is null or char_length(btrim(city)) between 1 and 60),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  consented_at timestamptz not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  reviewed_at  timestamptz
);
alter table public.stories enable row level security;

-- Quem recebe o convite: quem publicou anúncio (conta não banida) e quem pediu vaga deixando e-mail. Um por e-mail.
create function private.story_audience(p_campaign text)
returns table (email text, first_name text)
language sql stable security definer set search_path = ''
as $$
  with todos as (
    select lower(u.email) as email, p.first_name, 1 as prio, p.created_at
      from public.profiles p join auth.users u on u.id = p.id
     where p.banned_at is null
       and (exists (select 1 from public.rides r where r.driver_id = p.id) or exists (select 1 from public.stays s where s.host_id = p.id))
    union all
    select lower(q.email), q.first_name, 2, q.created_at from public.ride_requests q where q.email is not null
    union all
    select lower(q.email), q.first_name, 2, q.created_at from public.stay_requests q where q.email is not null
  )
  select distinct on (t.email) t.email, t.first_name
    from todos t
   where not exists (select 1 from private.campaign_sent c where c.campaign = p_campaign and c.role = 'all' and c.email = t.email)
   order by t.email, t.prio, t.created_at desc;
$$;

create function public.story_audience_count(p_campaign text) returns integer
language sql stable security definer set search_path = ''
as $$ select count(*)::int from private.story_audience(p_campaign) $$;

-- Cria um convite por pessoa que ainda não recebeu e devolve o código, que só vai no e-mail.
create function public.story_invites_create(p_campaign text) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_out jsonb := '[]'::jsonb;
  v_row record;
  v_token text;
begin
  for v_row in select * from private.story_audience(p_campaign) loop
    v_token := private.new_token();
    insert into private.story_invites (token_hash, campaign, email) values (private.hash_token(v_token), p_campaign, v_row.email);
    v_out := v_out || jsonb_build_object('email', v_row.email, 'first_name', v_row.first_name, 'token', v_token);
  end loop;
  return v_out;
end;
$$;

-- O formulário: confere o código e devolve o relato já enviado, se houver.
create function public.story_get(p_token text) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select case when not exists (select 1 from private.story_invites i where i.token_hash = private.hash_token(p_token))
              then jsonb_build_object('valid', false)
              else jsonb_build_object('valid', true, 'story', (
                select jsonb_build_object('body', s.body, 'first_name', s.first_name, 'city', s.city, 'status', s.status)
                  from public.stories s where s.invite_hash = private.hash_token(p_token)))
         end;
$$;

-- Envia ou substitui o relato. Uma edição volta para a fila da moderação.
create function public.story_submit(p_token text, p_body text, p_first_name text, p_city text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_hash text := private.hash_token(p_token);
begin
  if not exists (select 1 from private.story_invites i where i.token_hash = v_hash) then
    raise exception 'invalid_token';
  end if;
  insert into public.stories (invite_hash, body, first_name, city, consented_at)
  values (v_hash, btrim(p_body), nullif(btrim(p_first_name), ''), nullif(btrim(p_city), ''), now())
  on conflict (invite_hash) do update
    set body = excluded.body, first_name = excluded.first_name, city = excluded.city,
        consented_at = now(), updated_at = now(), status = 'pending', reviewed_at = null;
end;
$$;

-- Mural público: só os aprovados, sem nada que identifique além do que a pessoa escreveu.
create function public.public_stories() returns table (id uuid, body text, first_name text, city text)
language sql stable security definer set search_path = ''
as $$
  select s.id, s.body, s.first_name, s.city from public.stories s where s.status = 'approved' order by s.reviewed_at, s.created_at;
$$;

create function public.admin_stories() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform private.require_admin();
  return coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'body', s.body, 'first_name', s.first_name, 'city', s.city,
                                                       'status', s.status, 'created_at', s.created_at, 'updated_at', s.updated_at)
                                    order by (s.status = 'pending') desc, s.updated_at desc)
                     from public.stories s), '[]'::jsonb);
end;
$$;

create function public.admin_review_story(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.require_admin();
  if p_status not in ('pending', 'approved', 'rejected') then
    raise exception 'invalid_status';
  end if;
  update public.stories set status = p_status, reviewed_at = now() where id = p_id;
end;
$$;

revoke execute on function public.story_audience_count, public.story_invites_create, public.story_get, public.story_submit,
  public.public_stories, public.admin_stories, public.admin_review_story from public, anon, authenticated;
grant execute on function public.story_audience_count, public.story_invites_create, public.story_get, public.story_submit to service_role;
grant execute on function public.public_stories to anon, authenticated, service_role;
grant execute on function public.admin_stories, public.admin_review_story to authenticated;
