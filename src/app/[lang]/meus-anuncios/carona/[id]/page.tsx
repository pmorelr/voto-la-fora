import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RideForm } from "@/components/forms/offer-forms";
import { asLang, lp, tr } from "@/i18n";
import { getFormCountries } from "@/lib/data";
import { utcToZoned } from "@/lib/format";
import { getDashboard, getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: PageProps<"/[lang]/meus-anuncios/carona/[id]">): Promise<Metadata> {
  return { title: tr(asLang((await params).lang))("Editar carona", "Edit ride"), robots: { index: false, follow: false } };
}

export default async function EditarCaronaPage({ params }: PageProps<"/[lang]/meus-anuncios/carona/[id]">) {
  const { id, lang: raw } = await params;
  const lang = asLang(raw);
  const t = tr(lang);
  const session = await getSession();
  if (!session.authed || !session.hasProfile) redirect(lp(lang, "/meus-anuncios"));
  const [data, countries] = await Promise.all([getDashboard(), getFormCountries(lang)]);
  const ride = data.rides.find((r) => r.id === id);
  if (!ride || ride.status === "cancelled") notFound();
  const country = countries.find((c) => c.cities.some((x) => x.slug === ride.city.slug))?.code ?? "";
  const depart = utcToZoned(ride.depart_at, ride.city.timezone);
  const back = ride.return_at ? utcToZoned(ride.return_at, ride.city.timezone) : { date: "", time: "" };
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 md:py-14">
      <Link href={lp(lang, "/meus-anuncios")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> {t("Meus anúncios", "My listings")}</Link>
      <h1 className="mt-4 text-4xl">{t("Editar carona", "Edit ride")}</h1>
      <p className="mt-2 text-muted-foreground">{t("A cidade de votação não muda. Para outra cidade, cancele e crie um anúncio novo.", "The voting city can’t be changed. For another city, cancel this listing and create a new one.")}</p>
      <div className="mt-8">
        <RideForm
          countries={countries}
          session={session}
          editingId={ride.id}
          initial={{
            country, citySlug: ride.city.slug, originCity: ride.origin_city, departDate: depart.date, departTime: depart.time,
            returnDate: back.date, returnTime: back.time, seats: ride.seats_total, vehicle: ride.vehicle,
            meetingHint: ride.meeting_hint ?? "", notes: ride.notes ?? "", womenOnly: ride.women_only,
          }}
        />
      </div>
    </main>
  );
}
