// Gera content/dados/cidades.json e supabase/seed.sql a partir dos dados do TSE: resultados do 1º turno por cidade
// (tse-exterior-1turno-2026.csv) e locais de votação do 2º turno (tse-locais-2026.json, de scripts/tse-locais.mjs).
// Coordenadas: Nominatim (OpenStreetMap), uma consulta por segundo, com cache em content/dados/geocode-cache.json.
// Uso: node scripts/build-cidades.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { paises, cidades, nomesLocais, enderecos, notasLocais, satelites, desativados } from "./cidades-base.mjs";

const CSV = "content/dados/tse-exterior-1turno-2026.csv";
const LOCAIS = "content/dados/tse-locais-2026.json";
const CACHE = "content/dados/geocode-cache.json";
const OUT_JSON = "content/dados/cidades.json";
const OUT_SQL = "supabase/seed.sql";
const UA = "voto-la-fora-dev/0.1 (geocodificacao unica de cidades com secao eleitoral brasileira)";

const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sql = (v) => (v === null || v === undefined ? "null" : typeof v === "number" || typeof v === "boolean" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

const tse = Object.fromEntries(
  readFileSync(CSV, "utf8").trim().split("\n").slice(1).map((l) => {
    const [cidade, codigo, aptos, compareceram, abstencao, pct] = l.split(",");
    return [cidade, { codigo, aptos: +aptos, compareceram: +compareceram, abstencao: +abstencao, pct: +pct }];
  }),
);

const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
const problemas = [];

async function geocode(q, cc) {
  const key = `${q}|${cc}`;
  if (cache[key]) return cache[key];
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q, countrycodes: cc, format: "jsonv2", limit: "1", "accept-language": "pt-BR" })}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Nominatim ${res.status} para ${q}`);
  const [hit] = await res.json();
  await sleep(1100);
  const val = hit ? { lat: +(+hit.lat).toFixed(5), lon: +(+hit.lon).toFixed(5), nome_osm: hit.display_name } : null;
  cache[key] = val;
  writeFileSync(CACHE, JSON.stringify(cache, null, 2) + "\n");
  return val;
}

// Locais de votação por cidade do TSE. Os que ficam em outra cidade estão em `satelites`.
const tseLocais = JSON.parse(readFileSync(LOCAIS, "utf8"));
const locaisPorCidade = tseLocais.municipios;
for (const nomeTse of Object.keys(locaisPorCidade)) if (!tse[nomeTse]) problemas.push(`cidade do arquivo de locais fora dos resultados: ${nomeTse}`);
const lista = (xs) => (xs.length > 1 ? xs.slice(0, -1).join(", ") + " e " + xs.at(-1) : xs[0]);
const chaveEndereco = (l) => l.endereco.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");

// Cidades do TSE cujos eleitores votam no mesmo prédio de outra cidade (Ciudad Guayana vota em Caracas, Trípoli em
// Túnis). Não viram destino próprio: a cidade anfitriã ganha uma observação.
// Só entre cidades onde a votação foi instalada: as dispensadas têm endereços genéricos ("EMBAIXADA DO BRASIL").
const instalada = (nomeTse) => tse[nomeTse].compareceram + tse[nomeTse].abstencao > 0;
const anfitria = {};
for (const [nomeTse, ls] of Object.entries(locaisPorCidade)) {
  if (ls.length !== 1 || !instalada(nomeTse)) continue;
  for (const [outra, os] of Object.entries(locaisPorCidade)) {
    if (outra !== nomeTse && instalada(outra) && os.some((o) => chaveEndereco(o) === chaveEndereco(ls[0]) && o.eleitores > ls[0].eleitores)) anfitria[nomeTse] = outra;
  }
}
const nomePorTse = Object.fromEntries(cidades.map(([nomeTse, nome, pais]) => [nomeTse, { nome, pais }]));
const hospedes = {};
for (const [nomeTse, outra] of Object.entries(anfitria)) {
  const { nome, pais } = nomePorTse[nomeTse];
  (hospedes[outra] ??= []).push(pais === nomePorTse[outra].pais ? nome : `${nome} (${paises[pais][0]})`);
}

const saida = [];
const extras = [];
let ordem = 0;
for (const [nomeTse, nome, pais, q, ccBusca, fuso] of cidades) {
  const d = tse[nomeTse];
  const temSecao = instalada(nomeTse);
  let coord = null;
  if (temSecao) {
    coord = await geocode(q, (ccBusca ?? pais).toLowerCase());
    if (!coord) problemas.push(`sem coordenada: ${nomeTse} (${q})`);
  }
  const doTse = temSecao && !anfitria[nomeTse] ? locaisPorCidade[nomeTse] ?? [] : [];
  if (temSecao && !anfitria[nomeTse] && !doTse.length) problemas.push(`cidade com seção sem local no TSE: ${nomeTse}`);
  const principais = doTse.filter((l) => !satelites[l.local]);
  const fora = doTse.filter((l) => satelites[l.local]);
  if (principais.length > 1) problemas.push(`mais de um local principal em ${nomeTse}: ${principais.map((l) => l.local).join(" / ")}`);
  const principal = principais[0];
  if (principal && !nomesLocais[principal.local]) problemas.push(`local sem nome de exibição: ${nomeTse} / ${principal.local}`);
  const notas = [notasLocais[nomeTse]];
  if (hospedes[nomeTse]) notas.push(`Quem é inscrito em ${lista(hospedes[nomeTse])} também vota aqui.`);
  if (fora.length) notas.push(`Esta seção também vota em ${lista(fora.map((l) => satelites[l.local][0]))}. O e-Título mostra qual é o seu local.`);
  const slugPai = slugify(nome);
  for (const l of fora) {
    const [nomeExtra, paisExtra, qExtra, fusoExtra, localExtra, codigoExtra] = satelites[l.local];
    const c = temSecao ? await geocode(qExtra, paisExtra.toLowerCase()) : null;
    if (temSecao && !c) problemas.push(`sem coordenada: ${nomeExtra} (${qExtra})`);
    extras.push({
      slug: slugify(nomeExtra), tse_code: codigoExtra, tse_name: `${nomeTse} / ${l.local}`, name: nomeExtra,
      country_code: paisExtra, timezone: fusoExtra ?? paises[paisExtra][1], lat: c?.lat ?? null, lon: c?.lon ?? null,
      voters: l.eleitores, turnout: 0, abstention_pct: null, has_section: temSecao,
      venue_name: localExtra, address: enderecos[l.local] ?? l.endereco, hours: "8h às 17h, hora local",
      notes: `Local da seção eleitoral de ${nome}. O e-Título mostra se você vota aqui ou em ${nome}.`,
      place_voters: l.eleitores, parent_tse_code: d.codigo, parent_slug: slugPai,
    });
  }
  saida.push({
    slug: slugify(nome),
    tse_code: d.codigo,
    tse_name: nomeTse,
    name: nome,
    country_code: pais,
    timezone: fuso ?? paises[pais][1],
    lat: coord?.lat ?? null,
    lon: coord?.lon ?? null,
    voters: d.aptos,
    turnout: d.compareceram,
    abstention_pct: temSecao ? d.pct : null,
    has_section: temSecao && !anfitria[nomeTse],
    votes_in: anfitria[nomeTse] ? slugify(nomePorTse[anfitria[nomeTse]].nome) : null,
    venue_name: principal ? nomesLocais[principal.local] ?? principal.local : null,
    address: principal ? enderecos[principal.local] ?? principal.endereco : null,
    hours: null,
    notes: notas.filter(Boolean).join(" ") || null,
    place_voters: fora.length && principal ? principal.eleitores : null,
    parent_tse_code: null,
    sort_order: ++ordem,
  });
}
for (const e of extras) e.sort_order = ++ordem;

const slugs = new Set();
for (const c of [...saida, ...extras]) {
  if (slugs.has(c.slug)) problemas.push(`slug repetido: ${c.slug}`);
  slugs.add(c.slug);
}

const listaPaises = Object.entries(paises)
  .map(([code, [name, timezone]]) => {
    const doPais = saida.filter((c) => c.country_code === code);
    const comSecao = doPais.filter((c) => c.has_section);
    const locaisNoPais = extras.filter((c) => c.country_code === code && c.has_section).length;
    const aptos = doPais.reduce((s, c) => s + c.voters, 0);
    const comp = doPais.reduce((s, c) => s + c.turnout, 0);
    // Abstenção sobre as cidades onde a votação foi instalada, inclusive as que votam no prédio de outra cidade.
    const aptosComSecao = doPais.filter((c) => c.abstention_pct !== null).reduce((s, c) => s + c.voters, 0);
    return {
      code, name, timezone,
      cities_with_section: comSecao.length,
      extra_places: locaisNoPais,
      voters: aptos,
      turnout: comp,
      abstention_pct: aptosComSecao ? +(100 * (1 - comp / aptosComSecao)).toFixed(1) : null,
    };
  })
  .sort((a, b) => b.voters - a.voters);

writeFileSync(OUT_JSON, JSON.stringify({
  fonte: `TSE, resultados oficiais do 1º turno de 04/10/2026 e eleitorado por local de votação (gerado pelo TSE em ${tseLocais.gerado_pelo_tse_em}); coordenadas do OpenStreetMap (Nominatim)`,
  gerado_em: new Date().toISOString().slice(0, 10),
  paises: listaPaises,
  cidades: saida,
  locais_extras: extras,
}, null, 2) + "\n");

const linhasPaises = listaPaises.map((p) => `  (${[p.code, p.name, p.timezone].map(sql).join(", ")})`).join(",\n");
const colunas = ["slug", "tse_code", "name", "country_code", "timezone", "lat", "lon", "voters", "turnout", "abstention_pct", "has_section", "venue_name", "address", "hours", "notes", "place_voters", "sort_order"];
const atualiza = colunas.filter((k) => k !== "tse_code").map((k) => `${k} = excluded.${k}`).join(", ");
const linhasCidades = saida.map((c) => `  (${colunas.map((k) => sql(c[k])).join(", ")})`).join(",\n");
const linhasExtras = extras.map((c) => `  (${[...colunas.map((k) => sql(c[k])), `(select id from public.voting_cities where tse_code = ${sql(c.parent_tse_code)})`].join(", ")})`).join(",\n");
writeFileSync(OUT_SQL, `-- GERADO por scripts/build-cidades.mjs. Não editar à mão.
-- Países, cidades do TSE com seção no exterior (1º turno de 2026) e locais de votação fora da cidade do TSE
-- (eleitorado por local de votação do TSE). Coordenadas: OpenStreetMap. Idempotente: também atualiza a produção
-- (pnpm exec supabase db query --linked -f supabase/seed.sql).

insert into public.countries (code, name, timezone) values
${linhasPaises}
on conflict (code) do update set name = excluded.name, timezone = excluded.timezone;

insert into public.voting_cities (${colunas.join(", ")}) values
${linhasCidades}
on conflict (tse_code) do update set ${atualiza};

insert into public.voting_cities (${colunas.join(", ")}, parent_id) values
${linhasExtras}
on conflict (tse_code) do update set ${atualiza}, parent_id = excluded.parent_id;

-- Locais que já estiveram no site e não existem no TSE (${Object.values(desativados).join(", ")}).
update public.voting_cities set has_section = false where tse_code in (${Object.keys(desativados).map(sql).join(", ")});
`);

console.log(`cidades do TSE: ${saida.length}, com seção: ${saida.filter((c) => c.has_section).length}, locais extras: ${extras.length}, países: ${listaPaises.length}`);
console.log(problemas.length ? `PROBLEMAS:\n${problemas.join("\n")}` : "sem problemas");
