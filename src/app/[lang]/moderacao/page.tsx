import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewButtons } from "@/components/dashboard/moderation";
import { ReportReview } from "@/components/dashboard/report-review";
import { StoryReview } from "@/components/dashboard/story-review";
import { isGroupTrip, vehicleLabel } from "@/lib/format";
import { getDashboard, getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Moderação", robots: { index: false, follow: false } };

type QueueRide = { id: string; driver_id: string; city: string; first_name: string; email: string; origin_city: string; depart_at: string; seats_total: number; meeting_hint: string | null; notes: string | null; created_at: string };
type QueueStay = { id: string; host_id: string; city: string; first_name: string; email: string; area_hint: string; nights: string[]; capacity: number; rules: string | null; created_at: string };
type ReportedListing = {
  status: string; owner_id: string; first_name: string; email: string; city: string; city_slug: string; created_at: string; banned: boolean; women_only: boolean;
  origin_city?: string; depart_at?: string; return_at?: string | null; seats_total?: number; seats_taken?: number; vehicle?: keyof typeof vehicleLabel; meeting_hint?: string | null; notes?: string | null;
  area_hint?: string; nights?: string[]; capacity?: number; kind?: string; rules?: string | null;
};
type StoryRow = { id: string; body: string; first_name: string | null; city: string | null; status: "pending" | "approved" | "rejected"; created_at: string; updated_at: string };
type ReportGroup = { kind: "ride" | "stay"; id: string; reports: { id: string; reason: string; created_at: string }[]; listing: ReportedListing | null };
const quando = (d: string) => new Date(d).toLocaleString("pt-BR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const situacao: Record<string, string> = { open: "no ar", full: "lotado", paused: "pausado", cancelled: "cancelado por quem anunciou", removed: "removido" };

export default async function ModeracaoPage() {
  const session = await getSession();
  if (!session.authed || !session.hasProfile) notFound();
  const dash = await getDashboard();
  if (!dash.profile?.is_admin) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_queue");
  if (error) throw error;
  const q = data as { rides: QueueRide[]; stays: QueueStay[] };
  const { data: rep, error: repError } = await supabase.rpc("admin_reports");
  if (repError) throw repError;
  const reports = (rep ?? []) as unknown as ReportGroup[];
  const { data: st, error: stError } = await supabase.rpc("admin_stories");
  if (stError) throw stError;
  const stories = (st ?? []) as unknown as StoryRow[];
  const aRever = stories.filter((s) => s.status === "pending").length;
  const rotulo = { pending: "a revisar", approved: "no mural", rejected: "não publicado" } as const;

  return (
    <main className="mx-auto max-w-4xl space-y-10 px-4 py-10 md:py-14">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-4xl">Moderação</h1>
          <Link href="/moderacao/numeros" className="font-bold text-brand-text hover:underline">Ver os números →</Link>
        </div>
        <p className="mt-2 text-muted-foreground">Anúncios novos ficam no ar desde a publicação. Aqui eles são revistos. Removido some do site e quem pediu vaga é avisado.</p>
      </div>
      <section className="space-y-4">
        <h2 className="text-2xl">Relatos ({aRever} a revisar, {stories.length} no total)</h2>
        <p className="text-sm text-muted-foreground">Aprovados aparecem no mural da página inicial. Uma edição feita pela pessoa volta para a revisão. Nada partidário, nada de contato pessoal, nada de voto declarado.</p>
        {stories.length === 0 && <p className="text-muted-foreground">Nenhum relato ainda.</p>}
        {stories.map((s) => (
          <article key={s.id} className={`space-y-3 rounded-2xl border bg-card p-5 ${s.status === "pending" ? "border-2 border-foreground/20" : "opacity-80"}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span className="font-bold">{s.first_name || "Anônimo"}{s.city ? `, ${s.city}` : ""}</span>
              <span className="text-muted-foreground">{rotulo[s.status]} · {quando(s.updated_at)}</span>
            </div>
            <p className="whitespace-pre-line">{s.body}</p>
            <StoryReview id={s.id} status={s.status} />
          </article>
        ))}
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl">Denúncias abertas ({reports.length})</h2>
        {reports.length === 0 && <p className="text-muted-foreground">Nenhuma denúncia esperando decisão.</p>}
        {reports.map((g) => {
          const l = g.listing;
          const titulo = g.kind === "ride" ? (l?.vehicle && isGroupTrip(l.vehicle) ? "Grupo de viagem" : "Carona") : "Hospedagem";
          return (
            <article key={g.id} className="space-y-3 rounded-2xl border-2 border-foreground/20 bg-card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-xl">
                  {titulo}{l ? (g.kind === "ride" ? `: ${l.origin_city} → ${l.city}` : ` em ${l.area_hint}, ${l.city}`) : ""}
                </h3>
                <span className="text-sm text-muted-foreground">{g.id.slice(0, 8)} · {l ? situacao[l.status] ?? l.status : "não encontrado"}{l?.banned ? " · conta banida" : ""}</span>
              </div>
              <div className="rounded-xl bg-secondary p-3 text-sm">
                <p className="font-semibold">{g.reports.length === 1 ? "1 denúncia" : `${g.reports.length} denúncias`}</p>
                <ul className="mt-1 space-y-1">{g.reports.map((r) => <li key={r.id}><span className="text-muted-foreground">{quando(r.created_at)}:</span> {r.reason}</li>)}</ul>
              </div>
              {l && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">Quem anunciou</dt><dd>{l.first_name} ({l.email})</dd>
                  <dt className="text-muted-foreground">Publicado</dt><dd>{quando(l.created_at)}</dd>
                  {g.kind === "ride" ? (
                    <>
                      <dt className="text-muted-foreground">Como</dt><dd>{l.vehicle ? vehicleLabel[l.vehicle] : ""}{l.women_only ? " · só mulheres" : ""}</dd>
                      <dt className="text-muted-foreground">Saída</dt><dd>{l.depart_at ? quando(l.depart_at) : ""}{l.return_at ? ` · volta ${quando(l.return_at)}` : ""}</dd>
                      <dt className="text-muted-foreground">Vagas</dt><dd>{l.seats_taken} de {l.seats_total} ocupadas</dd>
                      <dt className="text-muted-foreground">Encontro</dt><dd>{l.meeting_hint || <span className="text-muted-foreground">sem texto</span>}</dd>
                      <dt className="text-muted-foreground">Observações</dt><dd className="whitespace-pre-line">{l.notes || <span className="text-muted-foreground">sem texto</span>}</dd>
                    </>
                  ) : (
                    <>
                      <dt className="text-muted-foreground">Lugar</dt><dd>{l.kind} · até {l.capacity}{l.women_only ? " · só mulheres" : ""}</dd>
                      <dt className="text-muted-foreground">Noites</dt><dd>{l.nights?.join(", ")}</dd>
                      <dt className="text-muted-foreground">Regras da casa</dt><dd className="whitespace-pre-line">{l.rules || <span className="text-muted-foreground">sem texto</span>}</dd>
                    </>
                  )}
                </dl>
              )}
              {l && <Link href={`/cidade/${l.city_slug}`} target="_blank" className="inline-block text-sm font-bold text-brand-text hover:underline">Ver a página de {l.city} ↗</Link>}
              <ReportReview kind={g.kind} id={g.id} hasText={Boolean(l && (l.notes || l.meeting_hint || l.rules))} />
            </article>
          );
        })}
      </section>
      <section className="space-y-3">
        <h2 className="text-2xl">Caronas a revisar ({q.rides.length})</h2>
        {q.rides.map((r) => (
          <div key={r.id} className="space-y-2 rounded-xl border bg-card p-4">
            <p className="font-semibold">{r.origin_city} → {r.city} · {r.seats_total} vagas · {new Date(r.depart_at).toLocaleString("pt-BR")}</p>
            <p className="text-sm text-muted-foreground">{r.first_name} ({r.email}){r.meeting_hint ? ` · ${r.meeting_hint}` : ""}</p>
            {r.notes && <p className="text-sm">{r.notes}</p>}
            <ReviewButtons kind="ride" id={r.id} ownerId={r.driver_id} cityName={r.city} />
          </div>
        ))}
      </section>
      <section className="space-y-3">
        <h2 className="text-2xl">Hospedagens a revisar ({q.stays.length})</h2>
        {q.stays.map((s) => (
          <div key={s.id} className="space-y-2 rounded-xl border bg-card p-4">
            <p className="font-semibold">{s.area_hint}, {s.city} · até {s.capacity} · noites {s.nights.join(", ")}</p>
            <p className="text-sm text-muted-foreground">{s.first_name} ({s.email})</p>
            {s.rules && <p className="text-sm">{s.rules}</p>}
            <ReviewButtons kind="stay" id={s.id} ownerId={s.host_id} cityName={s.city} />
          </div>
        ))}
      </section>
    </main>
  );
}
