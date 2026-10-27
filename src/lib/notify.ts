import "server-only";
import { sendEmail } from "./email";
import { anuncioCancelado, pedidoRespondido } from "./emails";
import { createAdminClient } from "./supabase/admin";

// Fora de arquivos "use server": nada daqui vira endpoint público.
// O e-mail de quem pediu nunca vai para quem oferece; só o servidor lê, com a chave secreta.

type Kind = "ride" | "stay";
const table = (kind: Kind) => (kind === "ride" ? "ride_requests" : "stay_requests");

async function contacts(kind: Kind, ids: string[]) {
  if (ids.length === 0) return [];
  const { data } = await createAdminClient().from(table(kind)).select("first_name, email").in("id", ids);
  return (data ?? []) as { first_name: string; email: string | null }[];
}

export async function notifyListingCancelled(affected: { first_name: string; email: string | null }[], kind: Kind, cityName: string) {
  await Promise.all(
    affected.filter((a) => a.email).map((a) => sendEmail(anuncioCancelado({ to: a.email!, firstName: a.first_name, kind, cityName }))),
  );
}

/** Cidade de um anúncio, lida do banco. Nunca usar nome ou slug vindos do navegador em e-mail ou revalidação. */
export async function listingCity(kind: Kind, id: string): Promise<{ slug: string; name: string } | null> {
  const query = kind === "ride"
    ? createAdminClient().from("rides").select("voting_cities(slug, name)").eq("id", id).maybeSingle()
    : createAdminClient().from("stays").select("voting_cities(slug, name)").eq("id", id).maybeSingle();
  const { data } = await query;
  return (data?.voting_cities as { slug: string; name: string } | null) ?? null;
}

export async function notifyListingCancelledByIds(ids: string[], kind: Kind, cityName: string) {
  await notifyListingCancelled(await contacts(kind, ids), kind, cityName);
}

export async function notifyRequestDecided(kind: Kind, requestId: string, offererFirstName: string, confirmed: boolean) {
  const [r] = await contacts(kind, [requestId]);
  if (r?.email) await sendEmail(pedidoRespondido({ to: r.email, firstName: r.first_name, offererFirstName, kind, confirmed }));
}
