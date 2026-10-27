"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { lp, unprefixed } from "@/i18n";
import { useLang, useT } from "@/i18n/client";
import { site, tabs } from "@/lib/config";
import { cn } from "@/lib/utils";

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  if (href === "/votar") return pathname.startsWith("/votar") || pathname.startsWith("/cidade") || pathname.startsWith("/pedido") || pathname.startsWith("/aviso");
  if (href === "/ajudar") return pathname.startsWith("/ajudar") || pathname.startsWith("/meus-anuncios") || pathname.startsWith("/entrar");
  return pathname.startsWith(href);
}

export function SiteHeader() {
  const lang = useLang();
  const t = useT();
  // O caminho no navegador; sem o prefixo, para comparar com as abas e montar o link do outro idioma.
  const pathname = unprefixed(usePathname());
  const other = lang === "en" ? "pt" : "en";
  return (
    <header className="border-t-[6px] border-t-primary border-b bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pt-3.5 md:flex-row md:items-end md:justify-between md:pt-4">
        <div className="flex items-center justify-between gap-4 md:pb-3.5">
          <Link href={lp(lang, "/")} aria-label={t(`${site.name}, página inicial`, `${site.name}, home page`)} className="w-fit">
            <Logo />
          </Link>
          <Link
            href={lp(other, pathname)}
            hrefLang={other === "en" ? "en" : "pt-BR"}
            lang={other === "en" ? "en" : "pt-BR"}
            className="rounded-md border px-2.5 py-1 text-sm font-semibold text-muted-foreground hover:text-foreground md:hidden"
          >
            {other === "en" ? "English" : "Português"}
          </Link>
        </div>
        <div className="flex items-end gap-6">
          <nav aria-label={t("Seções", "Sections")} className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
            <ul className="flex w-max gap-5">
              {tabs.map((tab) => {
                const active = isActive(tab.href, pathname);
                return (
                  <li key={tab.href}>
                    <Link
                      href={lp(lang, tab.href)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex items-center border-b-[3px] pt-2 pb-2.5 text-[15px] whitespace-nowrap transition",
                        active ? "border-primary font-bold text-foreground" : "border-transparent font-semibold text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {lang === "en" ? tab.labelEn : tab.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <Link
            href={lp(other, pathname)}
            hrefLang={other === "en" ? "en" : "pt-BR"}
            lang={other === "en" ? "en" : "pt-BR"}
            className="mb-2 hidden rounded-md border px-2.5 py-1 text-sm font-semibold text-muted-foreground hover:text-foreground md:inline-flex"
          >
            {other === "en" ? "English" : "Português"}
          </Link>
        </div>
      </div>
    </header>
  );
}
