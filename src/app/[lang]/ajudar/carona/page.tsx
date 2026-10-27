import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RideForm } from "@/components/forms/offer-forms";
import { asLang, lp, tr } from "@/i18n";
import { getFormCountries } from "@/lib/data";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: PageProps<"/[lang]/ajudar/carona">): Promise<Metadata> {
  return { title: tr(asLang((await params).lang))("Oferecer carona ou grupo", "Offer a ride or a group") };
}

export default async function OferecerCaronaPage({ params, searchParams }: PageProps<"/[lang]/ajudar/carona">) {
  const lang = asLang((await params).lang);
  const t = tr(lang);
  const { cidade, origem } = await searchParams;
  const [countries, session] = await Promise.all([getFormCountries(lang), getSession()]);
  const slug = typeof cidade === "string" ? cidade : "";
  const country = countries.find((c) => c.cities.some((x) => x.slug === slug))?.code ?? "";
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 md:py-14">
      <Link href={lp(lang, "/ajudar")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> {t("Quero ajudar", "I want to help")}</Link>
      <h1 className="mt-4 text-4xl">{t("Oferecer carona ou grupo de viagem", "Offer a ride or a travel group")}</h1>
      <p className="mt-2 text-muted-foreground">{t("O anúncio mostra seu primeiro nome, a cidade de partida, o dia, a hora e as vagas. Nada de telefone.", "The listing shows your first name, departure city, date, time and seats. Never your phone number.")}</p>
      <div className="mt-8">
        <RideForm
          countries={countries}
          session={session}
          initial={{ country, citySlug: country ? slug : "", originCity: typeof origem === "string" ? origem.slice(0, 80) : "", departDate: "2026-10-24", departTime: "07:00", returnDate: "", returnTime: "", seats: 3, vehicle: "car", meetingHint: "", notes: "", womenOnly: false }}
        />
      </div>
    </main>
  );
}
