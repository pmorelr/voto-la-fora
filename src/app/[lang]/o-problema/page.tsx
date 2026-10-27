import Link from "next/link";
import { ArrowRight, Car, House, MapPin, Vote } from "lucide-react";
import { AbstentionChart } from "@/components/abstention-chart";
import { DemandSection } from "@/components/home/demand-section";
import { ShareSite } from "@/components/home/share-site";
import { SiteStats } from "@/components/home/site-stats";
import { BrandName } from "@/components/logo";
import { distancias, exterior2022, locais, paisesEmDestaque, totais } from "@/content/abstencao";
import { isLang, lp, tr, type Lang } from "@/i18n";
import type { Metadata } from "next";
import { site } from "@/lib/config";
import { alternates } from "@/lib/seo";
import { getRideDemand, getSiteStats } from "@/lib/data";
import { countdownLabel, daysUntilRunoff, formatInt, formatPct } from "@/lib/format";

// O contador "Até agora" se renova a cada 5 minutos.
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/o-problema">): Promise<Metadata> {
  const { lang } = await params;
  return { alternates: alternates(isLang(lang) ? lang : "pt", "/o-problema") };
}

export default async function Home({ params }: PageProps<"/[lang]/o-problema">) {
  const { lang: raw } = await params;
  const lang: Lang = isLang(raw) ? raw : "pt";
  const t = tr(lang);
  const pct = (n: number) => formatPct(n, 1, lang);
  const days = daysUntilRunoff();
  const paises = paisesEmDestaque(lang);
  const growthVoters = Math.round(100 * (totais.exterior.aptos / exterior2022.turno1.aptos - 1));
  const growthTurnout = Math.round(100 * (totais.exterior.compareceram / exterior2022.turno1.compareceram - 1));
  const [stats, demand] = await Promise.all([getSiteStats(), getRideDemand(lang)]);

  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-8 md:pb-20 md:pt-14">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-text">{t("2º turno · domingo, 25 de outubro", "2nd round · Sunday, 25 October")}</p>
        <h1 className="mt-4 max-w-3xl text-[3.4rem] leading-[0.98] md:text-7xl"><BrandName suffix="." /></h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          {t(
            `No 1º turno, 6 em cada 10 brasileiros aptos a votar no exterior não votaram. Fora do Brasil, só há ${locais.total} locais de votação. Este projeto conecta quem pode oferecer uma carona ou um lugar para dormir a quem precisa chegar à urna. Aberto a qualquer eleitor.`,
            `In the 1st round of Brazil's presidential election, 6 in 10 Brazilians registered to vote abroad did not vote. Outside Brazil there are only ${locais.total} polling places. This project connects people who can offer a ride or a place to sleep with Brazilians who need to get to the polls. Open to every voter.`,
          )}
        </p>
        <div className="mt-8 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-5 border-y py-5 sm:grid-cols-3">
          <div>
            <p className="font-serif text-5xl font-bold leading-none tabular-nums text-brand-text md:text-6xl">{pct(totais.exterior.abstencao)}</p>
            <p className="mt-2 text-sm leading-snug text-muted-foreground md:text-base">{t("dos brasileiros aptos no exterior não votaram no 1º turno", "of Brazilians registered abroad did not vote in the 1st round")}</p>
          </div>
          <div>
            <p className="font-serif text-5xl font-bold leading-none tabular-nums md:text-6xl">{pct(totais.pais.abstencao)}</p>
            <p className="mt-2 text-sm leading-snug text-muted-foreground md:text-base">{t("foi a abstenção no total do país", "was the abstention rate across the whole country")}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="font-serif text-5xl font-bold leading-none tabular-nums md:text-6xl">{pct(exterior2022.turno1.abstencao)}</p>
            <p className="mt-2 text-sm leading-snug text-muted-foreground md:text-base">{t("foi a abstenção no exterior no 1º turno de 2022", "was the abstention rate abroad in the 1st round of 2022")}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t("Fonte: TSE, resultados oficiais do 1º turno de 2026 e de 2022", "Source: TSE (Brazil's Superior Electoral Court), official 1st-round results for 2026 and 2022")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={lp(lang, "/votar")} className="inline-flex h-13 items-center justify-center gap-2 rounded-md bg-primary px-7 text-[17px] font-bold text-primary-foreground transition hover:bg-brand-deep">
            {t("Quero ir votar", "I need to get to the polls")} <ArrowRight className="size-4" />
          </Link>
          <Link href={lp(lang, "/ajudar")} className="inline-flex h-13 items-center justify-center rounded-md border-[1.5px] border-foreground px-7 text-[17px] font-bold transition hover:bg-secondary">
            {t("Quero ajudar", "I want to help")}
          </Link>
        </div>
        <p className="mt-6 text-sm font-bold text-brand-text">{countdownLabel(days, lang)}</p>
      </section>

      {stats && stats.people > 0 && <SiteStats stats={stats} lang={lang} />}

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1fr_1.1fr] md:py-20">
        <div className="space-y-5 text-lg leading-relaxed">
          <h2 className="text-3xl md:text-4xl">{t("Votar fora do Brasil é mais difícil do que deveria", "Voting outside Brazil is harder than it should be")}</h2>
          <p>
            {t(
              `Os ${locais.total} locais de votação ficam em ${locais.paises} países, quase sempre um ou dois por país. Na França são dois, Paris e Marselha. Na Espanha, Madri e Barcelona. Na Itália, Milão e Roma. No Reino Unido, Londres e Edimburgo.`,
              `The ${locais.total} polling places are spread over ${locais.paises} countries, usually one or two per country. In France there are two, Paris and Marseille. In Spain, Madrid and Barcelona. In Italy, Milan and Rome. In the United Kingdom, London and Edinburgh.`,
            )}
          </p>
          <p>
            {t(
              `E a abstenção cresceu. No 1º turno de 2022, ${pct(exterior2022.turno1.abstencao)} não votaram. Em 2026, ${pct(totais.exterior.abstencao)}. Desde 2022, o eleitorado no exterior cresceu ${growthVoters}%, mas o número de votantes só ${growthTurnout}%.`,
              `And abstention has grown. In the 1st round of 2022, ${pct(exterior2022.turno1.abstencao)} did not vote. In 2026, ${pct(totais.exterior.abstencao)}. Since 2022 the number of voters registered abroad has grown by ${growthVoters}%, but the number who actually voted by only ${growthTurnout}%.`,
            )}
          </p>
          <p>
            {t(
              "Onde a seção fica ao alcance, metade vota. Nos Países Baixos, na Bélgica e na Irlanda, a abstenção ficou perto de 50%. Na Espanha e na Itália, passou de 68%.",
              "Where the polling place is within reach, half of voters turn out. In the Netherlands, Belgium and Ireland, abstention was close to 50%. In Spain and Italy, it was above 68%.",
            )}
          </p>
          <p className="text-base text-muted-foreground">
            {t(
              "Nem toda abstenção é distância. Há títulos de quem já voltou ao Brasil sem transferir, e nos Estados Unidos houve medo da fiscalização migratória. Mas onde a urna fica longe, menos gente vota.",
              "Not all abstention is about distance. Some registered voters have moved back to Brazil without updating their registration, and in the United States some people feared immigration checks. But where the polls are far away, fewer people vote.",
            )}
          </p>
        </div>
        <AbstentionChart rows={paises} reference={totais.pais.abstencao} lang={lang} />
      </section>

      <section className="bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <h2 className="text-3xl md:text-4xl">{t("A urna fica longe", "The polls are far away")}</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {t(
              "Distância em linha reta até a cidade de votação mais próxima. Por estrada, é mais. E cada pessoa vota na cidade onde está inscrita, que nem sempre é a mais perto.",
              "Straight-line distance to the nearest city with a polling place. By road it is further. And each person votes in the city where they are registered, which is not always the closest.",
            )}
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {distancias.map((d) => (
              <li key={d.origem} className="rounded-2xl border bg-card p-5">
                <p className="flex items-center gap-2 font-bold"><MapPin className="size-4 text-brand-text" /> {lang === "en" ? d.origemEn : d.origem}</p>
                <p className="mt-1 text-muted-foreground">{lang === "en" ? d.destinoEn : d.destino}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {demand && demand.origens.length > 0 && <DemandSection pessoas={demand.pessoas} origens={demand.origens} />}

      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <h2 className="text-3xl md:text-4xl">{t("Dá para mudar isso para alguém", "You can change this for someone")}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link href={lp(lang, "/votar")} className="group rounded-2xl border bg-card p-6 transition hover:border-brand">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground"><House className="size-5" /></span>
            <h3 className="mt-4 text-2xl">{t("Não conseguiu votar no 1º turno?", "Couldn't vote in the 1st round?")}</h3>
            <p className="mt-2 text-muted-foreground">{t("Se a distância pesou, encontre aqui uma carona ou um lugar para dormir perto da sua seção. Sem cadastro.", "If distance was the problem, find a ride or a place to sleep near your polling place here. No sign-up needed.")}</p>
            <span className="mt-4 inline-flex items-center gap-1 font-bold text-brand-text">{t("Quero ir votar", "Find a ride or a bed")} <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
          </Link>
          <Link href={lp(lang, "/votar")} className="group rounded-2xl border bg-card p-6 transition hover:border-brand">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground"><Vote className="size-5" /></span>
            <h3 className="mt-4 text-2xl">{t("Votou no 1º turno?", "Voted in the 1st round?")}</h3>
            <p className="mt-2 text-muted-foreground">{t(`Volte no dia 25. No 2º turno de 2022, o mais votado no exterior ficou só ${formatInt(exterior2022.turno2Diferenca, lang)} votos à frente do segundo. O seu voto conta.`, `Come back on the 25th. In the 2nd round of 2022, the winner among voters abroad was only ${formatInt(exterior2022.turno2Diferenca, lang)} votes ahead of the runner-up. Your vote counts.`)}</p>
            <span className="mt-4 inline-flex items-center gap-1 font-bold text-brand-text">{t("Ver minha seção", "See my polling place")} <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
          </Link>
          <Link href={lp(lang, "/ajudar")} className="group rounded-2xl border bg-card p-6 transition hover:border-brand">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground"><Car className="size-5" /></span>
            <h3 className="mt-4 text-2xl">{t("Mora perto de uma seção ou vai de carro?", "Live near a polling place or driving there?")}</h3>
            <p className="mt-2 text-muted-foreground">{t("Ofereça uma vaga ou um sofá. Mesmo quem não transferiu o título pode ajudar quem pode votar. Leva dois minutos.", "Offer a seat or a sofa. You don't need to be a Brazilian voter to help someone who is. It takes two minutes.")}</p>
            <span className="mt-4 inline-flex items-center gap-1 font-bold text-brand-text">{t("Quero ajudar", "I want to help")} <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
          </Link>
        </div>
      </section>

      <ShareSite siteUrl={site.url} />
    </main>
  );
}
