import Link from "next/link";
import { lp, tr, type Lang } from "@/i18n";
import { siteText } from "@/lib/config";

export function SiteFooter({ lang }: { lang: Lang }) {
  const t = tr(lang);
  const text = siteText(lang);
  const links: [string, string][] = [
    ["/sobre", t("Como funciona", "How it works")],
    ["/sobre/seguranca", t("Segurança", "Safety")],
    ["/sobre/termos", t("Termos", "Terms")],
    ["/sobre/privacidade", t("Privacidade", "Privacy")],
    ["/meus-anuncios", t("Meus anúncios", "My listings")],
  ];
  return (
    <footer className="border-t bg-secondary">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 text-sm text-muted-foreground md:grid-cols-[2fr_1fr]">
        <div className="space-y-2">
          <p className="font-semibold text-foreground">{text.independence}</p>
          <p>
            {t(
              `O site só conecta pessoas: não transporta, não hospeda e não intermedeia pagamentos. Todos os dados pessoais são apagados até ${text.retentionDate}.`,
              `The site only connects people: it does not transport, host or handle payments. All personal data is deleted by ${text.retentionDate}.`,
            )}
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 md:justify-end">
          {links.map(([href, label]) => (
            <li key={href}><Link className="hover:text-foreground" href={lp(lang, href)}>{label}</Link></li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
