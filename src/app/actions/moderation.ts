"use server";

import { sendEmail } from "@/lib/email";
import { decisaoModeracao } from "@/lib/emails";
import { errorMessage } from "@/lib/errors";
import { listingCity, notifyListingCancelled } from "@/lib/notify";
import { revalidateBoth, revalidateCity, revalidatePublicPages } from "@/lib/revalidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Kind = "ride" | "stay";
type Result = { ok: true; notified: boolean } | { ok: false; message: string };
export type Decision = "keep" | "clear" | "remove" | "ban";

/**
 * Decisão sobre um anúncio denunciado. As funções do banco conferem que quem chama é admin; dono, e-mail e cidade
 * vêm do banco, nunca do navegador. Toda decisão fecha as denúncias abertas do anúncio.
 */
export async function moderateReportAction(kind: Kind, id: string, decision: Decision, notifyOwner: boolean, message: string): Promise<Result> {
  const supabase = await createClient();
  const admin = createAdminClient();
  const table = kind === "ride" ? "rides" : "stays";
  const { data: listing } = kind === "ride"
    ? await admin.from("rides").select("owner:driver_id, profiles!rides_driver_id_fkey(first_name)").eq("id", id).maybeSingle()
    : await admin.from("stays").select("owner:host_id, profiles!stays_host_id_fkey(first_name)").eq("id", id).maybeSingle();
  if (!listing) return { ok: false, message: `Anúncio não encontrado em ${table}.` };
  const ownerId = listing.owner as string;
  const firstName = (listing.profiles as { first_name: string } | null)?.first_name ?? "";
  const city = await listingCity(kind, id);

  if (decision === "clear") {
    const { error } = await supabase.rpc("admin_clear_text", { p_kind: kind, p_id: id });
    if (error) return { ok: false, message: errorMessage(error) };
  } else if (decision === "remove") {
    const { data, error } = await supabase.rpc("admin_review", { p_kind: kind, p_id: id, p_approve: false });
    if (error) return { ok: false, message: errorMessage(error) };
    await notifyListingCancelled((data as { affected: { first_name: string; email: string | null }[] }).affected ?? [], kind, city?.name ?? "");
  } else if (decision === "ban") {
    const { error } = await supabase.rpc("admin_ban", { p_user_id: ownerId });
    if (error) return { ok: false, message: errorMessage(error) };
  }
  const { error: closeError } = await supabase.rpc("admin_close_reports", { p_kind: kind, p_id: id });
  if (closeError) return { ok: false, message: errorMessage(closeError) };

  let notified = false;
  if (notifyOwner && decision !== "keep") {
    const { data: owner } = await admin.auth.admin.getUserById(ownerId);
    if (owner.user?.email) {
      notified = await sendEmail(decisaoModeracao({ to: owner.user.email, firstName, kind, cityName: city?.name ?? "", decision, message }));
    }
  }
  revalidateBoth("/moderacao");
  if (decision === "ban") revalidatePublicPages();
  else if (city) revalidateCity(city.slug);
  return { ok: true, notified };
}
