// Busca da cidade de partida no Nominatim (OpenStreetMap), sem dependências do Next: também roda em scripts com
// `node arquivo.ts`. Regras (12/10/2026, depois de "Bethel" cair no Alasca e "Salamanca" em Portugal):
//  - só lugares do tipo cidade, vila ou povoado, nunca endereço;
//  - sem prender ao país do destino (há quem atravesse a fronteira), mas escolhendo, entre os candidatos, o mais
//    perto da cidade de votação;
//  - texto livre limpo antes da busca: parênteses, "mas posso buscar…", listas com barra, CEP.

export type Near = { lat: number; lon: number };
export type Place = { lat: number; lon: number; name: string };

const LIMITE_KM = 2500;
const REGIOES = new Set(["country", "state", "region", "province", "county", "state_district", "district", "island", "archipelago", "continent"]);

export function distanceKm(a: Near, b: Near) {
  const r = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Versões do texto a tentar, da mais completa para a mais curta. */
export function placeQueries(text: string): string[] {
  const base = text
    .replace(/\([^)]*\)/g, " ")
    .split(/\s(?:mas|but|ou|or|e arredores|-|–)\s/i)[0]
    .replace(/\s(?:na|no|em|in)\s.*$/i, "")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const first = base.split(/[/,;]/)[0].trim();
  return [...new Set([base, first].filter((q) => q.length >= 2))];
}

/** Nome curto para exibir: "City of Moncton" → "Moncton", "Alacant / Alicante" → "Alicante". */
export function shortPlaceName(name: string) {
  const parts = name.split(" / ");
  return parts[parts.length - 1].replace(/^(City of|Town of|Village of|Ville de|Greater|Municipality of)\s+/i, "").trim();
}

export async function searchPlace(text: string, near: Near, userAgent: string): Promise<Place | null> {
  for (const q of placeQueries(text)) {
    const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
      q, format: "jsonv2", limit: "8", featureType: "settlement",
      viewbox: `${near.lon - 8},${near.lat + 5},${near.lon + 8},${near.lat - 5}`, bounded: "0",
    })}`;
    const res = await fetch(url, { headers: { "User-Agent": userAgent }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) continue;
    const hits = (await res.json()) as { lat: string; lon: string; name?: string; display_name: string; addresstype?: string }[];
    // Cidade, vila, povoado ou bairro; nunca região, província, condado ou país (Valencia virava "Comunitat Valenciana").
    const best = hits
      .filter((h) => !REGIOES.has(h.addresstype ?? ""))
      .map((h) => ({ lat: +(+h.lat).toFixed(4), lon: +(+h.lon).toFixed(4), name: h.name || h.display_name.split(",")[0] }))
      .map((p) => ({ ...p, km: distanceKm(p, near) }))
      .sort((a, b) => a.km - b.km)[0];
    if (best && best.km <= LIMITE_KM) return { lat: best.lat, lon: best.lon, name: shortPlaceName(best.name) };
  }
  return null;
}
