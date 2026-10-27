import type { Metadata } from "next";
import { cancelRequestAction } from "@/app/actions/requests";
import { TokenAction } from "@/components/forms/token-action";
import { asLang, tr } from "@/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/pedido/cancelar">): Promise<Metadata> {
  return { title: tr(asLang((await params).lang))("Cancelar pedido", "Cancel request"), robots: { index: false, follow: false } };
}

export default async function CancelarPage({ params, searchParams }: PageProps<"/[lang]/pedido/cancelar">) {
  const t = tr(asLang((await params).lang));
  const { t: raw } = await searchParams;
  const token = typeof raw === "string" ? raw : "";
  return (
    <main className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-4xl">{t("Cancelar seu pedido", "Cancel your request")}</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        {t(
          "Se você não vai mais precisar da vaga, cancele para liberar o lugar para outra pessoa. Avisamos quem ofereceu.",
          "If you no longer need the spot, cancel it so someone else can take it. We will let the person who offered it know.",
        )}
      </p>
      <div className="mt-6">
        <TokenAction
          token={token}
          action={cancelRequestAction}
          label={t("Cancelar meu pedido", "Cancel my request")}
          done={t("Pedido cancelado. Obrigado por avisar.", "Request cancelled. Thanks for letting us know.")}
          doneLink={{ href: "/votar", label: t("Ver outras ofertas", "See other offers") }}
        />
      </div>
    </main>
  );
}
