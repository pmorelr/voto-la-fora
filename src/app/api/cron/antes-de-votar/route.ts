import { sendEmails } from "@/lib/email";
import { antesDeVotar, isFridayOnly, type TripTipsRecipient } from "@/lib/emails";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

const CAMPAIGN = "antes-de-votar-2026-10-24";

// Envio único do e-mail "antes de votar" (vercel.json, sábado 24/10/2026 às 14h de Paris). Quem já recebeu fica em
// private.campaign_sent: se a rotina rodar de novo, ninguém recebe duas vezes. `?previa=1` só conta, sem enviar.
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Não autorizado", { status: 401 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("trip_tips_recipients", { p_campaign: CAMPAIGN });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  // Um e-mail por endereço, mesmo para quem pediu e também oferece: o texto é o mesmo para os dois lados.
  const byEmail = new Map<string, { firstName: string; roles: Set<TripTipsRecipient["role"]>; friday: boolean }>();
  for (const r of (data ?? []) as TripTipsRecipient[]) {
    const cur = byEmail.get(r.email) ?? { firstName: r.first_name, roles: new Set(), friday: true };
    cur.roles.add(r.role);
    cur.friday &&= r.contacts.every(isFridayOnly);
    byEmail.set(r.email, cur);
  }
  const list = [...byEmail].map(([email, v]) => ({ email, ...v }));
  if (new URL(request.url).searchParams.get("previa") === "1") {
    return Response.json({ sexta: list.filter((r) => r.friday).length, fimDeSemana: list.filter((r) => !r.friday).length });
  }

  const ok = await sendEmails(list.map((r) => antesDeVotar({ to: r.email, firstName: r.firstName, friday: r.friday })));
  for (const role of ["requester", "offerer"] as const) {
    const sent = list.filter((r, i) => ok[i] && r.roles.has(role)).map((r) => r.email);
    if (sent.length) await admin.rpc("mark_campaign_sent", { p_campaign: CAMPAIGN, p_role: role, p_emails: sent });
  }
  return Response.json({ sent: ok.filter(Boolean).length, failed: ok.filter((x) => !x).length });
}
