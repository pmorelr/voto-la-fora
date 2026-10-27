import type { Metadata } from "next";
import { lp, type Lang } from "@/i18n";

/**
 * Endereço oficial (canônico) da página e as versões nos dois idiomas, para os buscadores. `path` é o caminho sem
 * idioma ("/votar/fr"); o português fica sem prefixo e o inglês em /en. Relativo ao metadataBase do layout.
 */
export function alternates(lang: Lang, path: string): Metadata["alternates"] {
  return { canonical: lp(lang, path), languages: { "pt-BR": lp("pt", path), en: lp("en", path), "x-default": lp("pt", path) } };
}
