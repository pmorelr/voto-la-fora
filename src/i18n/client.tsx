"use client";

import Link from "next/link";
import { createContext, useContext, type ComponentProps } from "react";
import { lp, tr, type Lang } from "@/i18n";

const LangContext = createContext<Lang>("pt");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
export const useT = () => tr(useContext(LangContext));

/** Link que acrescenta o prefixo do idioma atual a caminhos internos. */
export function LocalLink({ href, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const lang = useContext(LangContext);
  return <Link href={href.startsWith("/") ? lp(lang, href) : href} {...rest} />;
}
