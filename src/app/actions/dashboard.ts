"use server";

import type { Lang } from "@/i18n";
import { errorMessage } from "@/lib/errors";
import { listingCity, notifyListingCancelledByIds, notifyRequestDecided } from "@/lib/notify";
import { revalidateBoth, revalidateCity, revalidatePublicPages } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";

type Kind = "ride" | "stay";
type Result = { ok: true } | { ok: false; message: string };

export async function decideRequestAction(kind: Kind, requestId: string, accept: boolean, lang: Lang = "pt"): Promise<Result> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("decide_request", { p_kind: kind, p_request_id: requestId, p_accept: accept });
  if (error) return { ok: false, message: errorMessage(error, lang) };
  const r = data as { status: string };
  const { data: claims } = await supabase.auth.getClaims();
  const { data: me } = await supabase.from("profiles").select("first_name").eq("id", claims?.claims?.sub ?? "").maybeSingle();
  await notifyRequestDecided(kind, requestId, me?.first_name ?? "", r.status === "confirmed");
  revalidateBoth("/meus-anuncios");
  revalidatePublicPages();
  return { ok: true };
}

export async function flagRequestAction(kind: Kind, requestId: string, lang: Lang = "pt"): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("flag_request", { p_kind: kind, p_request_id: requestId });
  if (error) return { ok: false, message: errorMessage(error, lang) };
  revalidateBoth("/meus-anuncios");
  return { ok: true };
}

export async function setListingStatusAction(kind: Kind, id: string, status: "open" | "paused" | "cancelled", lang: Lang = "pt"): Promise<Result> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_listing_status", { p_kind: kind, p_id: id, p_status: status });
  if (error) return { ok: false, message: errorMessage(error, lang) };
  // A função já conferiu que o anúncio é de quem pediu; a cidade vem do banco, nunca do navegador.
  const city = await listingCity(kind, id);
  if (status === "cancelled" && city) await notifyListingCancelledByIds((data as { affected: string[] }).affected ?? [], kind, city.name);
  revalidateBoth("/meus-anuncios");
  if (city) revalidateCity(city.slug);
  return { ok: true };
}
