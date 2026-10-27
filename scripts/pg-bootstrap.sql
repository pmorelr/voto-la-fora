-- Emula o mínimo do Supabase num Postgres puro, para validar migrations e
-- testes sem o stack completo (útil quando o Docker não consegue baixar imagens).
-- Não substitui `supabase test db`, que roda no Postgres real do Supabase.

create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
create table auth.users (
  id         uuid primary key,
  email      varchar(255),
  aud        varchar(255),
  role       varchar(255),
  created_at timestamptz default now()
);
create function auth.uid() returns uuid
language sql stable
as $$
  select nullif(coalesce(
    current_setting('request.jwt.claim.sub', true),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  ), '')::uuid
$$;
grant execute on function auth.uid() to anon, authenticated, service_role;

create schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

-- pgTAP mínimo: ok, is, lives_ok, throws_ok, no_plan, finish.
create schema tap;
grant usage on schema tap to public;
create table tap.results (n serial primary key, passed boolean not null, description text);
grant select, insert on tap.results to public;
grant usage, select on sequence tap.results_n_seq to public;

create function tap.record(p boolean, d text, diag text default null) returns text
language plpgsql as $$
declare
  k integer;
begin
  insert into tap.results (passed, description) values (coalesce(p, false), d) returning n into k;
  if coalesce(p, false) then
    return format('ok %s - %s', k, d);
  end if;
  return format('not ok %s - %s', k, d) || coalesce(E'\n#   ' || diag, '');
end;
$$;

create function tap.no_plan() returns text language sql as $$ select 'plan: no_plan'::text $$;

create function tap.ok(p boolean, d text) returns text
language sql as $$ select tap.record(p, d) $$;

create function tap."is"(have anyelement, want anyelement, d text) returns text
language plpgsql as $$
begin
  return tap.record(have is not distinct from want, d, format('have: %s | want: %s', have, want));
end;
$$;

create function tap.lives_ok(sql text, d text) returns text
language plpgsql as $$
begin
  execute sql;
  return tap.record(true, d);
exception when others then
  return tap.record(false, d, format('died: %s %s', sqlstate, sqlerrm));
end;
$$;

create function tap.throws_ok(sql text, errcode text, errmsg text, d text) returns text
language plpgsql as $$
begin
  execute sql;
  return tap.record(false, d, 'no exception thrown');
exception when others then
  return tap.record(
    sqlstate = errcode and (errmsg is null or sqlerrm = errmsg), d,
    format('caught: %s %s | wanted: %s %s', sqlstate, sqlerrm, errcode, coalesce(errmsg, '*')));
end;
$$;

create function tap.finish() returns setof text
language plpgsql as $$
declare
  total  integer;
  failed integer;
begin
  select count(*), count(*) filter (where not passed) into total, failed from tap.results;
  return next format('1..%s', total);
  if failed > 0 then
    raise exception '% de % testes falharam', failed, total;
  end if;
  return next format('# todos os %s testes passaram', total);
end;
$$;
