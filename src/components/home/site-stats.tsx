import { formatInt } from "@/lib/format";
import { tr, type Lang } from "@/i18n";

type Stats = { people: number; rides: number; stays: number; requests: number; countries: number; cities: number };

/** Faixa "Até agora" da página inicial. Só totais, nunca quem. */
export function SiteStats({ stats, lang }: { stats: Stats; lang: Lang }) {
  const t = tr(lang);
  const n = (v: number) => formatInt(v, lang);
  const items = [
    { value: stats.people, label: stats.people === 1 ? t("pessoa já usou o site para oferecer ou pedir", "person has used the site to offer or ask") : t("pessoas já usaram o site para oferecer ou pedir", "people have used the site to offer or ask") },
    { value: stats.rides, label: stats.rides === 1 ? t("carona oferecida", "ride offered") : t("caronas oferecidas", "rides offered") },
    { value: stats.stays, label: stats.stays === 1 ? t("lugar para dormir oferecido", "place to stay offered") : t("lugares para dormir oferecidos", "places to stay offered") },
    { value: stats.requests, label: stats.requests === 1 ? t("pedido de vaga", "request for a spot") : t("pedidos de vaga", "requests for a spot") },
    { value: stats.countries, label: stats.countries === 1 ? t("país com oferta", "country with offers") : t("países com oferta", "countries with offers") },
    { value: stats.cities, label: stats.cities === 1 ? t("cidade de votação com oferta", "polling city with offers") : t("cidades de votação com oferta", "polling cities with offers") },
  ];
  return (
    <section aria-labelledby="ate-agora" className="border-y bg-secondary">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <h2 id="ate-agora" className="flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-[0.1em] text-brand-text">
          <span className="relative flex size-2" aria-hidden>
            <span className="absolute inline-flex size-full rounded-full bg-brand opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-brand" />
          </span>
          {t("Até agora", "So far")}
        </h2>
        <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-5 md:gap-x-6 lg:grid-cols-6">
          {items.map((i, k) => (
            <div key={k} className={`flex flex-col-reverse justify-end ${k === 0 ? "col-span-3 lg:col-span-1" : ""}`}>
              <dt className="mt-2 text-sm leading-snug text-muted-foreground md:text-base">{i.label}</dt>
              <dd className="font-serif text-4xl font-bold leading-none tabular-nums md:text-5xl">{n(i.value)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
