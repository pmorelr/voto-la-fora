"use client";

import { useActionState, useCallback, useState } from "react";
import { Check, Copy, Send } from "lucide-react";
import { createRequestAction, type RequestState } from "@/app/actions/requests";
import { Turnstile } from "@/components/forms/turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { site } from "@/lib/config";
import { nightLabel } from "@/lib/format";
import { whatsappShareLink } from "@/lib/whatsapp";
import { LiabilityNotice } from "@/components/forms/liability-notice";
import { LocalLink, useLang, useT } from "@/i18n/client";

type Props = {
  kind: "ride" | "stay";
  listingId: string;
  citySlug: string;
  offererFirstName: string;
  maxPeople: number;
  womenOnly: boolean;
  nights?: { night: string; remaining: number }[];
};

export function RequestForm(p: Props) {
  const lang = useLang();
  const t = useT();
  const [state, action, pending] = useActionState<RequestState, FormData>(createRequestAction, { status: "idle" });
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);
  const onToken = useCallback((t: string) => setToken(t), []);

  if (state.status === "ok") {
    return (
      <div className="space-y-4 rounded-2xl border border-brand/40 bg-accent p-6">
        <h2 className="text-2xl">{t(`Pedido enviado para ${state.offererFirstName}`, `Request sent to ${state.offererFirstName}`)}</h2>
        <p>{t(`Se ${state.offererFirstName} confirmar, vai te chamar no WhatsApp para combinar. O pedido vence em 48 horas sem resposta.`, `If ${state.offererFirstName} confirms, they will message you on WhatsApp to arrange the details. The request expires after 48 hours without a reply.`)}</p>
        <p>{state.emailSent ? t("Mandamos este link também para o seu e-mail.", "We also sent this link to your email.") : t("Guarde este link: é por ele que você cancela o pedido se não puder mais ir.", "Keep this link: it is how you cancel the request if you can no longer go.")}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a href={whatsappShareLink(t(`Meu pedido no ${site.name}. Para cancelar: ${state.cancelUrl}`, `My request on ${site.name}. To cancel: ${state.cancelUrl}`))} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 font-bold text-primary-foreground">
            <Send className="size-4" /> {t("Mandar o link para mim no WhatsApp", "Send the link to myself on WhatsApp")}
          </a>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(state.cancelUrl).then(() => setCopied(true))}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border bg-card px-5 font-bold"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? t("Copiado", "Copied") : t("Copiar o link", "Copy the link")}
          </button>
        </div>
        <LocalLink href={`/cidade/${p.citySlug}`} className="inline-block font-bold text-brand-text underline-offset-4 hover:underline">{t("Ver outras ofertas", "See other offers")}</LocalLink>
      </div>
    );
  }

  const openNights = (p.nights ?? []).filter((n) => n.remaining > 0);
  return (
    <form action={action} className="space-y-5 rounded-2xl border bg-card p-5 md:p-6">
      <input type="hidden" name="kind" value={p.kind} />
      <input type="hidden" name="listingId" value={p.listingId} />
      <input type="hidden" name="citySlug" value={p.citySlug} />
      <input type="hidden" name="turnstileToken" value={token} />
      <input type="hidden" name="lang" value={lang} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">{t("Seu primeiro nome", "Your first name")}</Label>
          <Input id="firstName" name="firstName" required maxLength={30} autoComplete="given-name" className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">{t("Seu WhatsApp, com o código do país", "Your WhatsApp number, with country code")}</Label>
          <Input id="whatsapp" name="whatsapp" required inputMode="tel" autoComplete="tel" placeholder="+33 6 12 34 56 78" className="h-11" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="people">{t("Quantas pessoas", "How many people")}</Label>
        <select id="people" name="people" defaultValue="1" className="h-11 w-full rounded-lg border border-input bg-background px-3">
          {Array.from({ length: Math.max(1, Math.min(4, p.maxPeople)) }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n === 1 ? t("Só eu", "Just me") : t(`${n} pessoas`, `${n} people`)}</option>
          ))}
        </select>
      </div>

      {p.kind === "stay" && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t("Quais noites", "Which nights")}</legend>
          {openNights.map((n) => (
            <label key={n.night} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="nights" value={n.night} className="size-4 accent-[var(--brand)]" defaultChecked={openNights.length === 1} />
              {t("Noite de", "Night of")} {nightLabel(n.night, lang)}
            </label>
          ))}
        </fieldset>
      )}

      {p.womenOnly && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="isWoman" required className="mt-0.5 size-4 accent-[var(--brand)]" />
          {t("Sou mulher. Este anúncio é só para mulheres.", "I am a woman. This listing is for women only.")}
        </label>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="message">{t(`Mensagem para ${p.offererFirstName}`, `Message to ${p.offererFirstName}`)}</Label>
        <Textarea id="message" name="message" required minLength={5} maxLength={400} rows={3} placeholder={p.kind === "stay" ? t(`Oi, ${p.offererFirstName}. Chego no sábado à noite. Posso ficar com você?`, `Hi ${p.offererFirstName}, I arrive on Saturday evening. Could I stay with you?`) : t(`Oi, ${p.offererFirstName}. Saio de ... Posso ir com você?`, `Hi ${p.offererFirstName}, I'm leaving from ... Could I come with you?`)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">{t("Seu e-mail, se quiser saber a resposta por e-mail", "Your email, if you want to get the reply by email")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" className="h-11" />
      </div>

      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-[var(--brand)]" />
        <span>
          {t(`Concordo em compartilhar meu nome e WhatsApp com ${p.offererFirstName} para combinar a viagem, e com a `, `I agree to share my name and WhatsApp number with ${p.offererFirstName} to arrange the trip, and with the `)}
          <LocalLink href="/sobre/privacidade" className="underline" target="_blank">{t("política de privacidade", "privacy policy")}</LocalLink>
          {t(". Os dados são apagados até 15/11/2026.", ". The data is deleted by 15 November 2026.")}
        </span>
      </label>

      <LiabilityNotice />

      <Turnstile onToken={onToken} />

      {state.status === "error" && <p role="alert" className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground">{state.message}</p>}

      <Button type="submit" disabled={pending || !token} className="h-12 w-full rounded-md text-base font-bold">
        {pending ? t("Enviando...", "Sending...") : t("Enviar pedido", "Send request")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">{t(`Seu WhatsApp só aparece para ${p.offererFirstName}. Ninguém mais vê.`, `Your WhatsApp number is only shown to ${p.offererFirstName}. Nobody else sees it.`)}</p>
    </form>
  );
}
