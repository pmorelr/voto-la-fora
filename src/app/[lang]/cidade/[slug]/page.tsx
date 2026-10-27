import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Car, Clock, ExternalLink, House, IdCard, MapPin } from "lucide-react";
import { AlertForm } from "@/components/forms/alert-form";
import { RideCard, StayCard } from "@/components/listing-cards";
import { VoteMap, type MapArc, type MapPin as Pin } from "@/components/map";
import { asLang, lp, tr } from "@/i18n";
import { getCityListings } from "@/lib/data";
import { formatInt, formatPct, hasEuropeanDstChange, isGroupTrip } from "@/lib/format";

// Página pública, igual para todos: fica em cache por até 60 segundos e é renovada na hora quando alguém
// publica, pede ou cancela (revalidatePath nas ações). Gerada no primeiro acesso, não no build.
export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

// Fonte: Consulado-Geral do Brasil em Marselha, "Assuntos Eleitorais, Eleições 2026".
const acceptedDocs = [
  ["e-Título com foto", "e-Título app with photo"],
  ["Carteira de identidade (RG)", "Brazilian identity card (RG)"],
  ["Passaporte, mesmo vencido", "Passport, even if expired"],
  ["Carteira de motorista, mesmo vencida", "Brazilian driving licence, even if expired"],
  ["Carteira de identidade profissional", "Professional identity card"],
  ["Certificado de reservista com foto", "Military reservist certificate with photo"],
  ["Carteira de trabalho física", "Paper work record booklet (carteira de trabalho)"],
] as const;

export async function generateMetadata({ params }: PageProps<"/[lang]/cidade/[slug]">): Promise<Metadata> {
  const { slug, lang: raw } = await params;
  const lang = asLang(raw);
  const t = tr(lang);
  const data = await getCityListings(slug, lang).catch(() => null);
  if (!data) return {};
  // Anúncios têm primeiro nome e cidade de partida: fora dos buscadores.
  return {
    title: data.city.name,
    robots: { index: false, follow: false },
    openGraph: {
      title: t(`Votar em ${data.city.name}: caronas e lugar para dormir`, `Voting in ${data.city.name}: rides and places to stay`),
      description: t(
        `Quem pode oferecer uma carona ou um lugar para dormir e quem precisa chegar à seção eleitoral em ${data.city.name}, no 2º turno de 25 de outubro.`,
        `People who can offer a ride or a place to sleep, and people who need to reach the polling place in ${data.city.name}, for the 2nd round on 25 October.`,
      ),
    },
  };
}

export default async function CityPage({ params }: PageProps<"/[lang]/cidade/[slug]">) {
  const { slug, lang: raw } = await params;
  const lang = asLang(raw);
  const t = tr(lang);
  const data = await getCityListings(slug, lang);
  if (!data) notFound();
  const { city, rides, stays } = data;
  const places = city.places ?? [];
  const partOfLargerSection = places.length > 1;
  const sectionAbstention = partOfLargerSection ? city.jurisdiction_abstention_pct : city.abstention_pct;
  // O TSE nem sempre põe a cidade no endereço; sem ela, a busca do mapa erra.
  const semAcento = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const mapQuery = city.address
    ? semAcento(city.address).includes(semAcento(city.name)) ? city.address : `${city.address}, ${city.name}`
    : city.venue_name ? `${city.venue_name}, ${city.name}` : null;

  const pins: Pin[] = [];
  if (city.lat !== null && city.lon !== null) pins.push({ id: city.slug, lat: city.lat, lon: city.lon, label: city.name });
  const arcs: MapArc[] = [];
  for (const r of rides) {
    if (r.origin_lat === null || r.origin_lon === null || city.lat === null || city.lon === null) continue;
    arcs.push({ from: [r.origin_lon, r.origin_lat], to: [city.lon, city.lat], group: isGroupTrip(r.vehicle) });
    pins.push({ id: r.id, lat: r.origin_lat, lon: r.origin_lon, label: r.origin_city, kind: "origin" });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <Link href={lp(lang, `/votar/${city.country_code.toLowerCase()}`)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {city.country_name}
      </Link>
      <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-brand-text">{t("2º turno · domingo, 25 de outubro", "2nd round · Sunday, 25 October")}</p>
      <h1 className="mt-1 text-4xl md:text-6xl">{city.name}</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        {t(`${formatInt(city.place_voters ?? city.voters)} brasileiros votam aqui.`, `${formatInt(city.place_voters ?? city.voters, lang)} Brazilians vote here.`)}
        {sectionAbstention !== null &&
          (partOfLargerSection
            ? t(
                ` No 1º turno, ${formatPct(Number(sectionAbstention))} dos eleitores da seção de ${city.jurisdiction} não votaram.`,
                ` In the 1st round, ${formatPct(Number(sectionAbstention), 0, lang)} of voters in the ${city.jurisdiction} polling area did not vote.`,
              )
            : t(` No 1º turno, ${formatPct(Number(sectionAbstention))} não votaram.`, ` In the 1st round, ${formatPct(Number(sectionAbstention), 0, lang)} did not vote.`))}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="flex items-center gap-2 text-lg"><MapPin className="size-5 text-brand-text" /> {t("Onde votar", "Where to vote")}</h2>
            {city.venue_name ? (
              <>
                <p className="mt-3 font-semibold">{city.venue_name}</p>
                {city.address && <p className="text-muted-foreground">{city.address}</p>}
                {mapQuery && (
                  <a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-text hover:underline">
                    {t("Ver no mapa", "See on the map")} <ExternalLink className="size-3.5" />
                  </a>
                )}
              </>
            ) : (
              <p className="mt-3 text-muted-foreground">{t("O endereço exato da seção está no seu e-Título e na consulta do TSE.", "The exact address of your polling place is in the e-Título app and on the TSE website.")}</p>
            )}
            <p className="mt-3 flex items-center gap-2"><Clock className="size-4 text-brand-text" /> {city.hours ?? t("8h às 17h, hora local", "8 am to 5 pm, local time")}</p>
            {city.notes && <p className="mt-3 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">{city.notes}</p>}
            {partOfLargerSection && (
              <div className="mt-3">
                <p className="text-sm font-semibold">{t(`Locais da seção de ${city.jurisdiction}`, `Polling places for the ${city.jurisdiction} area`)}</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {places.map((p) => (
                    <li key={p.slug}>
                      {p.slug === city.slug ? (
                        <span className="font-semibold">{p.name}</span>
                      ) : (
                        <Link href={lp(lang, `/cidade/${p.slug}`)} className="font-semibold text-brand-text hover:underline">{p.name}</Link>
                      )}
                      <span className="text-muted-foreground">{p.venue_name ? `, ${p.venue_name}` : ""} · {t(`${formatInt(p.voters)} eleitores`, `${formatInt(p.voters, lang)} voters`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <a href="https://www.tse.jus.br/servicos-eleitorais/autoatendimento-eleitoral" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-text hover:underline">
              {t("Confira sua seção no autoatendimento do TSE", "Check your polling place on the TSE website")} <ExternalLink className="size-3.5" />
            </a>
          </section>

          {hasEuropeanDstChange(city.timezone) && (
            <section className="rounded-2xl border border-brand/40 bg-accent p-5">
              <h2 className="flex items-center gap-2 text-lg text-accent-foreground"><AlertTriangle className="size-5" /> {t("O relógio muda no dia da eleição", "The clocks change on election day")}</h2>
              <p className="mt-2">{t("Na madrugada de 25 de outubro a Europa sai do horário de verão. Às 3h, os relógios voltam para 2h. Confira o horário do trem, do ônibus ou da carona.", "In the early hours of 25 October, Europe ends summer time. At 3 am, clocks go back to 2 am. Double-check the time of your train, bus or ride.")}</p>
            </section>
          )}

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="flex items-center gap-2 text-lg"><IdCard className="size-5 text-brand-text" /> {t("Documento com foto", "Photo ID")}</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">{acceptedDocs.map(([pt, en]) => <li key={pt}>{t(pt, en)}</li>)}</ul>
            <p className="mt-3 text-sm text-muted-foreground">{t("Não valem certidão de nascimento, certidão de casamento nem carteira de trabalho digital.", "Birth certificates, marriage certificates and the digital work record are not accepted.")}</p>
          </section>
        </div>
        <VoteMap pins={pins} arcs={arcs} className="h-[420px] lg:h-full lg:min-h-[420px]" />
      </div>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="flex items-center gap-2 text-3xl"><Car className="size-7 text-brand-text" /> {t(`Caronas e grupos para ${city.name}`, `Rides and groups to ${city.name}`)}</h2>
          <Link href={lp(lang, `/ajudar/carona?cidade=${city.slug}`)} className="font-bold text-brand-text hover:underline">{t("Oferecer carona ou grupo", "Offer a ride or a group")}</Link>
        </div>
        {rides.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed p-6 text-muted-foreground">{t(`Ainda não há caronas nem grupos para ${city.name}. Peça um aviso abaixo, ou compartilhe esta página com quem tem carro ou quer ir de trem em grupo.`, `No rides or groups to ${city.name} yet. Ask to be notified below, or share this page with someone who has a car or wants to go by train as a group.`)}</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rides.map((r) => <RideCard key={r.id} ride={r} citySlug={city.slug} cityName={city.name} timezone={city.timezone} lang={lang} />)}
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="flex items-center gap-2 text-3xl"><House className="size-7 text-brand-text" /> {t(`Onde dormir em ${city.name}`, `Places to stay in ${city.name}`)}</h2>
          <Link href={lp(lang, `/ajudar/hospedagem?cidade=${city.slug}`)} className="font-bold text-brand-text hover:underline">{t("Oferecer hospedagem", "Offer a place to stay")}</Link>
        </div>
        {stays.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed p-6 text-muted-foreground">{t(`Ainda não há hospedagem oferecida em ${city.name}. Peça um aviso abaixo.`, `No places to stay offered in ${city.name} yet. Ask to be notified below.`)}</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stays.map((s) => <StayCard key={s.id} stay={s} citySlug={city.slug} lang={lang} />)}
          </div>
        )}
      </section>

      <section id="aviso" className="mt-12 grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-start">
        <div>
          <h2 className="text-3xl">{t("Me avise quando surgir algo", "Notify me when something comes up")}</h2>
          <p className="mt-3 text-muted-foreground">{t(`Mandamos no máximo um e-mail por dia com as ofertas novas para ${city.name}. Para cancelar, um clique.`, `We send at most one email a day with new offers for ${city.name}. One click to unsubscribe.`)}</p>
        </div>
        <AlertForm citySlug={city.slug} cityName={city.name} />
      </section>
    </main>
  );
}
