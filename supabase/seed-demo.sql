-- DADOS DE DEMONSTRAÇÃO, SÓ PARA O AMBIENTE LOCAL.
-- Pessoas e anúncios fictícios. O `supabase db push` não roda seeds, então nada disso vai para produção.
-- Para entrar como uma delas localmente, peça o código com o e-mail e leia no Mailpit (http://127.0.0.1:54324).

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select '00000000-0000-0000-0000-000000000000', d.id, 'authenticated', 'authenticated', d.email, '', now(),
       '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''
  from (values
    ('d0000000-0000-4000-8000-000000000001'::uuid, 'marina.demo@exemplo.local'),
    ('d0000000-0000-4000-8000-000000000002'::uuid, 'tiago.demo@exemplo.local'),
    ('d0000000-0000-4000-8000-000000000003'::uuid, 'helena.demo@exemplo.local'),
    ('d0000000-0000-4000-8000-000000000004'::uuid, 'rafael.demo@exemplo.local'),
    ('d0000000-0000-4000-8000-000000000005'::uuid, 'julia.demo@exemplo.local'),
    ('d0000000-0000-4000-8000-000000000006'::uuid, 'joao.demo@exemplo.local')
  ) as d(id, email);

insert into public.profiles (id, first_name, consented_at) values
  ('d0000000-0000-4000-8000-000000000001', 'Marina', now()),
  ('d0000000-0000-4000-8000-000000000002', 'Tiago', now()),
  ('d0000000-0000-4000-8000-000000000003', 'Helena', now()),
  ('d0000000-0000-4000-8000-000000000004', 'Rafael', now()),
  ('d0000000-0000-4000-8000-000000000005', 'Júlia', now()),
  ('d0000000-0000-4000-8000-000000000006', 'João', now());

-- A Marina é admin no ambiente local, para testar a moderação.
insert into public.admins (user_id) values ('d0000000-0000-4000-8000-000000000001');

insert into public.rides (id, driver_id, voting_city_id, origin_city, origin_lat, origin_lon, depart_at, return_at,
                          seats_total, vehicle, meeting_hint, women_only)
select x.id, x.driver, c.id, x.origem, x.lat, x.lon, x.saida::timestamptz, x.volta::timestamptz, x.vagas,
       x.veiculo::public.vehicle, x.encontro, x.mulheres
  from (values
    ('e0000000-0000-4000-8000-000000000001'::uuid, 'd0000000-0000-4000-8000-000000000001'::uuid, 'paris', 'Lyon', 45.764, 4.836,
     '2026-10-24 07:00+02', '2026-10-25 18:00+01', 3::smallint, 'car', 'Perto da estação Part-Dieu', false),
    ('e0000000-0000-4000-8000-000000000002'::uuid, 'd0000000-0000-4000-8000-000000000002'::uuid, 'paris', 'Lille', 50.629, 3.057,
     '2026-10-25 06:30+01', '2026-10-25 17:30+01', 2::smallint, 'car', 'Lille-Flandres', false),
    ('e0000000-0000-4000-8000-000000000003'::uuid, 'd0000000-0000-4000-8000-000000000005'::uuid, 'paris', 'Bordeaux', 44.838, -0.579,
     '2026-10-23 18:00+02', '2026-10-26 10:00+01', 4::smallint, 'van', 'Estação Saint-Jean', true),
    ('e0000000-0000-4000-8000-000000000004'::uuid, 'd0000000-0000-4000-8000-000000000004'::uuid, 'marselha', 'Nice', 43.710, 7.262,
     '2026-10-25 07:00+01', '2026-10-25 16:00+01', 2::smallint, 'car', 'Gare de Nice-Ville', false),
    ('e0000000-0000-4000-8000-000000000005'::uuid, 'd0000000-0000-4000-8000-000000000006'::uuid, 'lisboa', 'Coimbra', 40.203, -8.410,
     '2026-10-25 07:30+00', null, 3::smallint, 'car', 'Estação Coimbra-B', false),
    ('e0000000-0000-4000-8000-000000000006'::uuid, 'd0000000-0000-4000-8000-000000000006'::uuid, 'londres', 'Manchester', 53.481, -2.243,
     '2026-10-24 15:00+01', '2026-10-25 19:00+00', 3::smallint, 'car', 'Piccadilly', false)
  ) as x(id, driver, cidade, origem, lat, lon, saida, volta, vagas, veiculo, encontro, mulheres)
  join public.voting_cities c on c.slug = x.cidade;

insert into public.stays (id, host_id, voting_city_id, area_hint, nights, capacity, kind, rules, women_only)
select x.id, x.host, c.id, x.bairro, x.noites::date[], x.cap, x.tipo::public.stay_kind, x.regras, x.mulheres
  from (values
    ('f0000000-0000-4000-8000-000000000001'::uuid, 'd0000000-0000-4000-8000-000000000003'::uuid, 'paris', 'Belleville',
     '{2026-10-24,2026-10-25}', 2::smallint, 'couch', 'Sem fumar. Chegada até 22h.', true),
    ('f0000000-0000-4000-8000-000000000002'::uuid, 'd0000000-0000-4000-8000-000000000003'::uuid, 'paris', 'Montreuil',
     '{2026-10-24}', 1::smallint, 'mattress', null, false),
    ('f0000000-0000-4000-8000-000000000003'::uuid, 'd0000000-0000-4000-8000-000000000006'::uuid, 'lisboa', 'Arroios',
     '{2026-10-24,2026-10-25}', 2::smallint, 'room', 'Tem gato em casa.', false)
  ) as x(id, host, cidade, bairro, noites, cap, tipo, regras, mulheres)
  join public.voting_cities c on c.slug = x.cidade;

-- Um pedido pendente na carona da Marina, para ver a gestão funcionando.
insert into public.ride_requests (ride_id, first_name, whatsapp, email, people, message, cancel_token_hash)
values ('e0000000-0000-4000-8000-000000000001', 'Ana', '+33600000011', 'ana.demo@exemplo.local', 1,
        'Oi Marina, voto em Paris e moro em Lyon. Posso ir com você?', encode(sha256('demo-token-1'::bytea), 'hex'));
