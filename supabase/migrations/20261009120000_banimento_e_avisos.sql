-- Auditoria de segurança de 09/10/2026, itens M2 e M3.

-- M2. O banimento ficava no perfil: quem era banido apagava a conta e entrava de novo com o mesmo e-mail.
-- Agora o banimento também guarda um resumo codificado (SHA-256) do e-mail, conferido ao criar o perfil.
-- Apagado com o resto em 15/11/2026.
create table private.banned_emails (
  email_hash text primary key,
  banned_at  timestamptz not null default now()
);

insert into private.banned_emails (email_hash, banned_at)
select private.hash_token(lower(btrim(u.email))), p.banned_at
  from public.profiles p join auth.users u on u.id = p.id
 where p.banned_at is not null and u.email is not null
on conflict do nothing;

create or replace function public.admin_ban(p_user_id uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.require_admin();
  update public.profiles p set banned_at = now() where p.id = p_user_id and p.banned_at is null;
  insert into private.banned_emails (email_hash)
  select private.hash_token(lower(btrim(u.email))) from auth.users u where u.id = p_user_id and u.email is not null
  on conflict do nothing;
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

create or replace function public.save_profile(p_first_name text, p_consent boolean) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from public.profiles p where p.id = v_uid and p.banned_at is not null)
     or exists (select 1 from auth.users u join private.banned_emails b on b.email_hash = private.hash_token(lower(btrim(u.email)))
                 where u.id = v_uid) then
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

-- M3. Pedir o "Me avise" com o e-mail de outra pessoa desconfirmava o aviso dela e trocava o link de cancelar.
-- Um aviso já confirmado não muda mais por esse formulário; a função avisa o servidor, que manda à dona do e-mail
-- só um lembrete de que ela já recebe os avisos (quem preencheu não fica sabendo de nada).
create or replace function public.create_alert(
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
  if exists (select 1 from public.alerts a
              where lower(a.email) = lower(btrim(p_email)) and a.voting_city_id = v_city.id and a.confirmed_at is not null) then
    return jsonb_build_object('already_confirmed', true, 'city_name', v_city.name, 'city_slug', v_city.slug);
  end if;
  insert into public.alerts as a (email, voting_city_id, kind, origin_hint, confirm_token_hash, unsubscribe_token, ip_hash)
  values (lower(btrim(p_email)), v_city.id, coalesce(p_kind, 'both'), nullif(btrim(p_origin_hint), ''),
          private.hash_token(v_confirm), v_unsub, p_ip_hash)
  on conflict (lower(email), voting_city_id) do update
    set kind = excluded.kind, origin_hint = excluded.origin_hint,
        confirm_token_hash = excluded.confirm_token_hash, unsubscribe_token = excluded.unsubscribe_token,
        ip_hash = excluded.ip_hash, created_at = now();
  return jsonb_build_object('confirm_token', v_confirm, 'unsubscribe_token', v_unsub,
                            'city_name', v_city.name, 'city_slug', v_city.slug, 'already_confirmed', false);
end;
$$;
