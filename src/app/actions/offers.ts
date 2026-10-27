"use server";

import { z } from "zod";
import { tr, type Lang } from "@/i18n";
import { errorMessage } from "@/lib/errors";
import { revalidateCity } from "@/lib/revalidate";
import { zonedToUtc } from "@/lib/format";
import { geocodeOrigin } from "@/lib/geocode";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true; id: string; citySlug: string } | { ok: false; message: string };

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const time = z.string().regex(/^\d{2}:\d{2}$/);

const rideSchema = z.object({
  citySlug: z.string().min(1),
  originCity: z.string().trim().min(2).max(80),
  departDate: date,
  departTime: time,
  returnDate: date.or(z.literal("")),
  returnTime: time.or(z.literal("")),
  seats: z.coerce.number().int().min(1).max(8),
  vehicle: z.enum(["car", "van", "train", "bus"]),
  meetingHint: z.string().trim().max(140),
  notes: z.string().trim().max(500),
  womenOnly: z.boolean(),
});
export type RideInput = z.input<typeof rideSchema>;

const staySchema = z.object({
  citySlug: z.string().min(1),
  areaHint: z.string().trim().min(2).max(80),
  nights: z.array(date).min(1),
  capacity: z.coerce.number().int().min(1).max(6),
  kind: z.enum(["room", "couch", "mattress"]),
  rules: z.string().trim().max(500),
  womenOnly: z.boolean(),
});
export type StayInput = z.input<typeof staySchema>;

async function cityInfo(slug: string) {
  const { data } = await createPublicClient().from("voting_cities").select("timezone, country_code, lat, lon").eq("slug", slug).eq("has_section", true).maybeSingle();
  return data;
}

export async function saveRideAction(input: RideInput & { ack?: boolean }, id?: string, lang: Lang = "pt"): Promise<Result> {
  const t = tr(lang);
  if (input.ack !== true) return { ok: false, message: t("Confirme o aviso antes de publicar.", "Please confirm the notice before publishing.") };
  const parsed = rideSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: t("Confira os campos: cidade de partida, dia e hora da saída e vagas.", "Check the fields: departure city, departure date and time, and seats.") };
  const d = parsed.data;
  const city = await cityInfo(d.citySlug);
  if (!city) return { ok: false, message: t("Escolha a cidade de votação.", "Choose the voting city.") };
  const depart = zonedToUtc(d.departDate, d.departTime, city.timezone);
  const back = d.returnDate && d.returnTime ? zonedToUtc(d.returnDate, d.returnTime, city.timezone) : null;
  if (back && back <= depart) return { ok: false, message: t("A volta precisa ser depois da saída.", "The return must be after the departure.") };
  const coords = city.lat !== null && city.lon !== null ? await geocodeOrigin(d.originCity, { lat: city.lat, lon: city.lon }) : null;
  const args = {
    p_origin_city: d.originCity,
    p_origin_lat: (coords?.lat ?? null) as number,
    p_origin_lon: (coords?.lon ?? null) as number,
    p_depart_at: depart.toISOString(),
    p_return_at: (back?.toISOString() ?? null) as string,
    p_seats_total: d.seats,
    p_vehicle: d.vehicle,
    p_meeting_hint: d.meetingHint,
    p_notes: d.notes,
    p_women_only: d.womenOnly,
  };
  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.rpc("update_ride", { p_id: id, ...args });
    if (error) return { ok: false, message: errorMessage(error, lang) };
    revalidateCity(d.citySlug);
    return { ok: true, id, citySlug: d.citySlug };
  }
  const { data, error } = await supabase.rpc("create_ride", { p_city_slug: d.citySlug, ...args });
  if (error) return { ok: false, message: errorMessage(error, lang) };
  revalidateCity(d.citySlug);
  return { ok: true, id: data, citySlug: d.citySlug };
}

export async function saveStayAction(input: StayInput & { ack?: boolean }, id?: string, lang: Lang = "pt"): Promise<Result> {
  const t = tr(lang);
  if (input.ack !== true) return { ok: false, message: t("Confirme o aviso antes de publicar.", "Please confirm the notice before publishing.") };
  const parsed = staySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: t("Confira os campos: bairro, pelo menos uma noite e quantas pessoas.", "Check the fields: neighbourhood, at least one night and how many people.") };
  const d = parsed.data;
  const args = {
    p_area_hint: d.areaHint,
    p_nights: d.nights,
    p_capacity: d.capacity,
    p_kind: d.kind,
    p_rules: d.rules,
    p_women_only: d.womenOnly,
  };
  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.rpc("update_stay", { p_id: id, ...args });
    if (error) return { ok: false, message: errorMessage(error, lang) };
    revalidateCity(d.citySlug);
    return { ok: true, id, citySlug: d.citySlug };
  }
  const { data, error } = await supabase.rpc("create_stay", { p_city_slug: d.citySlug, ...args });
  if (error) return { ok: false, message: errorMessage(error, lang) };
  revalidateCity(d.citySlug);
  return { ok: true, id: data, citySlug: d.citySlug };
}
