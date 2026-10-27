import { redirect } from "next/navigation";
import { asLang, lp } from "@/i18n";

// Entrar é o mesmo que abrir "Meus anúncios": a página mostra o login quando precisa.
export default async function EntrarPage({ params }: PageProps<"/[lang]/entrar">) {
  redirect(lp(asLang((await params).lang), "/meus-anuncios"));
}
