import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RequestForm } from "@/components/forms/request-form";
import { RideCard, StayCard } from "@/components/listing-cards";
import { asLang, lp, tr } from "@/i18n";
import { getCityListings } from "@/lib/data";
import { isGroupTrip } from "@/lib/format";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: PageProps<"/[lang]/cidade/[slug]/pedir/[tipo]/[id]">): Promise<Metadata> {
  return { title: tr(asLang((await params).lang))("Pedir uma vaga", "Request a seat"), robots: { index: false, follow: false } };
}

export default async function PedirPage({ params }: PageProps<"/[lang]/cidade/[slug]/pedir/[tipo]/[id]">) {
  const { slug, tipo, id, lang: raw } = await params;
  const lang = asLang(raw);
  const t = tr(lang);
  if (tipo !== "carona" && tipo !== "hospedagem") notFound();
  const data = await getCityListings(slug, lang);
  if (!data) notFound();
  const { city } = data;
  const ride = tipo === "carona" ? data.rides.find((r) => r.id === id) : undefined;
  const stay = tipo === "hospedagem" ? data.stays.find((s) => s.id === id) : undefined;
  const listing = ride ?? stay;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <Link href={lp(lang, `/cidade/${city.slug}`)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t(`Ofertas para ${city.name}`, `Offers for ${city.name}`)}
      </Link>
      <h1 className="mt-4 text-4xl">{tipo === "carona" ? (ride && isGroupTrip(ride.vehicle) ? t("Pedir para ir junto", "Ask to join the group") : t("Pedir uma vaga na carona", "Request a seat in this ride")) : t("Pedir hospedagem", "Request a place to stay")}</h1>
      {!listing || listing.status !== "open" ? (
        <p className="mt-6 rounded-2xl border border-dashed p-6 text-muted-foreground">
          {t("Este anúncio não está mais aceitando pedidos.", "This listing is no longer accepting requests.")}{" "}
          <Link href={lp(lang, `/cidade/${city.slug}`)} className="font-bold text-brand-text underline">{t("Veja outras ofertas", "See other offers")}</Link>.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {ride && <RideCard ride={ride} citySlug={city.slug} cityName={city.name} timezone={city.timezone} showAction={false} lang={lang} />}
          {stay && <StayCard stay={stay} citySlug={city.slug} showAction={false} lang={lang} />}
          <p className="text-muted-foreground">
            {t(
              `Você não precisa criar conta. Deixe seu nome e WhatsApp: se ${listing.first_name} confirmar, vai te chamar para combinar.`,
              `You don't need an account. Leave your name and WhatsApp number: if ${listing.first_name} confirms, they will message you to arrange the details.`,
            )}
          </p>
          <RequestForm
            kind={ride ? "ride" : "stay"}
            listingId={listing.id}
            citySlug={city.slug}
            offererFirstName={listing.first_name}
            maxPeople={ride ? ride.seats_left : Math.max(...stay!.nights.map((n) => n.remaining))}
            womenOnly={listing.women_only}
            nights={stay?.nights}
          />
        </div>
      )}
    </main>
  );
}
