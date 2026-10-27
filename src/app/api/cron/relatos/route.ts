import { exterior, site as numeros } from "@/content/resultado";
import { sendEmails } from "@/lib/email";
import { votouSeAquiFora } from "@/lib/emails";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

const CAMPAIGN = "relatos-2026-10";
const PRAZO = { pt: "12 de novembro", en: "12 November" };

// Envio único do e-mail "Votou-se aqui fora", com o convite para o mural (vercel.json, 26/10/2026 às 15h de Paris). Quem já recebeu fica em private.campaign_sent. `?previa=1` só conta.
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Não autorizado", { status: 401 });
  }
  const admin = createAdminClient();
  if (new URL(request.url).searchParams.get("previa") === "1") {
    const { data, error } = await admin.rpc("story_audience_count", { p_campaign: CAMPAIGN });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ pessoas: data });
  }

  const { data, error } = await admin.rpc("story_invites_create", { p_campaign: CAMPAIGN });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const invites = (data ?? []) as { email: string; first_name: string | null; token: string }[];
  const n = {
    ofertantes: numeros.ofertantes, paises: numeros.paises, lugares: numeros.lugares,
    abstencao1: exterior.turno1.abstencao, abstencao2: exterior.turno2.abstencao,
    maisVotantes: exterior.turno2.compareceram - exterior.turno1.compareceram,
  };
  const ok = await sendEmails(invites.map((i) => votouSeAquiFora({ to: i.email, firstName: i.first_name, token: i.token, numeros: n, prazo: PRAZO })));
  const sent = invites.filter((_, i) => ok[i]).map((i) => i.email);
  if (sent.length) await admin.rpc("mark_campaign_sent", { p_campaign: CAMPAIGN, p_role: "all", p_emails: sent });
  return Response.json({ sent: sent.length, failed: ok.filter((x) => !x).length });
}
