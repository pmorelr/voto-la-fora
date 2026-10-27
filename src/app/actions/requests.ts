"use server";

import { z } from "zod";
import { asLang, lp, tr } from "@/i18n";
import { site } from "@/lib/config";
import { listingCity } from "@/lib/notify";
import { revalidateCity } from "@/lib/revalidate";
import { sendEmail } from "@/lib/email";
import { novoPedido, pedidoCancelado, pedidoRecebido } from "@/lib/emails";
import { errorMessage } from "@/lib/errors";
import { ipHash } from "@/lib/request-meta";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstile } from "@/lib/turnstile";
import { normalizeWhatsapp } from "@/lib/whatsapp";

export type RequestState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "ok"; cancelUrl: string; offererFirstName: string; emailSent: boolean };

const schema = z.object({
  kind: z.enum(["ride", "stay"]),
  listingId: z.string().uuid(),
  firstName: z.string().trim().min(2, "Seu primeiro nome").max(30),
  whatsapp: z.string().trim().min(6),
  email: z.string().trim().email().or(z.literal("")).optional(),
  isWoman: z.boolean(),
  people: z.coerce.number().int().min(1).max(4),
  nights: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  message: z.string().trim().min(5, "Escreva uma mensagem curta").max(400),
  consent: z.literal(true),
  ack: z.literal(true),
});

export async function createRequestAction(_prev: RequestState, form: FormData): Promise<RequestState> {
  const lang = asLang(String(form.get("lang") ?? "pt"));
  const t = tr(lang);
  const parsed = schema.safeParse({
    kind: form.get("kind"),
    listingId: form.get("listingId"),
    firstName: form.get("firstName"),
    whatsapp: form.get("whatsapp"),
    email: form.get("email") ?? "",
    isWoman: form.get("isWoman") === "on",
    people: form.get("people"),
    nights: form.getAll("nights"),
    message: form.get("message"),
    consent: form.get("consent") === "on",
    ack: form.get("ack") === "on",
  });
  if (!parsed.success) {
    const consent = parsed.error.issues.some((i) => i.path[0] === "consent");
    const ack = parsed.error.issues.some((i) => i.path[0] === "ack");
    return {
      status: "error",
      message: consent ? t("É preciso aceitar a política de privacidade para enviar o pedido.", "You need to accept the privacy policy to send the request.")
        : ack ? t("Confirme o aviso antes de enviar o pedido.", "Please confirm the notice before sending the request.")
        : t("Confira os campos: nome, WhatsApp e uma mensagem curta são obrigatórios.", "Check the fields: name, WhatsApp number and a short message are required."),
    };
  }
  const d = parsed.data;
  const whatsapp = normalizeWhatsapp(d.whatsapp);
  if (!whatsapp) return { status: "error", message: t("WhatsApp inválido. Use o formato internacional, com + e o código do país, por exemplo +33 6 12 34 56 78.", "Invalid WhatsApp number. Use the international format, with + and the country code, for example +33 6 12 34 56 78.") };
  if (d.kind === "stay" && d.nights.length === 0) return { status: "error", message: t("Escolha pelo menos uma noite.", "Choose at least one night.") };
  if (!(await verifyTurnstile(form.get("turnstileToken") as string))) {
    return { status: "error", message: t("Não conseguimos confirmar que você não é um robô. Tente de novo.", "We couldn't confirm you're not a robot. Please try again.") };
  }

  const { data, error } = await createAdminClient().rpc("create_request", {
    p_kind: d.kind,
    p_listing_id: d.listingId,
    p_first_name: d.firstName,
    p_whatsapp: whatsapp,
    p_email: d.email || "",
    p_is_woman: d.isWoman,
    p_people: d.people,
    p_nights: d.kind === "stay" ? d.nights : [],
    p_message: d.message,
    p_ip_hash: await ipHash(),
  });
  if (error) return { status: "error", message: errorMessage(error, lang) };

  const r = data as { cancel_token: string; city_name: string; offerer_first_name: string; offerer_email: string };
  const cancelUrl = `${site.url}${lp(lang, "/pedido/cancelar")}?t=${r.cancel_token}`;
  const mails = [
    sendEmail(novoPedido({ to: r.offerer_email, offererFirstName: r.offerer_first_name, requesterFirstName: d.firstName, kind: d.kind, cityName: r.city_name, people: d.people, message: d.message })),
  ];
  if (d.email) mails.push(sendEmail(pedidoRecebido({ to: d.email, firstName: d.firstName, offererFirstName: r.offerer_first_name, kind: d.kind, cityName: r.city_name, cancelUrl })));
  const sent = await Promise.all(mails);
  const city = await listingCity(d.kind, d.listingId);
  if (city) revalidateCity(city.slug);
  return { status: "ok", cancelUrl, offererFirstName: r.offerer_first_name, emailSent: Boolean(d.email) && Boolean(sent[1]) };
}

export type CancelState = { status: "idle" } | { status: "error"; message: string } | { status: "ok" };

export async function cancelRequestAction(_prev: CancelState, form: FormData): Promise<CancelState> {
  const lang = asLang(String(form.get("lang") ?? "pt"));
  const token = String(form.get("token") ?? "");
  if (!token) return { status: "error", message: tr(lang)("Link de cancelamento inválido.", "Invalid cancellation link.") };
  const { data, error } = await createAdminClient().rpc("cancel_request_by_token", { p_token: token });
  if (error) return { status: "error", message: errorMessage(error, lang) };
  const r = data as { kind: "ride" | "stay"; was_confirmed: boolean; requester_first_name: string; offerer_first_name: string; offerer_email: string };
  await sendEmail(pedidoCancelado({ to: r.offerer_email, offererFirstName: r.offerer_first_name, requesterFirstName: r.requester_first_name, kind: r.kind, wasConfirmed: r.was_confirmed }));
  return { status: "ok" };
}
