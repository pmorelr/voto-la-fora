import type { LinhaPais } from "@/content/abstencao";
import { tr, type Lang } from "@/i18n";
import { formatInt, formatPct } from "@/lib/format";

// Barras horizontais, uma cor (a do site), valor na ponta, linha de referência do total do país.
// Passar o mouse ou focar uma barra mostra aptos e quem votou.
export function AbstentionChart({ rows, reference, lang = "pt" }: { rows: LinhaPais[]; reference: number; lang?: Lang }) {
  const t = tr(lang);
  const max = 80;
  return (
    <figure className="rounded-2xl border bg-card p-4 md:p-6">
      <figcaption className="mb-4">
        <p className="font-bold">{t("Abstenção no 1º turno, por país", "Abstention in the 1st round, by country")}</p>
        <p className="text-sm text-muted-foreground">{t("Em % dos brasileiros aptos a votar em cada país. Fonte: TSE.", "As a % of Brazilians registered to vote in each country. Source: TSE.")}</p>
      </figcaption>
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 border-l border-dashed border-foreground/40"
          style={{ left: `calc(min(42%, 13rem) + (100% - min(42%, 13rem)) * ${reference / max})` }}
        />
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.code} className="group relative grid grid-cols-[min(42%,13rem)_1fr] items-center gap-0" tabIndex={0}>
              <span className="pr-3 text-sm leading-tight">
                <span className="font-semibold">{r.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {r.cities.length > 3 ? t(`${r.cities.length} locais`, `${r.cities.length} polling places`) : r.cities.join(", ")}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-5 rounded-r-[4px] bg-brand" style={{ width: `${(r.abstencao / max) * 100}%` }} />
                <span className="text-sm font-semibold tabular-nums">{formatPct(r.abstencao, 1, lang)}</span>
              </span>
              <span className="pointer-events-none absolute left-[min(42%,13rem)] top-full z-10 mt-1 hidden w-max rounded-lg border bg-popover px-3 py-2 text-xs shadow-sm group-hover:block group-focus:block">
                {t(`${formatInt(r.aptos)} aptos, ${formatInt(r.compareceram)} votaram`, `${formatInt(r.aptos, lang)} registered, ${formatInt(r.compareceram, lang)} voted`)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span aria-hidden="true" className="inline-block h-3 border-l border-dashed border-foreground/60" />
        {t("Total do país", "Whole country")}: {formatPct(reference, 1, lang)}
      </p>
    </figure>
  );
}
