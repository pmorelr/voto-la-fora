import type { Metadata } from "next";
import { unsubscribeAlertAction } from "@/app/actions/alerts";
import { TokenAction } from "@/components/forms/token-action";
import { asLang, tr } from "@/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/aviso/sair">): Promise<Metadata> {
  return { title: tr(asLang((await params).lang))("Cancelar aviso", "Cancel alert"), robots: { index: false, follow: false } };
}

export default async function SairAvisoPage({ params, searchParams }: PageProps<"/[lang]/aviso/sair">) {
  const t = tr(asLang((await params).lang));
  const { t: token } = await searchParams;
  return (
    <main className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-4xl">{t("Parar de receber avisos", "Stop receiving alerts")}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{t("Seu e-mail sai da lista desta cidade na hora.", "Your email is removed from this city’s list straight away.")}</p>
      <div className="mt-6">
        <TokenAction
          token={typeof token === "string" ? token : ""}
          action={unsubscribeAlertAction}
          label={t("Parar de receber", "Stop receiving")}
          done={t("Pronto, você não vai mais receber avisos desta cidade.", "Done, you will no longer receive alerts for this city.")}
          doneLink={{ href: "/votar", label: t("Voltar às ofertas", "Back to the offers") }}
        />
      </div>
    </main>
  );
}
