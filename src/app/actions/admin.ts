"use server";

import { errorMessage } from "@/lib/errors";
import { notifyListingCancelled } from "@/lib/notify";
import { revalidateBoth, revalidatePublicPages } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";

type Kind = "ride" | "stay";
type Result = { ok: true } | { ok: false; message: string };

export async function reviewAction(kind: Kind, id: string, approve: boolean, cityName: string): Promise<Result> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_review", { p_kind: kind, p_id: id, p_approve: approve });
  if (error) return { ok: false, message: errorMessage(error) };
  if (!approve) await notifyListingCancelled((data as { affected: { first_name: string; email: string | null }[] }).affected ?? [], kind, cityName);
  revalidateBoth("/moderacao");
  revalidatePublicPages();
  return { ok: true };
}

export async function banAction(userId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_ban", { p_user_id: userId });
  if (error) return { ok: false, message: errorMessage(error) };
  revalidateBoth("/moderacao");
  revalidatePublicPages();
  return { ok: true };
}

export async function resolveReportAction(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_resolve_report", { p_id: id });
  if (error) return { ok: false, message: errorMessage(error) };
  revalidateBoth("/moderacao");
  return { ok: true };
}
