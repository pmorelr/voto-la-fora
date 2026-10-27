import "server-only";
import { searchPlace, type Near, type Place } from "./geocode-core";
import { createAdminClient } from "./supabase/admin";

const UA = "voto-la-fora/0.2 (cidade de partida de caronas e avisos; contato@votolafora.com.br)";

/**
 * Cidade de partida perto da cidade de votação, com cache no banco. A chave inclui o destino (arredondado), porque o
 * mesmo nome pode ser lugares diferentes conforme o destino. Nunca bloqueia: devolve null se falhar.
 */
export async function geocodeOrigin(text: string, near: Near): Promise<Place | null> {
  const query = `v2|${text.trim().toLowerCase()}|${near.lat.toFixed(1)},${near.lon.toFixed(1)}`;
  const admin = createAdminClient();
  const cached = await admin.from("geocode_cache").select("lat, lon, name").eq("query", query).maybeSingle();
  if (cached.data) {
    const { lat, lon, name } = cached.data;
    return lat === null || lon === null ? null : { lat, lon, name: name ?? text.trim() };
  }
  try {
    const place = await searchPlace(text, near, UA);
    await admin.from("geocode_cache").upsert({ query, lat: place?.lat ?? null, lon: place?.lon ?? null, name: place?.name ?? null });
    return place;
  } catch {
    return null;
  }
}
