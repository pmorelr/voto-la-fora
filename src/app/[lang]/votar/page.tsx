import type { Metadata } from "next";
import { CountryPicker } from "@/components/country-picker";
import { asLang, tr } from "@/i18n";
import { alternates } from "@/lib/seo";
import { dispensedSections } from "@/lib/content";
import { getCountriesOverview } from "@/lib/data";

// Página pública, igual para todos: fica em cache por até 60 segundos e é renovada na hora quando alguém
// publica, pede ou cancela (revalidatePath nas ações). Gerada no primeiro acesso, não no build.
export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/[lang]/votar">): Promise<Metadata> {
  const lang = asLang((await params).lang);
  return { alternates: alternates(lang, "/votar"), title: tr(lang)("Quero ir votar", "Get to the polls") };
}

export default async function VotarPage({ params }: PageProps<"/[lang]/votar">) {
  const lang = asLang((await params).lang);
  const t = tr(lang);
  const countries = await getCountriesOverview(lang);
  const dispensed = dispensedSections(lang);
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-text">{t("Quero ir votar", "Get to the polls")}</p>
      <h1 className="mt-2 text-4xl md:text-5xl">{t("Em que país você vota?", "Which country do you vote in?")}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        {t(
          "Escolha o país e depois a cidade da sua seção, a que aparece no e-Título. Aqui você vê caronas e lugares para dormir, e pede uma vaga sem cadastro.",
          "Choose the country and then the city of your polling place, the one shown in the e-Título app. Here you can see rides and places to sleep, and ask for a seat without signing up.",
        )}
      </p>
      <div className="mt-8">
        <CountryPicker countries={countries} basePath="/votar" />
      </div>
      {dispensed.length > 0 && (
        <details className="mt-10 rounded-2xl border bg-card p-5">
          <summary className="cursor-pointer text-lg font-semibold">{t("Não achou seu país ou sua cidade?", "Can't find your country or city?")}</summary>
          <p className="mt-3 text-muted-foreground">
            {t(
              "Nestes lugares, a votação foi dispensada em 2026. Quem tem título lá não tem onde votar e deve justificar a ausência no e-Título ou no autoatendimento do TSE.",
              "In these places, voting was cancelled for 2026. People registered there have nowhere to vote and must justify their absence in the e-Título app or on the TSE self-service website.",
            )}
          </p>
          <ul className="mt-4 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {dispensed.map((d) => (
              <li key={d.country}><span className="font-semibold">{d.country}:</span> {d.cities.join(", ")}</li>
            ))}
          </ul>
          <a href="https://www.tse.jus.br/servicos-eleitorais/autoatendimento-eleitoral" target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-brand-text hover:underline">
            {t("Justificar no autoatendimento do TSE", "Justify your absence on the TSE website")}
          </a>
        </details>
      )}
    </main>
  );
}
