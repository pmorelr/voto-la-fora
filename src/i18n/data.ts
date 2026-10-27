import "server-only";
import cidades from "../../content/dados/cidades.json";
import textos from "../../content/dados/textos-en.json";
import type { Lang } from "@/i18n";

// Nomes e textos dos dados (cidades, países, locais, horários, observações) em inglês.
// Escrito à mão a partir de content/dados/cidades.json; o que faltar fica em português.
type Textos = Record<"cities" | "countries" | "venues" | "hours" | "notes", Record<string, string>>;
const en = textos as Textos;

const pick = (table: Record<string, string>, lang: Lang, value: string | null | undefined) =>
  value == null ? value ?? null : lang === "en" ? (table[value] ?? value) : value;

export const cityName = (lang: Lang, slug: string, name: string) => (lang === "en" ? (en.cities[slug] ?? name) : name);
export const countryName = (lang: Lang, name: string) => pick(en.countries, lang, name) as string;
export const venueName = (lang: Lang, value: string | null) => pick(en.venues, lang, value);
export const hoursText = (lang: Lang, value: string | null) => pick(en.hours, lang, value);
export const notesText = (lang: Lang, value: string | null) => pick(en.notes, lang, value);

// Nome em português → slug, para traduzir nomes que chegam do banco sem o slug (e-mails).
const slugByPtName = new Map([...cidades.cidades, ...cidades.locais_extras].map((c) => [c.name, c.slug]));
export const cityNameEnFromPt = (name: string) => {
  const slug = slugByPtName.get(name);
  return slug ? cityName("en", slug, name) : name;
};
