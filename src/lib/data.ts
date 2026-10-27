import type { Lang } from "@/i18n";
import { cityName, countryName, hoursText, notesText, venueName } from "@/i18n/data";
import { createPublicClient } from "./supabase/public";

export type PublicRide = {
  id: string; first_name: string; origin_city: string; origin_lat: number | null; origin_lon: number | null;
  depart_at: string; return_at: string | null; seats_total: number; seats_left: number;
  vehicle: "car" | "van" | "train" | "bus"; meeting_hint: string | null; notes: string | null; women_only: boolean;
  status: "open" | "full"; created_at: string;
};

export type PublicStay = {
  id: string; first_name: string; area_hint: string; nights: { night: string; remaining: number }[];
  capacity: number; kind: "room" | "couch" | "mattress"; rules: string | null; women_only: boolean;
  status: "open" | "full"; created_at: string;
};

export type CityInfo = {
  slug: string; name: string; country_code: string; country_name: string; timezone: string;
  lat: number | null; lon: number | null; voters: number; turnout: number; abstention_pct: number | null;
  venue_name: string | null; address: string | null; hours: string | null; notes: string | null;
  // Locais de votação: a seção do TSE (jurisdiction) pode ter locais em outras cidades.
  place_voters: number | null; jurisdiction: string; jurisdiction_voters: number; jurisdiction_abstention_pct: number | null;
  places: { slug: string; name: string; venue_name: string | null; voters: number }[] | null;
};

export type CityListings = { city: CityInfo; rides: PublicRide[]; stays: PublicStay[] };

export async function getCityListings(slug: string, lang: Lang = "pt"): Promise<CityListings | null> {
  const { data, error } = await createPublicClient().rpc("city_listings", { p_slug: slug });
  if (error) throw error;
  const listings = (data as unknown as CityListings | null) ?? null;
  if (!listings || lang === "pt") return listings;
  const c = listings.city;
  // A seção (jurisdiction) tem o nome da cidade do TSE; o primeiro local da lista é ela.
  const jurisdictionSlug = c.places?.[0]?.slug ?? c.slug;
  return {
    ...listings,
    city: {
      ...c,
      name: cityName(lang, c.slug, c.name),
      country_name: countryName(lang, c.country_name),
      venue_name: venueName(lang, c.venue_name),
      hours: hoursText(lang, c.hours),
      notes: notesText(lang, c.notes),
      jurisdiction: cityName(lang, jurisdictionSlug, c.jurisdiction),
      places: c.places?.map((p) => ({ ...p, name: cityName(lang, p.slug, p.name), venue_name: venueName(lang, p.venue_name) })) ?? null,
    },
  };
}

export async function getCountriesOverview(lang: Lang = "pt") {
  const { data, error } = await createPublicClient().rpc("countries_overview");
  if (error) throw error;
  return lang === "pt" ? data : data.map((c) => ({ ...c, name: countryName(lang, c.name) }));
}

export async function getCountryOverview(code: string, lang: Lang = "pt") {
  const supabase = createPublicClient();
  const [country, cities] = await Promise.all([
    supabase.from("countries").select("code, name, timezone").eq("code", code.toUpperCase()).maybeSingle(),
    supabase.rpc("country_overview", { p_country: code }),
  ]);
  if (country.error) throw country.error;
  if (cities.error) throw cities.error;
  if (!country.data || cities.data.length === 0) return null;
  if (lang === "pt") return { country: country.data, cities: cities.data };
  return {
    country: { ...country.data, name: countryName(lang, country.data.name) },
    cities: cities.data.map((c) => ({ ...c, name: cityName(lang, c.slug, c.name), venue_name: venueName(lang, c.venue_name) })),
  };
}

export type FormCity = { slug: string; name: string; country_code: string; timezone: string };
export type FormCountry = { code: string; name: string; cities: FormCity[] };

/** Países e cidades com seção, para os formulários de quem oferece. */
export async function getFormCountries(lang: Lang = "pt"): Promise<FormCountry[]> {
  const supabase = createPublicClient();
  const [countries, cities] = await Promise.all([
    supabase.from("countries").select("code, name"),
    supabase.from("voting_cities").select("slug, name, country_code, timezone, voters").eq("has_section", true).order("voters", { ascending: false }),
  ]);
  if (countries.error) throw countries.error;
  if (cities.error) throw cities.error;
  const names = new Map(countries.data.map((c) => [c.code, c.name]));
  const byCountry = new Map<string, FormCountry>();
  for (const c of cities.data) {
    const entry = byCountry.get(c.country_code) ?? { code: c.country_code, name: countryName(lang, names.get(c.country_code) ?? c.country_code), cities: [] };
    entry.cities.push({ slug: c.slug, name: cityName(lang, c.slug, c.name), country_code: c.country_code, timezone: c.timezone });
    byCountry.set(c.country_code, entry);
  }
  return [...byCountry.values()].sort((a, b) => a.name.localeCompare(b.name, lang === "en" ? "en" : "pt-BR"));
}

/** Totais da página inicial: quantas pessoas já ofereceram ou pediram. Se o banco falhar, a página sai sem eles. */
export async function getSiteStats() {
  const { data, error } = await createPublicClient().rpc("site_stats");
  if (error || !data?.[0]) return null;
  return data[0];
}

export type DemandDestination = { slug: string; cidade: string; pais: string; pessoas: number; caronas: number };
export type DemandOrigin = { lugar: string; lat: number; lon: number; pessoas: number; destinos: DemandDestination[] };

/** Onde falta carona: cidades de partida de quem espera carona ("Me avise"), só totais. Se falhar, a seção some. */
export async function getRideDemand(lang: Lang = "pt"): Promise<{ pessoas: number; origens: DemandOrigin[] } | null> {
  const { data, error } = await createPublicClient().rpc("ride_demand");
  if (error || !data) return null;
  const d = data as unknown as { pessoas: number; origens: DemandOrigin[] };
  if (lang === "pt") return d;
  return { ...d, origens: d.origens.map((o) => ({ ...o, destinos: o.destinos.map((x) => ({ ...x, cidade: cityName(lang, x.slug, x.cidade) })) })) };
}

export type Story = { id: string; body: string; first_name: string | null; city: string | null };

/** Mural: só os relatos aprovados na moderação. Se falhar, a seção some. */
export async function getStories(): Promise<Story[]> {
  const { data, error } = await createPublicClient().rpc("public_stories");
  if (error || !data) return [];
  return data as Story[];
}
