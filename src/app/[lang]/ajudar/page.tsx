import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Car, House } from "lucide-react";
import { asLang, lp, tr } from "@/i18n";
import { alternates } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/ajudar">): Promise<Metadata> {
  const lang = asLang((await params).lang);
  return { alternates: alternates(lang, "/ajudar"), title: tr(lang)("Quero ajudar", "I want to help") };
}

export default async function AjudarPage({ params }: PageProps<"/[lang]/ajudar">) {
  const lang = asLang((await params).lang);
  const t = tr(lang);
  const steps: [string, string][] = [
    [t("Anuncie", "Post an offer"), t("Leva dois minutos. Confirmamos seu e-mail com um código, sem senha.", "It takes two minutes. We confirm your email with a code, no password.")],
    [t("Responda os pedidos", "Reply to requests"), t("Cada pedido chega por e-mail. Você confirma ou recusa em Meus anúncios.", "Each request arrives by email. You confirm or decline it in My listings.")],
    [t("Combine pelo WhatsApp", "Arrange it on WhatsApp"), t("Ao confirmar, um botão abre a conversa com a pessoa. Seu telefone nunca aparece no site.", "When you confirm, a button opens a chat with the person. Your phone number never appears on the site.")],
  ];
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-text">{t("Quero ajudar", "I want to help")}</p>
      <h1 className="mt-2 text-4xl md:text-5xl">{t("Como você quer ajudar?", "How would you like to help?")}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        {t(
          "Seu anúncio aparece na página da cidade de votação. Quem precisa pede uma vaga, você confirma e chama a pessoa no WhatsApp.",
          "Your offer appears on the voting city’s page. Someone who needs it requests a spot, you confirm and message them on WhatsApp. You don’t need to be a Brazilian voter to help.",
        )}
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link href={lp(lang, "/ajudar/carona")} className="group rounded-2xl border bg-card p-6 transition hover:border-brand">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><Car className="size-6" /></span>
          <h2 className="mt-4 text-2xl">{t("Dar carona ou ir em grupo", "Give a ride or travel as a group")}</h2>
          <p className="mt-2 text-muted-foreground">{t("Você vai de carro ou van até a cidade de votação e tem lugar sobrando, ou vai de trem ou ônibus de linha e topa ir em grupo.", "You are driving a car or van to the voting city and have spare seats, or you are taking a train or scheduled bus and happy to travel as a group.")}</p>
          <span className="mt-4 inline-flex items-center gap-1 font-bold text-brand-text">{t("Oferecer carona ou grupo", "Offer a ride or a group")} <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
        </Link>
        <Link href={lp(lang, "/ajudar/hospedagem")} className="group rounded-2xl border bg-card p-6 transition hover:border-brand">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><House className="size-6" /></span>
          <h2 className="mt-4 text-2xl">{t("Receber gente em casa", "Host someone at home")}</h2>
          <p className="mt-2 text-muted-foreground">{t("Você mora numa cidade de votação e tem um quarto, um sofá ou um colchão para uma ou duas noites.", "You live in a voting city and have a room, a sofa or a mattress for one or two nights.")}</p>
          <span className="mt-4 inline-flex items-center gap-1 font-bold text-brand-text">{t("Oferecer hospedagem", "Offer a place to stay")} <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
        </Link>
      </div>
      <ol className="mt-12 grid gap-4 md:grid-cols-3">
        {steps.map(([title, text], i) => (
          <li key={title} className="rounded-2xl border bg-secondary p-5">
            <span className="text-sm font-bold uppercase tracking-[0.08em] text-brand-text">{t("Passo", "Step")} {i + 1}</span>
            <h3 className="mt-1 text-xl">{title}</h3>
            <p className="mt-1 text-muted-foreground">{text}</p>
          </li>
        ))}
      </ol>
      <p className="mt-8"><Link href={lp(lang, "/meus-anuncios")} className="font-bold text-brand-text underline-offset-4 hover:underline">{t("Já anunciou? Ver meus anúncios", "Already posted? See my listings")}</Link></p>
    </main>
  );
}
