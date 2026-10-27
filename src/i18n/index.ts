// Idiomas do site. O português fica sem prefixo (os endereços de sempre); o inglês, em /en.
// Rotas internas: o proxy reescreve /x para /pt/x, então todas as páginas vivem em app/[lang].
export const langs = ["pt", "en"] as const;
export type Lang = (typeof langs)[number];

export const isLang = (value: string): value is Lang => (langs as readonly string[]).includes(value);

/** Texto no idioma da página: t("Olá", "Hello"). */
export type T = (pt: string, en: string) => string;
export const tr = (lang: Lang): T => (pt, en) => (lang === "en" ? en : pt);

/** Caminho público no idioma: lp("en", "/votar") = "/en/votar"; em português, o caminho fica igual. */
export function lp(lang: Lang, path: string): string {
  if (lang === "pt") return path;
  return path === "/" ? "/en" : `/en${path}`;
}

/** Tira o prefixo de idioma de um caminho público: "/en/votar" → "/votar". */
export function unprefixed(path: string): string {
  if (path === "/en" || path === "/pt") return "/";
  return path.replace(/^\/(en|pt)(?=\/)/, "");
}

export const htmlLang: Record<Lang, string> = { pt: "pt-BR", en: "en" };
/** Datas e números: português do Brasil; inglês no formato europeu (dia/mês), onde está a maior parte do público. */
export const intlLocale: Record<Lang, string> = { pt: "pt-BR", en: "en-GB" };

/** O idioma vindo da rota ([lang]); qualquer outro valor vira português. */
export const asLang = (value: string): Lang => (isLang(value) ? value : "pt");
