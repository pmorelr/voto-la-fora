import "server-only";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { marked } from "marked";
import type { Lang } from "@/i18n";
import dados from "../../content/dados/cidades.json";
import { cityName, countryName } from "@/i18n/data";

export const legalPages = {
  "como-funciona": "Como funciona",
  seguranca: "Segurança",
  termos: "Termos de uso",
  privacidade: "Privacidade",
  "quem-somos": "Quem somos",
} as const;
export type LegalSlug = keyof typeof legalPages;
export const legalPagesEn: Record<LegalSlug, string> = {
  "como-funciona": "How it works",
  seguranca: "Safety",
  termos: "Terms of use",
  privacidade: "Privacy",
  "quem-somos": "About us",
};

/** Páginas institucionais escritas em Markdown em content/legal. */
export function legalPage(slug: LegalSlug, lang: Lang = "pt") {
  const file = path.join(process.cwd(), "content", "legal", ...(lang === "en" ? ["en"] : []), `${slug}.md`);
  if (!existsSync(file)) return null;
  const raw = readFileSync(file, "utf8");
  const draft = /^RASCUNHO PARA REVISÃO JURÍDICA/m.test(raw);
  const body = raw.replace(/^RASCUNHO PARA REVISÃO JURÍDICA\s*$/m, "").replace(/^#\s+.*$/m, "").trim();
  return { title: lang === "en" ? legalPagesEn[slug] : legalPages[slug], draft, html: marked.parse(body, { async: false }) as string };
}

// Cidades do TSE no exterior onde a votação não foi instalada no 1º turno de 2026 (resultados do TSE), por país.
export function dispensedSections(lang: Lang = "pt"): { country: string; cities: string[] }[] {
  const countries = new Map(dados.paises.map((p) => [p.code, p.name]));
  const byCountry = new Map<string, Set<string>>();
  for (const c of dados.cidades) {
    if (c.has_section || c.votes_in) continue;
    const country = countryName(lang, countries.get(c.country_code) ?? c.country_code);
    byCountry.set(country, (byCountry.get(country) ?? new Set()).add(cityName(lang, c.slug, c.name)));
  }
  const locale = lang === "en" ? "en" : "pt-BR";
  return [...byCountry.entries()]
    .map(([country, cities]) => ({ country, cities: [...cities].sort((a, b) => a.localeCompare(b, locale)) }))
    .sort((a, b) => a.country.localeCompare(b.country, locale));
}

