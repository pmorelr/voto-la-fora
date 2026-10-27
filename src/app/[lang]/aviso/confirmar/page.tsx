import type { Metadata } from "next";
import { confirmAlertAction } from "@/app/actions/alerts";
import { TokenAction } from "@/components/forms/token-action";
import { asLang, tr } from "@/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/aviso/confirmar">): Promise<Metadata> {
  return { title: tr(asLang((await params).lang))("Confirmar aviso", "Confirm alert"), robots: { index: false, follow: false } };
}

export default async function ConfirmarAvisoPage({ params, searchParams }: PageProps<"/[lang]/aviso/confirmar">) {
  const t = tr(asLang((await params).lang));
  const { t: token } = await searchParams;
  return (
    <main className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-4xl">{t("Confirmar seu aviso", "Confirm your alert")}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{t("Vamos mandar no máximo um e-mail por dia com as ofertas novas para a sua cidade de votação.", "We will send at most one email a day with new offers for your voting city.")}</p>
      <div className="mt-6">
        <TokenAction token={typeof token === "string" ? token : ""} action={confirmAlertAction} label={t("Confirmar aviso", "Confirm alert")} done={t("Aviso confirmado.", "Alert confirmed.")} />
      </div>
    </main>
  );
}
