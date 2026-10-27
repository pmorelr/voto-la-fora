import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ReportForm } from "@/components/forms/report-form";
import { RideCard, StayCard } from "@/components/listing-cards";
import { asLang, lp, tr } from "@/i18n";
import { getCityListings } from "@/lib/data";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: PageProps<"/[lang]/cidade/[slug]/denunciar/[tipo]/[id]">): Promise<Metadata> {
  return { title: tr(asLang((await params).lang))("Denunciar anúncio", "Report listing"), robots: { index: false, follow: false } };
}

export default async function DenunciarPage({ params }: PageProps<"/[lang]/cidade/[slug]/denunciar/[tipo]/[id]">) {
  const { slug, tipo, id, lang: raw } = await params;
  const lang = asLang(raw);
  const t = tr(lang);
  if (tipo !== "carona" && tipo !== "hospedagem") notFound();
  const data = await getCityListings(slug, lang);
  if (!data) notFound();
  const { city } = data;
  const ride = tipo === "carona" ? data.rides.find((r) => r.id === id) : undefined;
  const stay = tipo === "hospedagem" ? data.stays.find((s) => s.id === id) : undefined;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <Link href={lp(lang, `/cidade/${city.slug}`)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t(`Ofertas para ${city.name}`, `Offers for ${city.name}`)}
      </Link>
      <h1 className="mt-4 text-4xl">{t("Denunciar anúncio", "Report listing")}</h1>
      {!ride && !stay ? (
        <p className="mt-6 rounded-2xl border border-dashed p-6 text-muted-foreground">{t("Este anúncio não está mais no ar.", "This listing is no longer online.")}</p>
      ) : (
        <div className="mt-6 space-y-6">
          {ride && <RideCard ride={ride} citySlug={city.slug} cityName={city.name} timezone={city.timezone} showAction={false} lang={lang} />}
          {stay && <StayCard stay={stay} citySlug={city.slug} showAction={false} lang={lang} />}
          <ReportForm kind={ride ? "ride" : "stay"} listingId={(ride ?? stay)!.id} citySlug={city.slug} />
        </div>
      )}
    </main>
  );
}
