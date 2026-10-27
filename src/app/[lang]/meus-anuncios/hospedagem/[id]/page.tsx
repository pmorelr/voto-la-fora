import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StayForm } from "@/components/forms/offer-forms";
import { asLang, lp, tr } from "@/i18n";
import { getFormCountries } from "@/lib/data";
import { getDashboard, getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: PageProps<"/[lang]/meus-anuncios/hospedagem/[id]">): Promise<Metadata> {
  return { title: tr(asLang((await params).lang))("Editar hospedagem", "Edit place to stay"), robots: { index: false, follow: false } };
}

export default async function EditarHospedagemPage({ params }: PageProps<"/[lang]/meus-anuncios/hospedagem/[id]">) {
  const { id, lang: raw } = await params;
  const lang = asLang(raw);
  const t = tr(lang);
  const session = await getSession();
  if (!session.authed || !session.hasProfile) redirect(lp(lang, "/meus-anuncios"));
  const [data, countries] = await Promise.all([getDashboard(), getFormCountries(lang)]);
  const stay = data.stays.find((s) => s.id === id);
  if (!stay || stay.status === "cancelled") notFound();
  const country = countries.find((c) => c.cities.some((x) => x.slug === stay.city.slug))?.code ?? "";
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 md:py-14">
      <Link href={lp(lang, "/meus-anuncios")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> {t("Meus anúncios", "My listings")}</Link>
      <h1 className="mt-4 text-4xl">{t("Editar hospedagem", "Edit place to stay")}</h1>
      <div className="mt-8">
        <StayForm
          countries={countries}
          session={session}
          editingId={stay.id}
          initial={{
            country, citySlug: stay.city.slug, areaHint: stay.area_hint, nights: stay.nights.map((n) => n.night),
            capacity: stay.capacity, kind: stay.kind, rules: stay.rules ?? "", womenOnly: stay.women_only,
          }}
        />
      </div>
    </main>
  );
}
