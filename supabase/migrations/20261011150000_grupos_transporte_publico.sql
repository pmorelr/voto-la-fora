-- Grupos de viagem em transporte público regular (11/10/2026, sugestão de um usuário em Nijmegen): a "carona" passa a
-- aceitar trem e ônibus de linha, em grupo, cada pessoa com a própria passagem. Mesmo fluxo de pedido e confirmação.
alter type public.vehicle add value if not exists 'train';
alter type public.vehicle add value if not exists 'bus';
