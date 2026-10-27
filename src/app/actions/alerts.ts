"use server";

import { z } from "zod";
import { asLang, lp, tr } from "@/i18n";
import { cityNameEnFromPt } from "@/i18n/data";
import { site } from "@/lib/config";
import { sendEmail } from "@/lib/email";
import { avisoConfirmar, avisoJaAtivo } from "@/lib/emails";
import { errorMessage } from "@/lib/errors";
import { ipHash } from "@/lib/request-meta";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstile } from "@/lib/turnstile";
import { geocodeOrigin } from "@/lib/geocode";
import { createPublicClient } from "@/lib/supabase/public";

async function locateAlertOrigin(email: string, citySlug: string, origin: string) {
  try {
    const { data: city } = await createPublicClient().from("voting_cities").select("id, lat, lon").eq("slug", citySlug).maybeSingle();
    if (!city || city.lat === null || city.lon === null) return;
    const place = await geocodeOrigin(origin, { lat: city.lat, lon: city.lon });
    if (!place) return;
    await createAdminClient().from("alerts").update({ origin_lat: place.lat, origin_lon: place.lon, origin_place: place.name })
      .eq("email", email.trim().toLowerCase()).eq("voting_city_id", city.id);
  } catch {
    // Sem localização, o aviso funciona igual; só não entra no mapa.
  }
}

export type AlertState = { status: "idle" } | { status: "error"; message: string } | { status: "ok"; email: string };

const schema = z.object({
  email: z.string().trim().email(),
  citySlug: z.string().min(1),
  kind: z.enum(["ride", "stay", "both"]),
  origin: z.string().trim().max(80).optional(),
  consent: z.literal(true),
});

export async function createAlertAction(_prev: AlertState, form: FormData): Promise<AlertState> {
  const lang = asLang(String(form.get("lang") ?? "pt"));
  const t = tr(lang);
  const parsed = schema.safeParse({
    email: form.get("email"),
    citySlug: form.get("citySlug"),
    kind: form.get("kind"),
    origin: (form.get("origin") as string) || undefined,
    consent: form.get("consent") === "on",
  });
  if (!parsed.success) {
    const consent = parsed.error.issues.some((i) => i.path[0] === "consent");
    return { status: "error", message: consent ? t("É preciso aceitar a política de privacidade.", "You need to accept the privacy policy.") : t("Confira o e-mail.", "Check the email address.") };
  }
  if (!(await verifyTurnstile(form.get("turnstileToken") as string))) {
    return { status: "error", message: t("Não conseguimos confirmar que você não é um robô. Tente de novo.", "We couldn't confirm you're not a robot. Please try again.") };
  }
  const d = parsed.data;
  const { data, error } = await createAdminClient().rpc("create_alert", {
    p_email: d.email, p_city_slug: d.citySlug, p_kind: d.kind, p_origin_hint: d.origin ?? "", p_ip_hash: await ipHash(),
  });
  if (error) return { status: "error", message: errorMessage(error, lang) };
  const r = data as { confirm_token?: string; city_name: string; city_slug: string; already_confirmed: boolean };
  // Cidade de partida localizada (nível cidade) para o mapa "Onde falta carona". Nunca bloqueia o aviso.
  if (!r.already_confirmed && d.origin && d.kind !== "stay") await locateAlertOrigin(d.email, r.city_slug, d.origin);
  // Aviso já confirmado: a dona do e-mail recebe só um lembrete, e a tela responde igual (não revela quem tem aviso).
  if (r.already_confirmed) await sendEmail(avisoJaAtivo({ to: d.email, cityName: r.city_name, cityUrl: `${site.url}${lp(lang, `/cidade/${r.city_slug}`)}` }));
  else await sendEmail(avisoConfirmar({ to: d.email, cityName: r.city_name, confirmUrl: `${site.url}${lp(lang, "/aviso/confirmar")}?t=${r.confirm_token}` }));
  return { status: "ok", email: d.email };
}

export type TokenState = { status: "idle" } | { status: "error"; message: string } | { status: "ok"; citySlug?: string; cityName?: string };

export async function confirmAlertAction(_prev: TokenState, form: FormData): Promise<TokenState> {
  const lang = asLang(String(form.get("lang") ?? "pt"));
  const { data, error } = await createAdminClient().rpc("confirm_alert", { p_token: String(form.get("token") ?? "") });
  if (error) return { status: "error", message: tr(lang)("Este link de confirmação não vale mais. Peça o aviso de novo na página da cidade.", "This confirmation link is no longer valid. Ask for the alert again on the city page.") };
  const r = data as { city_slug: string; city_name: string };
  return { status: "ok", citySlug: r.city_slug, cityName: lang === "en" ? cityNameEnFromPt(r.city_name) : r.city_name };
}

export async function unsubscribeAlertAction(_prev: TokenState, form: FormData): Promise<TokenState> {
  const lang = asLang(String(form.get("lang") ?? "pt"));
  const { error } = await createAdminClient().rpc("unsubscribe_alert", { p_token: String(form.get("token") ?? "") });
  if (error) return { status: "error", message: tr(lang)("Algo deu errado. Tente de novo.", "Something went wrong. Please try again.") };
  return { status: "ok" };
}
