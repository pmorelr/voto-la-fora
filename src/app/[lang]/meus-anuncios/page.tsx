import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MessageCircle, Plus, Share2 } from "lucide-react";
import { AccountButtons, ListingButtons, LoginPanel, ProfilePanel, RequestButtons } from "@/components/dashboard/actions";
import { asLang, lp, tr, type Lang, type T } from "@/i18n";
import { cityName } from "@/i18n/data";
import { site, siteText } from "@/lib/config";
import { formatDateTime, nightLabel, stayKindLabels } from "@/lib/format";
import { getDashboard, getSession, type DashRequest } from "@/lib/session";
import { whatsappLink, whatsappShareLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/meus-anuncios">): Promise<Metadata> {
  return { title: tr(asLang((await params).lang))("Meus anúncios", "My listings"), robots: { index: false, follow: false } };
}

const statusLabels = (t: T): Record<string, string> => ({
  open: t("Aberto", "Open"),
  full: t("Lotado", "Full"),
  paused: t("Pausado", "Paused"),
  cancelled: t("Cancelado", "Cancelled"),
  removed: t("Removido pela moderação", "Removed by moderation"),
});
const requestLabels = (t: T): Record<DashRequest["status"], string> => ({
  pending: t("Esperando você", "Waiting for you"),
  confirmed: t("Confirmado", "Confirmed"),
  declined: t("Recusado", "Declined"),
  cancelled: t("Cancelado", "Cancelled"),
  expired: t("Venceu", "Expired"),
});

function hoursLeft(iso: string, t: T) {
  const h = Math.max(0, Math.round((Date.parse(iso) - Date.now()) / 3_600_000));
  return h <= 1 ? t("vence em menos de 1 hora", "expires in less than 1 hour") : t(`vence em ${h} horas`, `expires in ${h} hours`);
}

function Requests({ kind, requests, contactText, lang }: { kind: "ride" | "stay"; requests: DashRequest[]; contactText: (r: DashRequest) => string; lang: Lang }) {
  const t = tr(lang);
  const requestLabel = requestLabels(t);
  if (requests.length === 0) return <p className="text-sm text-muted-foreground">{t("Nenhum pedido ainda.", "No requests yet.")}</p>;
  const active = requests.filter((r) => r.status === "pending" || r.status === "confirmed");
  const closed = requests.filter((r) => r.status !== "pending" && r.status !== "confirmed");
  return (
    <div className="space-y-3">
      {active.map((r) => (
        <div key={r.id} className={`rounded-xl border p-4 ${r.status === "pending" ? "border-brand/50 bg-accent/40" : "bg-secondary"}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-bold">
              {r.first_name} · {r.people === 1 ? t("1 pessoa", "1 person") : t(`${r.people} pessoas`, `${r.people} people`)}
              {r.is_woman ? t(" · mulher", " · woman") : ""}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">{requestLabel[r.status]}{r.status === "pending" ? `, ${hoursLeft(r.expires_at, t)}` : ""}</p>
          </div>
          {r.nights && <p className="text-sm text-muted-foreground">{t("Noites", "Nights")}: {r.nights.map((n) => nightLabel(n, lang)).join("; ")}</p>}
          <p className="mt-2">“{r.message}”</p>
          <div className="mt-3">
            {r.status === "pending" ? (
              <RequestButtons kind={kind} id={r.id} />
            ) : (
              r.whatsapp && <div className="flex flex-wrap items-center gap-3">
                <a href={whatsappLink(r.whatsapp, contactText(r))} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground">
                  <MessageCircle className="size-4" /> {t(`Chamar ${r.first_name} no WhatsApp`, `Message ${r.first_name} on WhatsApp`)}
                </a>
                <span className="text-sm text-muted-foreground">{r.whatsapp}</span>
                <p className="w-full text-xs text-muted-foreground">{siteText(lang).liability}</p>
              </div>
            )}
          </div>
        </div>
      ))}
      {closed.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">{t("Encerrados", "Closed")} ({closed.length})</summary>
          <ul className="mt-2 space-y-1">
            {closed.map((r) => <li key={r.id}>{r.first_name}: {requestLabel[r.status]}{r.flagged ? t(", marcado como número que não confere", ", flagged as a wrong number") : ""}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}

export default async function MeusAnunciosPage({ params, searchParams }: PageProps<"/[lang]/meus-anuncios">) {
  const lang = asLang((await params).lang);
  const t = tr(lang);
  const statusLabel = statusLabels(t);
  const session = await getSession();
  if (!session.authed || !session.hasProfile) {
    return (
      <main className="mx-auto max-w-md px-4 py-14">
        <h1 className="text-4xl">{t("Meus anúncios", "My listings")}</h1>
        <p className="mt-2 text-muted-foreground">
          {session.authed ? t("Falta só o seu primeiro nome.", "We just need your first name.") : t("Entre com o e-mail que você usou para anunciar.", "Sign in with the email you used to post.")}
        </p>
        <div className="mt-6 rounded-2xl border bg-card p-5">{session.authed ? <ProfilePanel /> : <LoginPanel />}</div>
      </main>
    );
  }

  const { novo } = await searchParams;
  const data = await getDashboard();
  const me = data.profile!;
  const city = (c: { slug: string; name: string }) => cityName(lang, c.slug, c.name);
  const all = [...data.rides.map((r) => ({ kind: "ride" as const, item: r })), ...data.stays.map((s) => ({ kind: "stay" as const, item: s }))];
  const created = typeof novo === "string" ? all.find((x) => x.item.id === novo) : undefined;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">{t(`Olá, ${me.first_name}`, `Hi, ${me.first_name}`)}</h1>
          <p className="mt-1 text-muted-foreground">{me.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={lp(lang, "/ajudar/carona")} className="inline-flex h-10 items-center gap-1 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground"><Plus className="size-4" /> {t("Carona", "Ride")}</Link>
          <Link href={lp(lang, "/ajudar/hospedagem")} className="inline-flex h-10 items-center gap-1 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground"><Plus className="size-4" /> {t("Hospedagem", "Place to stay")}</Link>
          {me.is_admin && <Link href="/moderacao" className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-bold">{t("Moderação", "Moderation")}</Link>}
        </div>
      </div>

      {created && (
        <div className="mt-6 rounded-2xl border border-brand/40 bg-accent p-5">
          <p className="flex items-center gap-2 text-lg font-bold"><CheckCircle2 className="size-5" /> {t("Anúncio publicado", "Listing published")}</p>
          <p className="mt-1">{t(`Ele já aparece na página de ${city(created.item.city)}. Os pedidos chegam no seu e-mail e aqui.`, `It now appears on the ${city(created.item.city)} page. Requests arrive by email and here.`)}</p>
          <a
            href={whatsappShareLink(
              t(
                `Tem ${created.kind === "ride" ? "carona" : "lugar para dormir"} para votar em ${created.item.city.name} no dia 25/10: ${site.url}/cidade/${created.item.city.slug}`,
                `There's a ${created.kind === "ride" ? "ride" : "place to stay"} for voting in ${city(created.item.city)} on 25 October: ${site.url}${lp("en", `/cidade/${created.item.city.slug}`)}`,
              ),
            )}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            <Share2 className="size-4" /> {t("Divulgar nos grupos de WhatsApp", "Share in WhatsApp groups")}
          </a>
        </div>
      )}

      {all.length === 0 && <p className="mt-8 rounded-2xl border border-dashed p-6 text-muted-foreground">{t("Você ainda não tem anúncios. Ofereça uma carona ou um lugar para dormir.", "You don’t have any listings yet. Offer a ride or a place to sleep.")}</p>}

      <div className="mt-8 space-y-6">
        {data.rides.map((r) => (
          <section key={r.id} className="space-y-4 rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl">{t("Carona", "Ride")} {r.origin_city} → {city(r.city)}</h2>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(r.depart_at, r.city.timezone, lang)} · {t(`${r.seats_taken} de ${r.seats_total} vagas confirmadas`, `${r.seats_taken} of ${r.seats_total} seats confirmed`)}
                  {r.women_only ? t(" · só mulheres", " · women only") : ""}
                </p>
              </div>
              <span className="rounded bg-secondary px-2.5 py-1 text-xs font-bold">{statusLabel[r.status]}</span>
            </div>
            <ListingButtons kind="ride" id={r.id} status={r.status} editHref={`/meus-anuncios/carona/${r.id}`} />
            <Requests
              kind="ride"
              lang={lang}
              requests={r.requests}
              contactText={(q) =>
                t(
                  `Oi, ${q.first_name}! Aqui é ${me.first_name}, da carona de ${r.origin_city} para ${r.city.name} (${formatDateTime(r.depart_at, r.city.timezone)}). Sua vaga está confirmada. Vamos combinar os detalhes?`,
                  `Hi ${q.first_name}! This is ${me.first_name}, from the ride from ${r.origin_city} to ${city(r.city)} (${formatDateTime(r.depart_at, r.city.timezone, "en")}). Your seat is confirmed. Shall we arrange the details?`,
                )
              }
            />
          </section>
        ))}
        {data.stays.map((s) => (
          <section key={s.id} className="space-y-4 rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl">{stayKindLabels(lang)[s.kind]} {t("em", "in")} {s.area_hint}, {city(s.city)}</h2>
                <p className="text-sm text-muted-foreground">{s.nights.map((n) => `${nightLabel(n.night, lang)}: ${t(`${n.remaining} de ${s.capacity} livres`, `${n.remaining} of ${s.capacity} free`)}`).join(" · ")}</p>
              </div>
              <span className="rounded bg-secondary px-2.5 py-1 text-xs font-bold">{statusLabel[s.status]}</span>
            </div>
            <ListingButtons kind="stay" id={s.id} status={s.status} editHref={`/meus-anuncios/hospedagem/${s.id}`} />
            <Requests
              kind="stay"
              lang={lang}
              requests={s.requests}
              contactText={(q) =>
                t(
                  `Oi, ${q.first_name}! Aqui é ${me.first_name}, da hospedagem em ${s.area_hint}, ${s.city.name}. Seu lugar está confirmado. Vamos combinar a chegada?`,
                  `Hi ${q.first_name}! This is ${me.first_name}, from the place to stay in ${s.area_hint}, ${city(s.city)}. Your spot is confirmed. Shall we arrange your arrival?`,
                )
              }
            />
          </section>
        ))}
      </div>

      <section className="mt-12 space-y-3 border-t pt-6">
        <h2 className="text-lg">{t("Sua conta", "Your account")}</h2>
        <p className="text-sm text-muted-foreground">{t(`Seus dados são apagados até ${site.retentionDate}. Você pode apagar antes.`, `Your data is deleted by ${siteText("en").retentionDate}. You can delete it sooner.`)}</p>
        <AccountButtons />
      </section>
    </main>
  );
}
