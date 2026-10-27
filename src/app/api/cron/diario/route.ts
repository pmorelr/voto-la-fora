import { site } from "@/lib/config";
import type { PublicRide, PublicStay } from "@/lib/data";
import { sendEmails } from "@/lib/email";
import { avisoNovidades, lembrete } from "@/lib/emails";
import { revalidatePublicPages } from "@/lib/revalidate";
import { createAdminClient } from "@/lib/supabase/admin";

// Envio em lotes de 100: dá para milhares de e-mails dentro do limite de 5 minutos.
export const maxDuration = 300;

// Rotina diária (vercel.json): vence pedidos parados, lembra quem oferece, manda os avisos e apaga o que a
// política de privacidade manda apagar.
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Não autorizado", { status: 401 });
  }
  const admin = createAdminClient();

  const expired = await admin.rpc("expire_stale_requests");

  const reminders = await admin.rpc("pending_reminders");
  const due = (reminders.data ?? []) as { email: string; first_name: string; pending: number }[];
  await sendEmails(due.map((r) => lembrete({ to: r.email, firstName: r.first_name, pending: r.pending })));

  const digest = await admin.rpc("alerts_digest");
  type Alert = { alert_id: string; email: string; unsubscribe_token: string; city: { slug: string; name: string; timezone: string }; rides: PublicRide[]; stays: PublicStay[] };
  const alerts = (digest.data ?? []) as Alert[];
  const ok = await sendEmails(alerts.map((a) => avisoNovidades({
    to: a.email, cityName: a.city.name, citySlug: a.city.slug, timezone: a.city.timezone,
    unsubscribeUrl: `${site.url}/aviso/sair?t=${a.unsubscribe_token}`, rides: a.rides, stays: a.stays,
  })));
  const sent = alerts.filter((_, i) => ok[i]).map((a) => a.alert_id);
  if (sent.length) await admin.rpc("mark_alerts_sent", { p_ids: sent });

  // Pedidos vencidos devolvem vagas: as páginas públicas mostram isso já, sem esperar o cache.
  if (expired.data) revalidatePublicPages();

  // Por último, para não apagar avisos antes do envio do dia.
  const purged = await admin.rpc("purge_stale_data", {});

  return Response.json({ expired: expired.data ?? 0, reminders: due.length, alerts: sent.length, purged: purged.data ?? null });
}
