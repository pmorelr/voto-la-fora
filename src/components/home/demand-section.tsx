"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { LocalLink, useT } from "@/i18n/client";
import type { DemandOrigin } from "@/lib/data";
import type { Region } from "./demand-map";

// O mapa só carrega quando a seção chega perto da tela: a página inicial continua leve.
const DemandMap = dynamic(() => import("./demand-map"), { ssr: false, loading: () => <div className="h-[440px] w-full animate-pulse rounded-2xl border bg-muted lg:h-[600px]" /> });

const REGIOES: (Region & { pt: string; en: string; test: (o: DemandOrigin) => boolean })[] = [
  { key: "europa", pt: "Europa", en: "Europe", bounds: [[-11, 35], [30, 60]], test: (o) => o.lon > -25 && o.lon < 45 && o.lat > 30 },
  { key: "norte", pt: "América do Norte", en: "North America", bounds: [[-125, 24], [-60, 55]], test: (o) => o.lon < -50 && o.lat > 12 },
  { key: "sul", pt: "América do Sul", en: "South America", bounds: [[-82, -45], [-34, 12]], test: (o) => o.lon < -30 && o.lat <= 12 },
  { key: "asia", pt: "Ásia e Oceania", en: "Asia and Oceania", bounds: [[60, -45], [180, 50]], test: (o) => o.lon >= 45 },
];

export function DemandSection({ pessoas, origens }: { pessoas: number; origens: DemandOrigin[] }) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);
  const regioes = useMemo(() => REGIOES.map((r) => ({ ...r, n: origens.filter(r.test).reduce((s, o) => s + o.pessoas, 0) })).filter((r) => r.n > 0), [origens]);
  const [regiao, setRegiao] = useState<string | null>(() => regioes.slice().sort((a, b) => b.n - a.n)[0]?.key ?? null);
  const atual = regioes.find((r) => r.key === regiao) ?? null;

  // Rotas mais procuradas: primeiro as que ainda não têm nenhuma carona saindo da cidade de partida.
  const rotas = useMemo(() => origens
    .flatMap((o) => o.destinos.map((d) => ({ ...d, lugar: o.lugar })))
    .sort((a, b) => Number(a.caronas > 0) - Number(b.caronas > 0) || b.pessoas - a.pessoas)
    .slice(0, 8), [origens]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisivel(true); io.disconnect(); } }, { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section aria-labelledby="onde-falta" className="mx-auto max-w-6xl px-4 py-14 md:py-20">
      <h2 id="onde-falta" className="text-3xl md:text-4xl">{t("Onde falta carona", "Where rides are needed")}</h2>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        {t(
          `${pessoas.toLocaleString("pt-BR")} pessoas pediram aviso de carona para ir votar. Cada círculo é uma cidade de onde há gente esperando; quanto maior, mais gente. Toque num círculo para ver os destinos e oferecer uma carona.`,
          `${pessoas.toLocaleString("en-GB")} people have asked to be notified about a ride to the polls. Each circle is a city where people are waiting; the bigger it is, the more people. Tap a circle to see where they need to go and offer a ride.`,
        )}
      </p>
      {regioes.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label={t("Região do mapa", "Map region")}>
          {regioes.map((r) => (
            <button key={r.key} type="button" onClick={() => setRegiao(r.key)} aria-pressed={regiao === r.key}
              className={`rounded-full border px-3 py-1 text-sm ${regiao === r.key ? "border-foreground bg-foreground text-background" : "hover:border-foreground"}`}>
              {t(r.pt, r.en)} <span className="tabular-nums opacity-70">{r.n}</span>
            </button>
          ))}
          <button type="button" onClick={() => setRegiao(null)} aria-pressed={regiao === null}
            className={`rounded-full border px-3 py-1 text-sm ${regiao === null ? "border-foreground bg-foreground text-background" : "hover:border-foreground"}`}>
            {t("Mundo", "World")}
          </button>
        </div>
      )}
      <div className="mt-4 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div ref={ref}>{visivel ? <DemandMap origens={origens} region={atual} /> : <div className="h-[440px] w-full rounded-2xl border bg-muted lg:h-[600px]" />}</div>
        <div>
          <h3 className="text-xl">{t("Rotas mais procuradas", "Most wanted routes")}</h3>
          <ol className="mt-3 divide-y rounded-2xl border bg-card">
            {rotas.map((r) => (
              <li key={`${r.lugar}-${r.slug}`} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="font-semibold">{r.lugar} → {r.cidade}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.pessoas === 1 ? t("1 pessoa esperando", "1 person waiting") : t(`${r.pessoas} pessoas esperando`, `${r.pessoas} people waiting`)}
                    {" · "}
                    {r.caronas === 0 ? t("nenhuma carona ainda", "no ride yet") : r.caronas === 1 ? t("1 carona", "1 ride") : t(`${r.caronas} caronas`, `${r.caronas} rides`)}
                  </p>
                </div>
                <LocalLink href={`/ajudar/carona?cidade=${encodeURIComponent(r.slug)}&origem=${encodeURIComponent(r.lugar)}`} prefetch={false}
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-brand-text hover:underline">
                  {t("Oferecer", "Offer")} <ArrowRight className="size-4" />
                </LocalLink>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("Fonte: inscrições confirmadas no “Me avise” que dizem de onde a pessoa sai. Só totais, sem nomes.", "Source: confirmed “Notify me” sign-ups that say where the person is leaving from. Totals only, no names.")}
          </p>
        </div>
      </div>
    </section>
  );
}
