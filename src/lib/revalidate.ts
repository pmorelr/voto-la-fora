import "server-only";
import { revalidatePath } from "next/cache";
import { langs } from "@/i18n";

// As páginas públicas (países, mapa e cidades) ficam em cache por até 60 segundos, em cada idioma. Depois de uma
// mudança que mexe em anúncios de várias cidades (moderação, banimento, decisão de pedido, rotina diária), renova todas.
export function revalidatePublicPages() {
  revalidatePath("/[lang]/votar", "page");
  revalidatePath("/[lang]/votar/[pais]", "page");
  revalidatePath("/[lang]/cidade/[slug]", "page");
}

/** Renova a página de uma cidade nos dois idiomas. */
export function revalidateCity(slug: string) {
  for (const lang of langs) revalidatePath(`/${lang}/cidade/${slug}`);
}

/** Renova uma página dinâmica nos dois idiomas (painel, moderação). */
export function revalidateBoth(path: "/meus-anuncios" | "/moderacao") {
  revalidatePath(`/[lang]${path}`, "page");
}
