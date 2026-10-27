import type { Metadata } from "next";
import { StoryForm } from "@/components/forms/story-form";
import { asLang, tr } from "@/i18n";
import { site } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

// Formulário do mural de relatos, aberto pelo link pessoal do e-mail (?c=código). Fora dos buscadores.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/relato">): Promise<Metadata> {
  return { title: tr(asLang((await params).lang))("Conte como foi", "Tell us how it went"), robots: { index: false, follow: false } };
}

type Story = { valid: boolean; story?: { body: string; first_name: string | null; city: string | null; status: string } | null };

export default async function RelatoPage({ params, searchParams }: PageProps<"/[lang]/relato">) {
  const t = tr(asLang((await params).lang));
  const { c } = await searchParams;
  const token = typeof c === "string" ? c : "";
  const { data } = token ? await createAdminClient().rpc("story_get", { p_token: token }) : { data: null };
  const res = (data ?? { valid: false }) as Story;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 md:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-text">{t("Mural de relatos", "Wall of stories")}</p>
      <h1 className="mt-3 text-4xl md:text-5xl">{t("Conte como foi", "Tell us how it went")}</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        {t(
          "Estamos juntando histórias de quem ofereceu, pediu ou espalhou o Voto Lá Fora no 2º turno. Os relatos aprovados aparecem na página inicial do site.",
          "We are collecting stories from people who offered, asked for or shared Voto Lá Fora in the 2nd round. Approved stories appear on the site's home page.",
        )}
      </p>
      <div className="mt-8">
        {res.valid ? (
          <StoryForm token={token} initial={res.story ?? null} />
        ) : (
          <div className="rounded-2xl border bg-card p-6">
            <p className="font-bold">{t("Este link não é válido.", "This link is not valid.")}</p>
            <p className="mt-2 text-muted-foreground">
              {t(
                `Use o link do e-mail que você recebeu. Se ele não funcionar, escreva para ${site.contactEmail}.`,
                `Please use the link from the email you received. If it doesn't work, write to ${site.contactEmail}.`,
              )}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
