import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { CountryResults } from "@/components/resultado/country-results";
import { Press } from "@/components/resultado/press";
import { Stories } from "@/components/resultado/stories";
import { exterior, paises, paisesPequenos, porOfertas, queda2022, site as numeros } from "@/content/resultado";
import { countryName } from "@/i18n/data";
import { isLang, lp, tr, type Lang } from "@/i18n";
import { getStories } from "@/lib/data";
import { alternates } from "@/lib/seo";
import { formatInt, formatPct } from "@/lib/format";

// Página inicial depois da eleição (26/10/2026): o resultado. As páginas do site durante a eleição continuam como
// estavam; a antiga página inicial está em /o-problema.

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  return { alternates: alternates(isLang(lang) ? lang : "pt", "/") };
}

export default async function Resultado({ params }: PageProps<"/[lang]">) {
  const { lang: raw } = await params;
  const lang: Lang = isLang(raw) ? raw : "pt";
  const t = tr(lang);
  const pct = (n: number) => formatPct(n, 1, lang);
  const int = (n: number) => formatInt(n, lang);
  const pp = (n: number) => Math.abs(n).toFixed(1).replace(".", lang === "en" ? "." : ",");
  const maisVotantes = exterior.turno2.compareceram - exterior.turno1.compareceram;
  const queda = exterior.turno1.abstencao - exterior.turno2.abstencao;
  const caiu = paises.filter((p) => p.abstencao2 < p.abstencao1).length;
  const stories = await getStories();

  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-8 md:pb-20 md:pt-14">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-text">{t("2º turno · 25 de outubro de 2026", "2nd round · 25 October 2026")}</p>
        <h1 className="mt-4 max-w-3xl text-[3.4rem] leading-[0.98] md:text-7xl">Votou-se Aqui Fora</h1>
        <p className="mt-3 font-serif text-3xl font-bold text-muted-foreground md:text-4xl">{t("Obrigado.", "Thank you.")}</p>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          {t(
            `Em três semanas, ${int(numeros.ofertantes)} pessoas ofereceram uma vaga no carro ou um lugar para dormir para que outros brasileiros chegassem à urna. No 2º turno, a abstenção no exterior caiu de ${pct(exterior.turno1.abstencao)} para ${pct(exterior.turno2.abstencao)}.`,
            `In three weeks, ${int(numeros.ofertantes)} people offered a seat in their car or a place to sleep so other Brazilians could get to the polls. In the 2nd round, abstention abroad fell from ${pct(exterior.turno1.abstencao)} to ${pct(exterior.turno2.abstencao)}.`,
          )}
        </p>

        <dl className="mt-8 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-5 border-y py-5 sm:grid-cols-4">
          {[
            { n: int(numeros.ofertantes), l: t("pessoas ofereceram ajuda", "people offered help") },
            { n: int(numeros.caronas + numeros.hospedagens), l: t(`anúncios: ${int(numeros.caronas)} caronas e ${int(numeros.hospedagens)} hospedagens`, `listings: ${int(numeros.caronas)} rides and ${int(numeros.hospedagens)} places to stay`) },
            { n: int(numeros.lugares), l: t("lugares combinados em carros e casas", "seats and beds arranged") },
            { n: int(numeros.paises), l: t("países com ofertas", "countries with offers") },
          ].map((x) => (
            <div key={x.l}>
              <dt className="sr-only">{x.l}</dt>
              <dd className="font-serif text-5xl font-bold leading-none tabular-nums md:text-6xl">{x.n}</dd>
              <dd className="mt-2 text-sm leading-snug text-muted-foreground md:text-base">{x.l}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">{t("Números do Voto Lá Fora em 26/10/2026.", "Voto Lá Fora figures as of 26 October 2026.")}</p>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div className="space-y-5 text-lg leading-relaxed">
            <h2 className="text-3xl md:text-4xl">{t("A abstenção no exterior caiu", "Abstention abroad went down")}</h2>
            <p>
              {t(
                `No 1º turno, ${pct(exterior.turno1.abstencao)} dos brasileiros aptos a votar no exterior não votaram. No 2º, ${pct(exterior.turno2.abstencao)}. Foram ${int(maisVotantes)} eleitores a mais nas urnas fora do Brasil.`,
                `In the 1st round, ${pct(exterior.turno1.abstencao)} of Brazilians registered to vote abroad did not vote. In the 2nd, ${pct(exterior.turno2.abstencao)}. That is ${int(maisVotantes)} more people voting outside Brazil.`,
              )}
            </p>
            <p>
              {t(
                `É uma queda de ${pp(queda)} pontos entre os dois turnos. Em 2022, a queda tinha sido de ${pp(queda2022)} ponto.`,
                `That is a drop of ${pp(queda)} points between the two rounds. In 2022, the drop was ${pp(queda2022)} points.`,
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 self-center">
            <div className="rounded-2xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">{t("Abstenção no 1º turno", "Abstention, 1st round")}</p>
              <p className="mt-1 font-serif text-5xl font-bold tabular-nums text-muted-foreground">{pct(exterior.turno1.abstencao)}</p>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">{t("Abstenção no 2º turno", "Abstention, 2nd round")}</p>
              <p className="mt-1 font-serif text-5xl font-bold tabular-nums">{pct(exterior.turno2.abstencao)}</p>
            </div>
            <div className="col-span-2 rounded-2xl border bg-card p-5">
              <p className="font-serif text-4xl font-bold tabular-nums">+{int(maisVotantes)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("eleitores votaram no 2º turno a mais do que no 1º", "more people voted in the 2nd round than in the 1st")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <h2 className="text-3xl md:text-4xl">{t("Na imprensa", "In the press")}</h2>
        <div className="mt-8">
          <Press lang={lang} />
        </div>
      </section>

      {stories.length > 0 && (
        <section className="bg-secondary">
          <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
            <h2 className="text-3xl md:text-4xl">{t("Quem foi votar", "Who went to vote")}</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">{t("Relatos de quem ofereceu, pediu ou espalhou o Voto Lá Fora, publicados com autorização.", "Stories from people who offered, asked for or shared Voto Lá Fora, published with their permission.")}</p>
            <div className="mt-8">
              <Stories stories={stories} lang={lang} />
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <h2 className="text-3xl md:text-4xl">{t("País por país", "Country by country")}</h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          {t(
            `Os países onde o site teve ofertas e que têm pelo menos 1.000 eleitores, da maior queda da abstenção para a menor. A abstenção caiu em ${caiu} dos ${paises.length}.`,
            `Countries where the site had offers and with at least 1,000 registered voters, from the largest drop in abstention to the smallest. Abstention fell in ${caiu} of the ${paises.length}.`,
          )}
        </p>
        <div className="mt-8">
          <CountryResults rows={paises} lang={lang} />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t(
            `Também houve ofertas em ${paisesPequenos.length} países com menos de 1.000 eleitores, onde poucas dezenas de votos mudam muito a porcentagem: ${paisesPequenos.map((p) => countryName(lang, p)).join(", ")}. E em Luxemburgo, cujos eleitores votam em outro país.`,
            `There were also offers in ${paisesPequenos.length} countries with fewer than 1,000 registered voters, where a few dozen votes change the percentage a lot: ${paisesPequenos.map((p) => countryName(lang, p)).join(", ")}. And in Luxembourg, whose voters vote in another country.`,
          )}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{t("Fonte: TSE, resultados oficiais do 1º e do 2º turno de 2026, cargo Presidente.", "Source: TSE (Brazil's Superior Electoral Court), official 1st and 2nd round results for 2026, presidential race.")}</p>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <h2 className="text-3xl md:text-4xl">{t("O que esses números dizem, e o que não dizem", "What these numbers say, and what they don't")}</h2>
          <div className="mt-6 grid gap-10 md:grid-cols-[1.1fr_1fr]">
            <div className="space-y-5 text-lg leading-relaxed">
              <p>
                {t(
                  "Nas cidades onde o site teve mais anúncios, a abstenção caiu mais. Mas isso não quer dizer que a queda veio do site.",
                  "In the cities where the site had the most listings, abstention fell the most. But that does not mean the drop came from the site.",
                )}
              </p>
              <p>
                {t(
                  `O Voto Lá Fora combinou ${int(numeros.lugares)} lugares, uma pequena parte dos ${int(maisVotantes)} eleitores a mais. Onde a comunidade brasileira estava mais mobilizada, mais gente ofereceu carona e mais gente foi votar. A queda veio de muita gente ao mesmo tempo: famílias, amigos, grupos, imprensa, consulados.`,
                  `Voto Lá Fora arranged ${int(numeros.lugares)} seats and beds, a small share of the ${int(maisVotantes)} additional voters. Where the Brazilian community was most mobilised, more people offered rides and more people went to vote. The drop came from many people at once: families, friends, groups, the press, consulates.`,
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-bold">{t("Abstenção do 1º para o 2º turno, por cidade de votação", "Change in abstention from the 1st to the 2nd round, by voting city")}</p>
              <ul className="mt-3 space-y-3">
                {porOfertas.map((g) => (
                  <li key={g.faixa} className="rounded-2xl border bg-card p-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="font-bold">
                        {g.faixa === "20+" ? t("20 anúncios ou mais", "20 listings or more") : g.faixa === "0" ? t("Nenhum anúncio", "No listings") : t("1 a 19 anúncios", "1 to 19 listings")}
                      </p>
                      <p className="font-serif text-2xl font-bold tabular-nums">−{pp(g.variacao)}</p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-secondary" aria-hidden>
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${(Math.abs(g.variacao) / 6) * 100}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{t(`${g.cidades} cidades · ${g.votantes.toString().replace(".", ",")}% mais votantes`, `${g.cidades} cities · ${g.votantes}% more voters`)}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">{t("Em pontos percentuais. Cidades com muitos anúncios são, em geral, as maiores.", "In percentage points. Cities with many listings are mostly the largest ones.")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <h2 className="text-3xl md:text-4xl">{t("Agradecimentos", "Acknowledgements")}</h2>
        <div className="mt-6 max-w-3xl space-y-5 text-lg leading-relaxed">
          <p>{t("O Voto Lá Fora não teria saído do papel sem algumas pessoas.", "Voto Lá Fora would never have got off the ground without a few people.")}</p>
          <p>
            <b>Bárbara Rangel</b>
            {t(
              ", que se encarregou de contatar centros culturais, restaurantes e todo lugar que pudesse divulgar o site, em diferentes cidades e países, e cuidou da impressão dos cartazes.",
              ", who took charge of contacting cultural centres, restaurants and every place that could share the site, in different cities and countries, and looked after printing the posters.",
            )}
          </p>
          <p>
            <b>{t("Pedro Corgozinho, Ana Clara Jansen e Tatiana Cavalcant", "Pedro Corgozinho, Ana Clara Jansen and Tatiana Cavalcant")}</b>
            {t(
              ", que deram ao site toda a sua robustez jurídica, em diferentes frentes, para que ele estivesse de acordo com a lei eleitoral.",
              ", who gave the site all its legal robustness, on different fronts, so that it complied with electoral law.",
            )}
          </p>
          <p>
            <b>Madelyn Romberg</b>
            {t(
              ", grande colega engenheira de software, que trouxe ideias valiosíssimas sobre o desenho do sistema e a experiência de uso.",
              ", a great fellow software engineer, who brought invaluable ideas on the system's design and the user experience.",
            )}
          </p>
          <p>
            {t(
              "E a todo mundo que usou o site, ofereceu uma vaga, abriu a casa, pediu um lugar ou espalhou o link. Para além dos números, o Voto Lá Fora fez parte de uma mobilização de muitas mãos, em muitos meios, e de muito valor para a nossa democracia.",
              "And to everyone who used the site, offered a seat, opened their home, asked for a place or shared the link. Beyond the numbers, Voto Lá Fora was part of a mobilisation of many hands, through many means, and of great value to our democracy.",
            )}
          </p>
          <p className="font-serif text-2xl font-bold md:text-3xl">{t("E que essa mobilização não pare por aqui.", "And may this mobilisation not stop here.")}</p>
          <p className="italic text-muted-foreground">Pedro Morel Rosa</p>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <h2 className="text-3xl md:text-4xl">{t("O site como ele foi", "The site as it was")}</h2>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t(
              "As páginas usadas durante a eleição continuam no ar como estavam: o problema da abstenção, as cidades de votação e os mapas.",
              "The pages used during the election are still online as they were: the abstention problem, the voting cities and the maps.",
            )}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href={lp(lang, "/o-problema")} className="inline-flex h-13 items-center justify-center gap-2 rounded-md bg-primary px-7 text-[17px] font-bold text-primary-foreground transition hover:bg-brand-deep">
              {t("Ver o problema", "See the problem")} <ArrowRight className="size-4" />
            </Link>
            <Link href={lp(lang, "/votar")} className="inline-flex h-13 items-center justify-center rounded-md border-[1.5px] border-foreground px-7 text-[17px] font-bold transition hover:bg-secondary">
              {t("Cidades de votação", "Voting cities")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
