"use server";

import { z } from "zod";
import { asLang, tr } from "@/i18n";
import { sendEmail } from "@/lib/email";
import { denunciaRecebida } from "@/lib/emails";
import { errorMessage } from "@/lib/errors";
import { listingCity } from "@/lib/notify";
import { ipHash } from "@/lib/request-meta";
import { createAdminClient } from "@/lib/supabase/admin";
import { reportReasons, type ReportReason } from "@/lib/report-reasons";
import { verifyTurnstile } from "@/lib/turnstile";

export type ReportState = { status: "idle" } | { status: "error"; message: string } | { status: "ok" };

const schema = z.object({
  kind: z.enum(["ride", "stay"]),
  listingId: z.string().uuid(),
  reason: z.enum(Object.keys(reportReasons) as [ReportReason, ...ReportReason[]]),
  details: z.string().trim().max(800),
});

export async function reportListingAction(_prev: ReportState, form: FormData): Promise<ReportState> {
  const lang = asLang(String(form.get("lang") ?? "pt"));
  const t = tr(lang);
  const parsed = schema.safeParse({
    kind: form.get("kind"),
    listingId: form.get("listingId"),
    reason: form.get("reason"),
    details: form.get("details") ?? "",
  });
  if (!parsed.success) return { status: "error", message: t("Escolha um motivo.", "Choose a reason.") };
  const d = parsed.data;
  if (d.reason === "outro" && d.details.length < 3) return { status: "error", message: t("Conte em poucas palavras o que há de errado.", "Tell us briefly what is wrong.") };
  if (!(await verifyTurnstile(form.get("turnstileToken") as string))) {
    return { status: "error", message: t("Não conseguimos confirmar que você não é um robô. Tente de novo.", "We couldn't confirm you're not a robot. Please try again.") };
  }
  const reason = `${reportReasons[d.reason][0]}${d.details ? `: ${d.details}` : ""}`;
  const { error } = await createAdminClient().rpc("report_listing", {
    p_kind: d.kind, p_id: d.listingId, p_reason: reason, p_reporter: null as unknown as string, p_ip_hash: await ipHash(),
  });
  if (error) return { status: "error", message: errorMessage(error, lang) };
  const city = await listingCity(d.kind, d.listingId);
  if (city) await sendEmail(denunciaRecebida({ kind: d.kind, listingId: d.listingId, cityName: city.name, citySlug: city.slug, reason }));
  return { status: "ok" };
}
