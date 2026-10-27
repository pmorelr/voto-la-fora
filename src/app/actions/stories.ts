"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { asLang, tr } from "@/i18n";
import { errorMessage } from "@/lib/errors";
import { revalidateBoth } from "@/lib/revalidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";

export type StoryState = { status: "idle" } | { status: "error"; message: string } | { status: "ok" };

const schema = z.object({
  token: z.string().min(10).max(200),
  body: z.string().trim().min(10).max(1500),
  firstName: z.string().trim().max(30),
  city: z.string().trim().max(60),
  consent: z.literal("on"),
});

/** Relato para o mural, pelo link pessoal do e-mail. O código é conferido no banco; nada é publicado sem moderação. */
export async function submitStoryAction(_prev: StoryState, form: FormData): Promise<StoryState> {
  const lang = asLang(String(form.get("lang") ?? "pt"));
  const t = tr(lang);
  const parsed = schema.safeParse({
    token: form.get("token"),
    body: form.get("body"),
    firstName: form.get("firstName") ?? "",
    city: form.get("city") ?? "",
    consent: form.get("consent"),
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "consent") return { status: "error", message: t("Marque a autorização para publicar o relato.", "Tick the box to allow us to publish your story.") };
    if (field === "body") return { status: "error", message: t("Escreva o relato com pelo menos 10 caracteres e no máximo 1.500.", "Write your story with at least 10 and at most 1,500 characters.") };
    return { status: "error", message: t("Confira os campos e tente de novo.", "Check the fields and try again.") };
  }
  if (!(await verifyTurnstile(form.get("turnstileToken") as string))) {
    return { status: "error", message: t("Não conseguimos confirmar que você não é um robô. Tente de novo.", "We couldn't confirm you're not a robot. Please try again.") };
  }
  const d = parsed.data;
  const { error } = await createAdminClient().rpc("story_submit", { p_token: d.token, p_body: d.body, p_first_name: d.firstName, p_city: d.city });
  if (error) {
    if (error.message.includes("invalid_token")) return { status: "error", message: t("Este link não é válido. Use o link do e-mail.", "This link is not valid. Please use the link from the email.") };
    return { status: "error", message: errorMessage(error, lang) };
  }
  revalidateBoth("/moderacao");
  return { status: "ok" };
}

/** Moderação de um relato. A função do banco confere que quem chama é admin. */
export async function reviewStoryAction(id: string, status: "approved" | "rejected" | "pending"): Promise<{ ok: boolean; message?: string }> {
  const { error } = await (await createClient()).rpc("admin_review_story", { p_id: id, p_status: status });
  if (error) return { ok: false, message: errorMessage(error) };
  revalidateBoth("/moderacao");
  revalidatePath("/[lang]", "page");
  return { ok: true };
}
