import dados from "../../../../../content/dados/cidades.json";
import { asLang } from "@/i18n";
import { cityName } from "@/i18n/data";
import { ogContentType, ogImage, ogSize } from "@/lib/og";

export const alt = "Voto Lá Fora";
export const size = ogSize;
export const contentType = ogContentType;

// O nome vem do cadastro de cidades, sem consultar o banco.
export default async function Image({ params }: { params: Promise<{ slug: string; lang: string }> }) {
  const { slug, lang: raw } = await params;
  const lang = asLang(raw);
  const city = [...dados.cidades, ...dados.locais_extras].find((c) => c.slug === slug);
  return ogImage(city ? cityName(lang, city.slug, city.name) : undefined, lang);
}
