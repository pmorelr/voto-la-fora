-- Testes de segurança e regras de negócio do schema v2. Rodar com: pnpm db:test (ou pnpm db:test:pg)
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- ---------------------------------------------------------------------
-- Visitante anônimo
-- ---------------------------------------------------------------------
set local role anon;
select ok((select count(*) from public.countries) >= 100, 'anônimo lê os países');
select is((select count(*)::int from public.voting_cities where has_section), 164, 'anônimo lê os 164 locais de votação');
select is((select count(*)::int from public.voting_cities where has_section and country_code = 'GB'), 2, 'Reino Unido: só Londres e Edimburgo');
select is((select count(*)::int from public.voting_cities where has_section and parent_id is null), 144, 'dos quais 144 são cidades do TSE');
select is((select count(*)::int from public.voting_cities where has_section and slug in ('hyannis', 'ciudad-guayana', 'tripoli')), 0, 'sem destino onde não há urna: Hyannis, Ciudad Guayana, Trípoli');
select is((select count(distinct country_code)::int from public.voting_cities where has_section), 102, 'locais em 102 países');
select ok((select count(*) from public.countries_overview()) >= 100, 'anônimo vê o resumo por país');
select throws_ok($$select public.admin_stats()$$, '42501', null, 'visitante não vê o painel de números');
select ok((public.ride_demand() ? 'origens') and public.ride_demand()::text not like '%@%', 'visitante vê onde falta carona, só com totais e sem e-mail');
select ok((select people >= 0 and rides >= 0 and stays >= 0 and requests >= 0 from public.site_stats()), 'anônimo vê o contador da página inicial, só com totais');
select is((select count(*)::int from public.country_overview('FR')), 2, 'França tem duas cidades com seção');
select is((public.city_listings('paris') -> 'city' ->> 'name'), 'Paris', 'anônimo vê a página de Paris');
select is(public.city_listings('cidade-que-nao-existe'), null, 'cidade inexistente devolve nulo');

-- Locais de votação: Hamburgo vota dentro da seção de Berlim, e Colônia dentro da de Frankfurt.
select is((select count(*)::int from public.country_overview('DE')), 5, 'Alemanha tem 3 cidades do TSE e 2 locais extras');
select is((select voters from public.countries_overview() where code = 'DE'), 41401, 'eleitores do país só contam as cidades do TSE');
select is((select cities from public.countries_overview() where code = 'DE'), 5, 'cada local conta como destino no país');
select is((select voters from public.country_overview('DE') where slug = 'hamburgo'), 4654, 'o pino do local mostra os eleitores dele');
select is((public.city_listings('hamburgo') -> 'city' ->> 'jurisdiction'), 'Berlim', 'o local extra aponta para a seção de Berlim');
select is(jsonb_array_length(public.city_listings('berlim') -> 'city' -> 'places'), 2, 'Berlim lista os próprios locais');
select is((public.city_listings('berlim') -> 'city' -> 'places' -> 0 ->> 'slug'), 'berlim', 'a cidade do TSE vem primeiro');
select is(jsonb_array_length(public.city_listings('paris') -> 'city' -> 'places'), 1, 'cidade sem local extra lista só a si mesma');
select throws_ok('select count(*) from public.rides', '42501', null, 'anônimo não lê caronas direto');
select throws_ok('select count(*) from public.ride_requests', '42501', null, 'anônimo não lê pedidos');
select throws_ok('select count(*) from public.alerts', '42501', null, 'anônimo não lê avisos');
select throws_ok($$select public.create_request('ride', gen_random_uuid(), 'X', '+33600000000', null, false, 1, null, 'mensagem', null)$$,
  '42501', null, 'anônimo não cria pedido direto, só pelo servidor');
select throws_ok($$select public.my_dashboard()$$, '42501', null, 'anônimo não acessa painel');
reset role;

-- ---------------------------------------------------------------------
-- Usuários de teste: Ana e Bruno oferecem; Davi é admin
-- ---------------------------------------------------------------------
insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'ana@teste.local',   'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'bruno@teste.local', 'authenticated', 'authenticated'),
  ('dddddddd-0000-4000-8000-000000000004', 'davi@teste.local',  'authenticated', 'authenticated');
insert into public.admins (user_id) values ('dddddddd-0000-4000-8000-000000000004');

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}';
select throws_ok($$select public.create_ride('paris','Lyon',45.76,4.83,'2026-10-24 07:00+02',null,3,'car',null,null,false)$$,
  'P0001', 'profile_required', 'sem perfil não anuncia');
select throws_ok($$select public.save_profile('Ana', false)$$, 'P0001', 'consent_required', 'sem consentimento não há perfil');
select lives_ok($$select public.save_profile('Ana', true)$$, 'Ana cria o perfil');
select throws_ok($$select public.create_ride('atlantida','Lyon',null,null,'2026-10-24 07:00+02',null,3,'car',null,null,false)$$,
  'P0001', 'city_not_found', 'cidade sem seção é recusada');
select throws_ok($$select public.create_ride('paris','Lyon',null,null,'2026-11-24 07:00+01',null,3,'car',null,null,false)$$,
  'P0001', 'depart_out_of_window', 'saída fora da janela é recusada');
select lives_ok($$select public.create_ride('paris','Lyon',45.76,4.83,'2026-10-24 07:00+02','2026-10-25 18:00+01',3,'car','Part-Dieu',null,false)$$,
  'Ana oferece carona Lyon-Paris com 3 vagas');
do $$ begin perform set_config('t.ride', (select id::text from public.rides where driver_id = 'aaaaaaaa-0000-4000-8000-000000000001' and not women_only), true); end $$;
select lives_ok($$select public.create_ride('paris','Lyon',45.76,4.83,'2026-10-24 08:00+02',null,2,'car',null,null,true)$$,
  'Ana oferece outra carona, só para mulheres');
do $$ begin perform set_config('t.ride_w', (select id::text from public.rides where driver_id = 'aaaaaaaa-0000-4000-8000-000000000001' and women_only), true); end $$;

-- O público vê o primeiro nome e nenhum contato.
reset role;
set local role anon;
select ok((select public.city_listings('paris')::text like '%"first_name": "Ana"%'), 'público vê o primeiro nome de quem oferece');
select ok((select public.city_listings('paris')::text not like '%@%'), 'nenhum e-mail aparece na página pública');
select ok((select public.city_listings('paris')::text not like '%whatsapp%'), 'nenhum WhatsApp aparece na página pública');
reset role;

-- ---------------------------------------------------------------------
-- Pedidos sem conta, criados pelo servidor
-- ---------------------------------------------------------------------
set local role service_role;
select throws_ok(format($$select public.create_request('ride', %L, 'Carla', '+33700000001', null, false, 4, null, 'Oi Ana, posso ir?', 'ip1')$$, current_setting('t.ride')),
  'P0001', 'not_enough_seats', 'não pede mais vagas do que existem');
select throws_ok(format($$select public.create_request('ride', %L, 'Bia', '+33700000009', null, false, 1, null, 'Oi Ana, posso ir?', 'ip1')$$, current_setting('t.ride_w')),
  'P0001', 'women_only', 'carona só para mulheres exige "sou mulher"');
do $$ declare r jsonb; begin
  r := public.create_request('ride', current_setting('t.ride')::uuid, 'Carla', '+33700000001', 'carla@teste.local', false, 2, null, 'Oi Ana, posso ir com você?', 'ip1');
  perform set_config('t.tok_carla', r ->> 'cancel_token', true);
  perform set_config('t.req_carla', r ->> 'id', true);
  perform set_config('t.offerer_email', r ->> 'offerer_email', true);
end $$;
select is(current_setting('t.offerer_email'), 'ana@teste.local', 'o servidor recebe o e-mail de quem oferece para avisar');
select ok(length(current_setting('t.tok_carla')) >= 32, 'o pedido devolve um token de cancelamento');
select throws_ok(format($$select public.create_request('ride', %L, 'Carla', '+33700000001', null, false, 1, null, 'De novo', 'ip1')$$, current_setting('t.ride')),
  'P0001', 'already_requested', 'o mesmo número não pede duas vezes o mesmo anúncio');
reset role;

-- Quem vê o WhatsApp
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}';
select lives_ok($$select public.save_profile('Bruno', true)$$, 'Bruno cria o perfil');
select is((select count(*)::int from public.ride_requests), 0, 'outro anunciante não vê pedidos da Ana');
select is((select count(*)::int from public.rides where id = current_setting('t.ride')::uuid), 0, 'outro anunciante não lê a carona da Ana direto');
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}';
select throws_ok($$select whatsapp from public.ride_requests limit 1$$, '42501', null, 'quem oferece não lê o WhatsApp direto na tabela');
select throws_ok($$select email from public.ride_requests limit 1$$, '42501', null, 'quem oferece não lê o e-mail de quem pediu');
select is((public.my_dashboard() -> 'rides' -> 0 -> 'requests' -> 0 ->> 'whatsapp'), null, 'pedido pendente não mostra o WhatsApp no painel');
select is((public.my_dashboard() -> 'rides' -> 0 -> 'requests' -> 0 ->> 'first_name'), 'Carla', 'o painel da Ana mostra o pedido');
select is((public.decide_request('ride', current_setting('t.req_carla')::uuid, true) ->> 'whatsapp'), '+33700000001', 'Ana confirma a Carla e recebe o WhatsApp');
select is((select r ->> 'whatsapp' from jsonb_array_elements(public.my_dashboard() -> 'rides' -> 0 -> 'requests') r where r ->> 'id' = current_setting('t.req_carla')),
  '+33700000001', 'depois de confirmar, o painel mostra o WhatsApp');
select ok((public.my_dashboard()::text not like '%carla@teste.local%'), 'o e-mail de quem pediu nunca aparece no painel');
select is((select seats_taken::int from public.rides where id = current_setting('t.ride')::uuid), 2, 'duas vagas ocupadas');
select throws_ok(format($$select public.decide_request('ride', %L, true)$$, current_setting('t.req_carla')), 'P0001', 'not_pending', 'não confirma duas vezes');
reset role;

set local role service_role;
select throws_ok(format($$select public.create_request('ride', %L, 'Dani', '+33700000002', null, false, 2, null, 'Somos dois', 'ip2')$$, current_setting('t.ride')),
  'P0001', 'not_enough_seats', 'com 1 vaga, não cabem 2');
do $$ declare r jsonb; begin
  r := public.create_request('ride', current_setting('t.ride')::uuid, 'Dani', '+33700000002', null, false, 1, null, 'Só eu', 'ip2');
  perform set_config('t.req_dani', r ->> 'id', true);
end $$;
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}';
select is((public.decide_request('ride', current_setting('t.req_dani')::uuid, true) ->> 'status'), 'confirmed', 'Ana confirma a Dani');
select is((select status from public.rides where id = current_setting('t.ride')::uuid), 'full'::public.listing_status, 'carro lotado vira "full"');
reset role;
set local role anon;
select is((select r ->> 'status' from jsonb_array_elements(public.city_listings('paris') -> 'rides') r where r ->> 'id' = current_setting('t.ride')),
  'full', 'o público vê a carona como lotada');
reset role;

-- Cancelamento pelo link
set local role service_role;
select is((public.cancel_request_by_token(current_setting('t.tok_carla')) ->> 'was_confirmed'), 'true', 'Carla cancela pelo link');
select throws_ok(format($$select public.cancel_request_by_token(%L)$$, current_setting('t.tok_carla')), 'P0001', 'not_cancellable', 'o link não cancela duas vezes');
select throws_ok($$select public.cancel_request_by_token('token-inventado')$$, 'P0001', 'not_found', 'token inventado não cancela nada');
reset role;
select is((select seats_taken::int from public.rides where id = current_setting('t.ride')::uuid), 1, 'as vagas da Carla voltam');
select is((select status from public.rides where id = current_setting('t.ride')::uuid), 'open'::public.listing_status, 'a carona volta a "open"');

-- Expiração em 48 horas
set local role service_role;
do $$ declare r jsonb; begin
  r := public.create_request('ride', current_setting('t.ride')::uuid, 'Edu', '+33700000003', null, false, 1, null, 'Posso ir?', 'ip3');
  perform set_config('t.req_edu', r ->> 'id', true);
end $$;
reset role;
update public.ride_requests set expires_at = now() - interval '1 minute' where id = current_setting('t.req_edu')::uuid;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}';
select throws_ok(format($$select public.decide_request('ride', %L, true)$$, current_setting('t.req_edu')), 'P0001', 'request_expired', 'pedido vencido não é confirmado');
select is((select r ->> 'status' from jsonb_array_elements(public.my_dashboard() -> 'rides' -> 0 -> 'requests') r where r ->> 'id' = current_setting('t.req_edu')),
  'expired', 'o painel mostra o pedido como vencido');

-- ---------------------------------------------------------------------
-- Hospedagem: capacidade por noite
-- ---------------------------------------------------------------------
select throws_ok($$select public.create_stay('paris','Belleville',array['2026-10-20']::date[],2,'couch',null,false)$$, 'P0001', 'invalid_nights', 'noite fora de 23 a 25 é recusada');
select lives_ok($$select public.create_stay('paris','Belleville',array['2026-10-25','2026-10-24','2026-10-24']::date[],2,'couch',null,false)$$, 'Ana oferece um sofá para 2');
do $$ begin perform set_config('t.stay', (select id::text from public.stays where host_id = 'aaaaaaaa-0000-4000-8000-000000000001'), true); end $$;
select is((select nights from public.stays where id = current_setting('t.stay')::uuid), array['2026-10-24','2026-10-25']::date[], 'noites ordenadas e sem repetição');
reset role;
set local role service_role;
select throws_ok(format($$select public.create_request('stay', %L, 'Fê', '+33700000004', null, false, 1, array['2026-10-23']::date[], 'Noite de 23', 'ip4')$$, current_setting('t.stay')),
  'P0001', 'invalid_nights', 'só pede noites que o anfitrião oferece');
do $$ declare r jsonb; begin
  r := public.create_request('stay', current_setting('t.stay')::uuid, 'Fê', '+33700000004', 'fe@teste.local', false, 2, array['2026-10-24']::date[], 'Somos duas na noite de 24', 'ip4');
  perform set_config('t.sreq_fe', r ->> 'id', true);
end $$;
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}';
select is((public.decide_request('stay', current_setting('t.sreq_fe')::uuid, true) ->> 'email'), null, 'confirmar não devolve o e-mail de quem pediu');
reset role;
set local role service_role;
select throws_ok(format($$select public.create_request('stay', %L, 'Gil', '+33700000005', null, false, 1, array['2026-10-24']::date[], 'Noite de 24', 'ip5')$$, current_setting('t.stay')),
  'P0001', 'not_enough_space', 'a noite de 24 já está cheia');
select lives_ok(format($$select public.create_request('stay', %L, 'Gil', '+33700000005', null, false, 1, array['2026-10-25']::date[], 'Noite de 25', 'ip5')$$, current_setting('t.stay')),
  'a noite de 25 ainda tem espaço');
reset role;

-- ---------------------------------------------------------------------
-- Pausar, reabrir, cancelar
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}';
select is((public.set_listing_status('ride', current_setting('t.ride')::uuid, 'paused') ->> 'status'), 'paused', 'Ana pausa a carona');
reset role;
set local role anon;
select is((select count(*)::int from jsonb_array_elements(public.city_listings('paris') -> 'rides') r where r ->> 'id' = current_setting('t.ride')), 0, 'carona pausada some do público');
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}';
select is((public.set_listing_status('ride', current_setting('t.ride')::uuid, 'open') ->> 'status'), 'open', 'Ana reabre a carona');
select is((jsonb_array_length(public.set_listing_status('stay', current_setting('t.stay')::uuid, 'cancelled') -> 'affected')), 2, 'cancelar devolve os pedidos afetados');
select throws_ok(format($$select public.set_listing_status('stay', %L, 'open')$$, current_setting('t.stay')), 'P0001', 'not_found', 'anúncio cancelado não reabre');

-- Limites: 3 anúncios por 24 horas
select throws_ok($$select public.create_ride('paris','Lyon',null,null,'2026-10-25 06:00+01',null,2,'car',null,null,false)$$, 'P0001', 'rate_limited', 'quarto anúncio em 24 horas é recusado');
reset role;

-- Limite: 3 pedidos pendentes por número
set local role service_role;
do $$ begin
  perform public.create_request('ride', current_setting('t.ride')::uuid, 'Hugo', '+33700000006', null, false, 1, null, 'Pedido 1', 'ip6');
  perform public.create_request('ride', current_setting('t.ride_w')::uuid, 'Hugo', '+33700000006', null, true, 1, null, 'Pedido 2', 'ip6');
end $$;
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}';
select lives_ok($$select public.create_ride('paris','Rouen',49.44,1.09,'2026-10-25 07:00+01',null,3,'car',null,null,false)$$, 'Bruno oferece carona de Rouen');
do $$ begin perform set_config('t.ride_bruno', (select id::text from public.rides where driver_id = 'bbbbbbbb-0000-4000-8000-000000000002'), true); end $$;
reset role;
set local role service_role;
select lives_ok(format($$select public.create_request('ride', %L, 'Hugo', '+33700000006', null, false, 1, null, 'Pedido 3', 'ip6')$$, current_setting('t.ride_bruno')), 'terceiro pedido pendente passa');
select throws_ok(format($$select public.create_request('ride', %L, 'Hugo', '+33700000006', null, false, 1, null, 'Pedido 4', 'ip6')$$, current_setting('t.ride_bruno')),
  'P0001', 'too_many_pending', 'quarto pedido pendente do mesmo número é recusado');
reset role;

-- Lembrete de 24 horas
update public.ride_requests set created_at = now() - interval '25 hours' where first_name = 'Hugo' and ride_id = current_setting('t.ride_bruno')::uuid;
set local role service_role;
select ok((select public.pending_reminders()::text like '%bruno@teste.local%'), 'quem tem pedido parado há 24 horas recebe lembrete');
select ok((select public.pending_reminders()::text not like '%bruno@teste.local%'), 'o lembrete não se repete');
reset role;

-- ---------------------------------------------------------------------
-- "Me avise"
-- ---------------------------------------------------------------------
set local role service_role;
do $$ declare r jsonb; begin
  r := public.create_alert('Leo@Teste.local', 'paris', 'both', null, 'ip7');
  perform set_config('t.alert_confirm', r ->> 'confirm_token', true);
  perform set_config('t.alert_unsub', r ->> 'unsubscribe_token', true);
end $$;
select is((public.alerts_digest()::text like '%leo@teste.local%'), false, 'aviso sem confirmação não recebe nada');
select is((public.confirm_alert(current_setting('t.alert_confirm')) ->> 'city_slug'), 'paris', 'confirmação pelo link');
reset role;
update public.alerts set confirmed_at = now() - interval '1 hour' where email = 'leo@teste.local';
set local role service_role;
select ok((public.alerts_digest()::text like '%leo@teste.local%'), 'aviso confirmado recebe as novidades');
select lives_ok($$select public.mark_alerts_sent(array(select (x ->> 'alert_id')::uuid from jsonb_array_elements(public.alerts_digest()) x))$$, 'marca como enviado');
select ok((public.alerts_digest()::text not like '%leo@teste.local%'), 'sem novidade, sem e-mail');
select is(public.unsubscribe_alert(current_setting('t.alert_unsub')), true, 'descadastro em um clique');
select is(public.unsubscribe_alert(current_setting('t.alert_unsub')), false, 'descadastro repetido não faz nada');
-- Auditoria M3: pedir de novo com o e-mail de alguém não desconfirma o aviso dela.
do $$ declare r jsonb; begin
  r := public.create_alert('maria@teste.local', 'paris', 'both', null, 'ip9');
  perform public.confirm_alert(r ->> 'confirm_token');
  perform set_config('t.maria_unsub', r ->> 'unsubscribe_token', true);
end $$;
select is((public.create_alert('Maria@teste.local', 'paris', 'ride', null, 'ip10') ->> 'already_confirmed'), 'true', 'aviso já confirmado: a função avisa e não muda nada');
reset role;
select ok((select confirmed_at is not null and unsubscribe_token = current_setting('t.maria_unsub') and kind = 'both' from public.alerts where email = 'maria@teste.local'),
  'o aviso continua confirmado, com o mesmo link de cancelar');

-- ---------------------------------------------------------------------
-- Denúncia e moderação
-- ---------------------------------------------------------------------
set local role service_role;
select lives_ok(format($$select public.report_listing('ride', %L, 'Parece anúncio falso', null, 'ip8')$$, current_setting('t.ride_bruno')), 'visitante denuncia');
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}';
select throws_ok($$select public.admin_queue()$$, 'P0001', 'forbidden', 'quem não é admin não modera');
select throws_ok($$select public.admin_stats()$$, 'P0001', 'forbidden', 'quem não é admin não vê os números');
select throws_ok($$select public.admin_reports()$$, 'P0001', 'forbidden', 'quem não é admin não vê as denúncias');
select throws_ok(format($$select public.admin_clear_text('ride', %L)$$, current_setting('t.ride_bruno')), 'P0001', 'forbidden', 'quem não é admin não mexe no anúncio');
set local request.jwt.claims = '{"sub":"dddddddd-0000-4000-8000-000000000004","role":"authenticated"}';
select lives_ok($$select public.save_profile('Davi', true)$$, 'Davi cria o perfil');
select ok((jsonb_array_length(public.admin_queue() -> 'reports') >= 1), 'admin vê a denúncia');
select ok((public.admin_stats() -> 'totais' ->> 'anuncios')::int >= 1, 'admin vê o painel de números');
select is((select count(*)::int from jsonb_array_elements(public.admin_reports()) d where d ->> 'id' = current_setting('t.ride_bruno')), 1, 'admin vê o anúncio denunciado agrupado');
select ok((select (d -> 'listing' ->> 'origin_city') is not null from jsonb_array_elements(public.admin_reports()) d where d ->> 'id' = current_setting('t.ride_bruno')), 'com o conteúdo do anúncio');
select lives_ok(format($$select public.admin_clear_text('ride', %L)$$, current_setting('t.ride_bruno')), 'admin tira o texto do anúncio');
select is((select notes from public.rides where id = current_setting('t.ride_bruno')::uuid), null, 'as observações saem');
select ok(public.admin_close_reports('ride', current_setting('t.ride_bruno')::uuid) >= 1, 'admin fecha as denúncias do anúncio');
select is((select count(*)::int from jsonb_array_elements(public.admin_reports()) d where d ->> 'id' = current_setting('t.ride_bruno')), 0, 'o anúncio sai da lista de denúncias');
select is((public.admin_review('ride', current_setting('t.ride_bruno')::uuid, false) ->> 'status'), 'removed', 'admin remove a carona do Bruno');
reset role;
set local role anon;
select is((select count(*)::int from jsonb_array_elements(public.city_listings('paris') -> 'rides') r where r ->> 'id' = current_setting('t.ride_bruno')), 0, 'carona removida some do público');
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"dddddddd-0000-4000-8000-000000000004","role":"authenticated"}';
select lives_ok($$select public.admin_ban('aaaaaaaa-0000-4000-8000-000000000001')$$, 'admin bane a Ana');
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}';
select throws_ok($$select public.create_ride('paris','Lyon',null,null,'2026-10-25 06:00+01',null,2,'car',null,null,false)$$, 'P0001', 'banned', 'banida não anuncia');
reset role;
set local role anon;
select is((select count(*)::int from jsonb_array_elements(public.city_listings('paris') -> 'rides') r where r ->> 'first_name' = 'Ana'), 0, 'anúncios da banida somem');
reset role;

-- ---------------------------------------------------------------------
-- Limpeza diária
-- ---------------------------------------------------------------------
set local role service_role;
do $$ begin
  perform public.create_alert('velho@teste.local', 'paris', 'both', null, 'ip8');
  perform public.create_alert('novo@teste.local', 'paris', 'both', null, 'ip8');
  perform public.create_alert('refeito@teste.local', 'paris', 'both', null, 'ip8');
end $$;
reset role;
update public.alerts set created_at = now() - interval '49 hours' where email in ('velho@teste.local', 'refeito@teste.local');
update public.ride_requests set created_at = now() - interval '8 days' where id = current_setting('t.req_carla')::uuid;
set local role service_role;
select lives_ok($$select public.create_alert('refeito@teste.local', 'paris', 'ride', null, 'ip8')$$, 'reinscrição no "Me avise"');
select lives_ok($$select public.purge_stale_data()$$, 'a limpeza diária roda');
reset role;
select is((select count(*)::int from public.alerts where email = 'velho@teste.local'), 0, '"Me avise" sem confirmação some depois de 48 horas');
select is((select count(*)::int from public.alerts where email = 'novo@teste.local'), 1, '"Me avise" recente sem confirmação fica');
select is((select count(*)::int from public.alerts where email = 'refeito@teste.local'), 1, 'a reinscrição reinicia o prazo de 48 horas');
select is((select count(*)::int from public.ride_requests where id = current_setting('t.req_carla')::uuid and ip_hash is null), 1,
  'o resumo do IP some depois de 7 dias');
select is((select count(*)::int from public.ride_requests where id = current_setting('t.req_edu')::uuid and ip_hash is not null), 1,
  'o resumo do IP recente fica');
set local role anon;
select throws_ok($$select public.purge_stale_data()$$, '42501', null, 'visitante não roda a limpeza');
reset role;
set local role service_role;
select ok((public.purge_stale_data(timestamptz '2026-10-26 13:00:00+00') ->> 'alerts_deleted')::int >= 2, 'no dia seguinte ao 2º turno, os avisos são apagados');
reset role;
select is((select count(*)::int from public.alerts), 0, 'nenhum aviso sobra depois do 2º turno');

-- ---------------------------------------------------------------------
-- Exclusão de conta
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}';
select lives_ok($$select public.delete_my_account()$$, 'Bruno apaga a conta');
reset role;
select is((select count(*)::int from auth.users where id = 'bbbbbbbb-0000-4000-8000-000000000002'), 0, 'some de auth.users');
select is((select count(*)::int from public.rides where driver_id = 'bbbbbbbb-0000-4000-8000-000000000002'), 0, 'os anúncios dele somem junto');
select is((select count(*)::int from public.ride_requests where ride_id = current_setting('t.ride_bruno')::uuid), 0, 'e os pedidos recebidos também');

-- Auditoria M2: a banida apaga a conta e volta com o mesmo e-mail.
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}';
select lives_ok($$select public.delete_my_account()$$, 'a banida apaga a própria conta');
reset role;
insert into auth.users (id, email, aud, role) values ('aaaaaaaa-0000-4000-8000-000000000009', 'ANA@teste.local', 'authenticated', 'authenticated');
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000009","role":"authenticated"}';
select throws_ok($$select public.save_profile('Ana', true)$$, 'P0001', 'banned', 'com o mesmo e-mail, não cria perfil novo');
reset role;

select * from finish();
rollback;
