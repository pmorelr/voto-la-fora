"use server";

import { z } from "zod";
import { tr, type Lang } from "@/i18n";
import { errorMessage } from "@/lib/errors";
import { revalidateBoth } from "@/lib/revalidate";
import { clientIp } from "@/lib/request-meta";
import { createAuthClientFor } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Result<T = object> = ({ ok: true } & T) | { ok: false; message: string };

const email = z.string().trim().toLowerCase().email();

export async function sendCodeAction(rawEmail: string, captchaToken: string, lang: Lang = "pt"): Promise<Result> {
  const t = tr(lang);
  const parsed = email.safeParse(rawEmail);
  if (!parsed.success) return { ok: false, message: t("Confira o e-mail.", "Check the email address.") };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email: parsed.data, options: { shouldCreateUser: true, captchaToken } });
  if (error) {
    if (error.status === 429) return { ok: false, message: t("Muitos códigos pedidos. Espere um minuto e tente de novo.", "Too many codes requested. Wait a minute and try again.") };
    return { ok: false, message: t("Não conseguimos enviar o código. Confira o e-mail e tente de novo.", "We couldn't send the code. Check the email address and try again.") };
  }
  return { ok: true };
}

export async function verifyCodeAction(rawEmail: string, code: string, lang: Lang = "pt"): Promise<Result<{ firstName: string | null }>> {
  const t = tr(lang);
  const parsed = email.safeParse(rawEmail);
  if (!parsed.success || !/^\d{6}$/.test(code.trim())) return { ok: false, message: t("O código tem 6 números.", "The code has 6 digits.") };
  // O código é conferido com o IP de quem digitou: o limite de tentativas do Supabase vale por pessoa, não para o
  // site todo. A sessão vai depois para os cookies pelo cliente normal.
  const { data: auth, error } = await createAuthClientFor(await clientIp()).auth.verifyOtp({ email: parsed.data, token: code.trim(), type: "email" });
  if (error?.status === 429) return { ok: false, message: t("Muitas tentativas. Espere alguns minutos e peça outro código.", "Too many attempts. Wait a few minutes and request a new code.") };
  if (error || !auth.user || !auth.session) return { ok: false, message: t("Código errado ou vencido. Peça outro.", "Wrong or expired code. Request a new one.") };
  const supabase = await createClient();
  const set = await supabase.auth.setSession({ access_token: auth.session.access_token, refresh_token: auth.session.refresh_token });
  if (set.error) return { ok: false, message: t("Não conseguimos abrir sua sessão. Tente de novo.", "We couldn't sign you in. Please try again.") };
  const { data } = await supabase.from("profiles").select("first_name").eq("id", auth.user.id).maybeSingle();
  return { ok: true, firstName: data?.first_name ?? null };
}

export async function saveProfileAction(firstName: string, consent: boolean, lang: Lang = "pt"): Promise<Result> {
  const name = firstName.trim();
  if (name.length < 2 || name.length > 30) return { ok: false, message: tr(lang)("Seu primeiro nome, entre 2 e 30 letras.", "Your first name, between 2 and 30 letters.") };
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_profile", { p_first_name: name, p_consent: consent });
  if (error) return { ok: false, message: errorMessage(error, lang) };
  return { ok: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidateBoth("/meus-anuncios");
}

export async function deleteAccountAction(lang: Lang = "pt"): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { ok: false, message: errorMessage(error, lang) };
  await supabase.auth.signOut();
  revalidateBoth("/meus-anuncios");
  return { ok: true };
}
