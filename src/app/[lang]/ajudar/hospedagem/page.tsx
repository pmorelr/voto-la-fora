import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StayForm } from "@/components/forms/offer-forms";
import { asLang, lp, tr } from "@/i18n";
import { getFormCountries } from "@/lib/data";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: PageProps<"/[lang]/ajudar/hospedagem">): Promise<Metadata> {
  return { title: tr(asLang((await params).lang))("Oferecer hospedagem", "Offer a place to stay") };
}

export default async function OferecerHospedagemPage({ params, searchParams }: PageProps<"/[lang]/ajudar/hospedagem">) {
  const lang = asLang((await params).lang);
  const t = tr(lang);
  const { cidade } = await searchParams;
  const [countries, session] = await Promise.all([getFormCountries(lang), getSession()]);
  const slug = typeof cidade === "string" ? cidade : "";
  const country = countries.find((c) => c.cities.some((x) => x.slug === slug))?.code ?? "";
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 md:py-14">
      <Link href={lp(lang, "/ajudar")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> {t("Quero ajudar", "I want to help")}</Link>
      <h1 className="mt-4 text-4xl">{t("Receber gente em casa", "Host someone at home")}</h1>
      <p className="mt-2 text-muted-foreground">{t("O anúncio mostra seu primeiro nome, o bairro, as noites e quantas pessoas cabem. Nada de endereço nem telefone.", "The listing shows your first name, neighbourhood, nights and how many people you can host. Never your address or phone number.")}</p>
      <div className="mt-8">
        <StayForm
          countries={countries}
          session={session}
          initial={{ country, citySlug: country ? slug : "", areaHint: "", nights: ["2026-10-24"], capacity: 1, kind: "couch", rules: "", womenOnly: false }}
        />
      </div>
    </main>
  );
}
