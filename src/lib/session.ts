import "server-only";
import { createClient } from "./supabase/server";

export type Session = { authed: boolean; hasProfile: boolean; firstName?: string };

export async function getSession(): Promise<Session> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const uid = data?.claims?.sub;
  if (!uid) return { authed: false, hasProfile: false };
  // Filtra pelo próprio id: admins enxergam todos os perfis.
  const { data: profile } = await supabase.from("profiles").select("first_name").eq("id", uid).maybeSingle();
  return { authed: true, hasProfile: Boolean(profile), firstName: profile?.first_name };
}

export type DashRequest = {
  id: string; first_name: string; whatsapp: string | null; is_woman: boolean; people: number;
  nights?: string[]; message: string; flagged: boolean;
  status: "pending" | "confirmed" | "declined" | "cancelled" | "expired"; created_at: string; expires_at: string;
};
export type DashCity = { slug: string; name: string; timezone: string };
export type DashRide = {
  id: string; city: DashCity; origin_city: string; depart_at: string; return_at: string | null;
  seats_total: number; seats_taken: number; vehicle: "car" | "van" | "train" | "bus"; meeting_hint: string | null; notes: string | null;
  women_only: boolean; status: "open" | "full" | "paused" | "cancelled" | "removed"; requests: DashRequest[];
};
export type DashStay = {
  id: string; city: DashCity; area_hint: string; capacity: number; kind: "room" | "couch" | "mattress"; rules: string | null;
  women_only: boolean; status: "open" | "full" | "paused" | "cancelled" | "removed";
  nights: { night: string; remaining: number }[]; requests: DashRequest[];
};
export type Dashboard = {
  profile: { first_name: string; email: string; is_admin: boolean; banned: boolean } | null;
  rides: DashRide[]; stays: DashStay[];
};

export async function getDashboard(): Promise<Dashboard> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_dashboard");
  if (error) throw error;
  return data as unknown as Dashboard;
}
