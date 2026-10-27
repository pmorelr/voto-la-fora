import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { VoteMap } from "@/components/map";
import { asLang, lp, tr } from "@/i18n";
import { alternates } from "@/lib/seo";
import { getCountryOverview } from "@/lib/data";
import { formatInt, formatPct, plural } from "@/lib/format";

// Página pública, igual para todos: fica em cache por até 60 segundos e é renovada na hora quando alguém
// publica, pede ou cancela (revalidatePath nas ações). Gerada no primeiro acesso, não no build.
export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/votar/[pais]">): Promise<Metadata> {
  const { pais, lang: raw } = await params;
  const lang = asLang(raw);
  const data = await getCountryOverview(pais, lang).catch(() => null);
  return data ? { title: tr(lang)(`Votar em ${data.country.name}`, `Voting in ${data.country.name}`), alternates: alternates(lang, `/votar/${pais.toLowerCase()}`) } : {};
}

export default async function PaisPage({ params }: PageProps<"/[lang]/votar/[pais]">) {
  const { pais, lang: raw } = await params;
  const lang = asLang(raw);
  const t = tr(lang);
  const data = await getCountryOverview(pais, lang);
  if (!data) notFound();
  const { country, cities } = data;
  const pins = cities
    .filter((c) => c.lat !== null && c.lon !== null)
    .map((c) => ({ id: c.slug, lat: c.lat!, lon: c.lon!, label: c.name, href: lp(lang, `/cidade/${c.slug}`) }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <Link href={lp(lang, "/votar")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("Outros países", "Other countries")}
      </Link>
      <h1 className="mt-4 text-4xl md:text-5xl">{country.name}</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        {cities.length === 1
          ? t("Brasileiros votam em uma cidade. Escolha a sua.", "Brazilians vote in one city here. Choose yours.")
          : t(`Brasileiros votam em ${cities.length} cidades. Escolha a sua.`, `Brazilians vote in ${cities.length} cities here. Choose yours.`)}
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <VoteMap pins={pins} />
        <ul className="space-y-2">
          {cities.map((c) => (
            <li key={c.slug}>
              <Link href={lp(lang, `/cidade/${c.slug}`)} className="group flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 transition hover:border-brand">
                <span>
                  <span className="block text-lg font-bold">{c.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {t(
                      `${formatInt(c.voters)} aptos${c.abstention_pct !== null ? `, ${formatPct(Number(c.abstention_pct))} não votaram no 1º turno` : ""}`,
                      `${formatInt(c.voters, lang)} registered${c.abstention_pct !== null ? `, ${formatPct(Number(c.abstention_pct), 0, lang)} did not vote in the 1st round` : ""}`,
                    )}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-brand-text">
                    {lang === "en"
                      ? `${plural(c.open_rides, "ride", "rides", lang)} · ${plural(c.open_seats, "seat", "seats", lang)} · ${plural(c.open_stays, "place to stay", "places to stay", lang)}`
                      : `${plural(c.open_rides, "carona", "caronas")} · ${plural(c.open_seats, "vaga", "vagas")} · ${plural(c.open_stays, "hospedagem", "hospedagens")}`}
                  </span>
                </span>
                <ArrowRight className="size-5 shrink-0 text-brand-text transition group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
