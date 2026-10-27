import Link from "next/link";
import { ArrowRight, BusFront, Flag, TrainFront, Users } from "lucide-react";
import type { PublicRide, PublicStay } from "@/lib/data";
import { lp, tr, type Lang } from "@/i18n";
import { formatDateTime, isGroupTrip, nightLabel, stayKindLabels, vehicleLabels } from "@/lib/format";

function Initial({ name }: { name: string }) {
  return (
    <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent font-serif text-lg font-bold text-accent-foreground">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Link discreto para denunciar o anúncio. Sem pré-carregamento: são dezenas por página. */
function ReportLink({ href, lang }: { href: string; lang: Lang }) {
  return (
    <Link href={href} prefetch={false} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">
      <Flag className="size-3" aria-hidden /> {tr(lang)("Denunciar", "Report")}
    </Link>
  );
}

function WomenOnly({ lang }: { lang: Lang }) {
  return <span className="rounded border border-brand-text px-2 py-0.5 text-xs font-bold text-brand-text">{tr(lang)("Só para mulheres", "Women only")}</span>;
}

export function RideCard({ ride, citySlug, cityName, timezone, showAction = true, lang = "pt" }: { ride: PublicRide; citySlug: string; cityName: string; timezone: string; showAction?: boolean; lang?: Lang }) {
  const t = tr(lang);
  const full = ride.status === "full" || ride.seats_left <= 0;
  // Grupo de viagem em transporte público: mesmo cartão, com borda tracejada, ícone do meio de transporte e a regra da
  // passagem própria. Mesma paleta.
  const group = isGroupTrip(ride.vehicle);
  const Icon = ride.vehicle === "bus" ? BusFront : TrainFront;
  return (
    <article className={group ? "flex flex-col gap-3 rounded-2xl border-2 border-dashed border-foreground/35 bg-card p-5" : "flex flex-col gap-3 rounded-2xl border bg-card p-5"}>
      {group && (
        <p className="-mt-1 text-xs font-bold uppercase tracking-[0.1em] text-brand-text">
          {ride.vehicle === "bus" ? t("Grupo de ônibus", "Bus group") : t("Grupo de trem", "Train group")}
        </p>
      )}
      <div className="flex items-start gap-3">
        {group ? (
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-foreground/50 text-foreground"><Icon className="size-5" /></span>
        ) : (
          <Initial name={ride.first_name} />
        )}
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight">{ride.origin_city} → {cityName}</h3>
          <p className="text-sm text-muted-foreground">
            {group ? t(`organizado por ${ride.first_name}`, `organised by ${ride.first_name}`) : `${t("com", "with")} ${ride.first_name} · ${vehicleLabels(lang)[ride.vehicle]}`}
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">{t("Saída", "Leaves")}</dt>
        <dd className="font-semibold">{formatDateTime(ride.depart_at, timezone, lang)}</dd>
        {ride.return_at && (<><dt className="text-muted-foreground">{t("Volta", "Returns")}</dt><dd>{formatDateTime(ride.return_at, timezone, lang)}</dd></>)}
        {ride.meeting_hint && (<><dt className="text-muted-foreground">{t("Encontro", "Meeting point")}</dt><dd>{ride.meeting_hint}</dd></>)}
        <dt className="text-muted-foreground">{group ? t("No grupo", "In the group") : t("Vagas", "Seats")}</dt>
        <dd className="font-semibold">{full ? (group ? t("Grupo completo", "Group full") : t("Lotada", "Full")) : t(`${ride.seats_left} de ${ride.seats_total} livres`, `${ride.seats_left} of ${ride.seats_total} available`)}</dd>
      </dl>
      {group && <p className="text-sm font-semibold">{t("Cada pessoa compra a própria passagem.", "Everyone buys their own ticket.")}</p>}
      {ride.notes && <p className="text-sm text-muted-foreground">{ride.notes}</p>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          {ride.women_only && <WomenOnly lang={lang} />}
          {showAction && <ReportLink href={lp(lang, `/cidade/${citySlug}/denunciar/carona/${ride.id}`)} lang={lang} />}
        </div>
        {!showAction ? null : full ? (
          <span className="text-sm font-semibold text-muted-foreground">{group ? t("Sem lugar no grupo", "No room in the group") : t("Sem vagas", "No seats left")}</span>
        ) : (
          <Link href={lp(lang, `/cidade/${citySlug}/pedir/carona/${ride.id}`)} className="inline-flex h-10 items-center gap-1 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-brand-deep">
            {group ? t("Quero ir junto", "Join the group") : t("Quero essa vaga", "Request a seat")} <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </article>
  );
}

export function StayCard({ stay, citySlug, showAction = true, lang = "pt" }: { stay: PublicStay; citySlug: string; showAction?: boolean; lang?: Lang }) {
  const t = tr(lang);
  const full = stay.status === "full" || stay.nights.every((n) => n.remaining <= 0);
  return (
    <article className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
      <div className="flex items-start gap-3">
        <Initial name={stay.first_name} />
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight">{stayKindLabels(lang)[stay.kind]} {t("em", "in")} {stay.area_hint}</h3>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            {t("com", "with")} {stay.first_name} · <Users className="size-3.5" /> {t(`até ${stay.capacity} ${stay.capacity === 1 ? "pessoa" : "pessoas"}`, `up to ${stay.capacity} ${stay.capacity === 1 ? "person" : "people"}`)}
          </p>
        </div>
      </div>
      <ul className="space-y-1 text-sm">
        {stay.nights.map((n) => (
          <li key={n.night} className="flex justify-between gap-3">
            <span>{t("Noite de", "Night of")} {nightLabel(n.night, lang)}</span>
            <span className="font-semibold">{n.remaining > 0 ? t(`${n.remaining} ${n.remaining === 1 ? "lugar" : "lugares"}`, `${n.remaining} ${n.remaining === 1 ? "spot" : "spots"}`) : t("cheia", "full")}</span>
          </li>
        ))}
      </ul>
      {stay.rules && <p className="text-sm text-muted-foreground">{stay.rules}</p>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          {stay.women_only && <WomenOnly lang={lang} />}
          {showAction && <ReportLink href={lp(lang, `/cidade/${citySlug}/denunciar/hospedagem/${stay.id}`)} lang={lang} />}
        </div>
        {!showAction ? null : full ? (
          <span className="text-sm font-semibold text-muted-foreground">{t("Sem lugar", "No space left")}</span>
        ) : (
          <Link href={lp(lang, `/cidade/${citySlug}/pedir/hospedagem/${stay.id}`)} className="inline-flex h-10 items-center gap-1 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-brand-deep">
            {t("Quero ficar aqui", "Request to stay")} <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </article>
  );
}
