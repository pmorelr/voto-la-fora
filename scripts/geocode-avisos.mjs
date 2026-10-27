// Localiza a cidade de partida dos "Me avise" que ainda não têm coordenadas e imprime o SQL que as grava.
// Lê da entrada um JSON: [{ "id", "origin_hint", "lat", "lon" }] (lat/lon da cidade de votação).
// Não usa chave secreta: o SQL é aplicado com psql (local) ou `supabase db query --linked -f` (produção).
// Uso: node scripts/geocode-avisos.mjs < avisos.json > avisos.sql   (respeita 1 consulta por segundo do Nominatim)
import { readFileSync } from "node:fs";
import { searchPlace } from "../src/lib/geocode-core.ts";

const UA = "voto-la-fora/0.2 (cidade de partida dos avisos; contato@votolafora.com.br)";
const avisos = JSON.parse(readFileSync(0, "utf8"));
const sql = (v) => (v === null || v === undefined ? "null" : typeof v === "number" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const cache = new Map();
const out = [];
let consultas = 0, achados = 0;

for (const a of avisos) {
  const near = { lat: +a.lat, lon: +a.lon };
  const key = `v2|${a.origin_hint.trim().toLowerCase()}|${near.lat.toFixed(1)},${near.lon.toFixed(1)}`;
  if (!cache.has(key)) {
    let place = null;
    try { place = await searchPlace(a.origin_hint, near, UA); } catch { place = null; }
    consultas++;
    await new Promise((r) => setTimeout(r, 1100 * 2));
    cache.set(key, place);
    out.push(`insert into public.geocode_cache (query, lat, lon, name) values (${sql(key)}, ${sql(place?.lat)}, ${sql(place?.lon)}, ${sql(place?.name)}) on conflict (query) do update set lat = excluded.lat, lon = excluded.lon, name = excluded.name;`);
    console.error(`${place ? "ok " : "-- "} ${a.origin_hint} -> ${place ? `${place.name} (${place.lat}, ${place.lon})` : "não achado"}`);
  }
  const place = cache.get(key);
  if (place) {
    achados++;
    out.push(`update public.alerts set origin_lat = ${place.lat}, origin_lon = ${place.lon}, origin_place = ${sql(place.name)} where id = ${sql(a.id)};`);
  }
}
console.log(out.join("\n"));
console.error(`${avisos.length} avisos, ${consultas} consultas, ${achados} localizados`);
