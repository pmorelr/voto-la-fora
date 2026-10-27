import { countryName } from "@/i18n/data";
import { tr, type Lang } from "@/i18n";
import { formatInt, formatPct } from "@/lib/format";
import type { PaisResultado } from "@/content/resultado";

// Escala fixa do eixo de abstenção: cobre do menor valor do 2º turno ao maior do 1º.
const MIN = 35;
const MAX = 90;
const pos = (v: number) => `${((v - MIN) / (MAX - MIN)) * 100}%`;

/**
 * Um país por linha: abstenção no 1º turno (círculo vazio) e no 2º (círculo cheio), com a queda em pontos, os
 * eleitores a mais e os anúncios do site. Todos os valores aparecem escritos; o desenho só ajuda a comparar.
 */
export function CountryResults({ rows, lang }: { rows: PaisResultado[]; lang: Lang }) {
  const t = tr(lang);
  const pct = (n: number) => formatPct(n, 1, lang);
  const pp = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1).replace(".", lang === "en" ? "." : ",")}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2"><span className="inline-block size-3 rounded-full border-2 border-muted-foreground bg-background" /> {t("1º turno", "1st round")}</span>
        <span className="inline-flex items-center gap-2"><span className="inline-block size-3 rounded-full bg-primary" /> {t("2º turno", "2nd round")}</span>
        <span>{t("Abstenção, em % dos eleitores aptos", "Abstention, as a % of registered voters")}</span>
      </div>

      <ol className="mt-5 divide-y border-y">
        {rows.map((r, i) => {
          const queda = r.abstencao2 - r.abstencao1;
          const mais = r.compareceram2 - r.compareceram1;
          return (
            <li key={r.code} className="grid gap-x-6 gap-y-2 py-4 md:grid-cols-[14rem_1fr_15rem] md:items-center">
              <div className="flex items-baseline gap-3">
                <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted-foreground">{i + 1}</span>
                <div>
                  <p className="font-bold leading-tight">{countryName(lang, r.name)}</p>
                  <p className="text-sm text-muted-foreground">{t(`${formatInt(r.aptos, lang)} eleitores`, `${formatInt(r.aptos, lang)} voters`)}</p>
                </div>
              </div>

              <div className="pl-9 md:pl-0">
                <div className="relative h-6" aria-hidden>
                  <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
                  <div className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-primary/35" style={{ left: pos(Math.min(r.abstencao1, r.abstencao2)), right: `calc(100% - ${pos(Math.max(r.abstencao1, r.abstencao2))})` }} />
                  <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-muted-foreground bg-background" style={{ left: pos(r.abstencao1) }} />
                  <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-background" style={{ left: pos(r.abstencao2) }} />
                </div>
                <p className="mt-1 text-sm tabular-nums">
                  {pct(r.abstencao1)} → <b>{pct(r.abstencao2)}</b>{" "}
                  <span className="font-bold text-brand-text">({pp(queda)} {t("pontos", "points")})</span>
                </p>
              </div>

              <div className="pl-9 text-sm md:pl-0">
                <p className="tabular-nums">
                  <b>{mais >= 0 ? "+" : "−"}{formatInt(Math.abs(mais), lang)}</b> {t("votantes a mais", "more voters")}
                </p>
                <p className="text-muted-foreground">
                  {[
                    r.caronas ? t(`${r.caronas} ${r.caronas === 1 ? "carona" : "caronas"}`, `${r.caronas} ${r.caronas === 1 ? "ride" : "rides"}`) : null,
                    r.hospedagens ? t(`${r.hospedagens} ${r.hospedagens === 1 ? "hospedagem" : "hospedagens"}`, `${r.hospedagens} ${r.hospedagens === 1 ? "place to stay" : "places to stay"}`) : null,
                  ].filter(Boolean).join(" · ")}{" "}
                  {t("no site", "on the site")}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
