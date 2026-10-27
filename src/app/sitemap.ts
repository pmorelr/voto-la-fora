import type { MetadataRoute } from "next";
import dados from "../../content/dados/cidades.json";
import { site } from "@/lib/config";
import { legalPages } from "@/lib/content";

// Mapa do site para os buscadores (só com PERMITIR_INDEXACAO=1). Cada página vai em português (sem prefixo) e em
// inglês (/en), ligadas entre si. Ficam de fora as páginas de cidade e de pedido, que mostram anúncios.
export default function sitemap(): MetadataRoute.Sitemap {
  if (!site.indexable) return [];
  const paises = new Set([...dados.cidades, ...dados.locais_extras].filter((c) => c.has_section).map((c) => c.country_code.toLowerCase()));
  const caminhos = [
    "",
    "/o-problema",
    "/votar",
    ...[...paises].sort().map((p) => `/votar/${p}`),
    "/ajudar",
    ...Object.keys(legalPages).map((p) => `/sobre/${p}`),
  ];
  return caminhos.flatMap((c) => {
    const pt = `${site.url}${c || "/"}`;
    const en = `${site.url}/en${c}`;
    const comum = {
      changeFrequency: c.startsWith("/votar") ? ("daily" as const) : ("weekly" as const),
      priority: c === "" ? 1 : c.startsWith("/votar") ? 0.8 : 0.5,
      alternates: { languages: { "pt-BR": pt, en, "x-default": pt } },
    };
    return [{ url: pt, ...comum }, { url: en, ...comum }];
  });
}
