"use client";

import { useActionState, useCallback, useState } from "react";
import { BellRing } from "lucide-react";
import { createAlertAction, type AlertState } from "@/app/actions/alerts";
import { Turnstile } from "@/components/forms/turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalLink, useLang, useT } from "@/i18n/client";

export function AlertForm({ citySlug, cityName }: { citySlug: string; cityName: string }) {
  const lang = useLang();
  const t = useT();
  const [state, action, pending] = useActionState<AlertState, FormData>(createAlertAction, { status: "idle" });
  const [token, setToken] = useState("");
  const onToken = useCallback((t: string) => setToken(t), []);

  if (state.status === "ok") {
    return (
      <div className="rounded-2xl border border-brand/40 bg-accent p-5">
        <p className="flex items-center gap-2 font-bold"><BellRing className="size-5" /> {t("Falta só confirmar", "Just one more step")}</p>
        <p className="mt-1">{t(`Mandamos um link para ${state.email}. Sem a confirmação, não enviamos nada.`, `We sent a link to ${state.email}. Without confirmation, we won’t send anything.`)}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border bg-card p-5">
      <input type="hidden" name="citySlug" value={citySlug} />
      <input type="hidden" name="turnstileToken" value={token} />
      <input type="hidden" name="lang" value={lang} />
      <div className="space-y-1.5">
        <Label htmlFor="alert-email">{t("Seu e-mail", "Your email")}</Label>
        <Input id="alert-email" name="email" type="email" required autoComplete="email" className="h-11" />
      </div>
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">{t("Quero saber de", "Tell me about")}</legend>
        <div className="flex flex-wrap gap-3 text-sm">
          {[["both", t("Caronas e hospedagem", "Rides and places to stay")], ["ride", t("Só caronas", "Rides only")], ["stay", t("Só hospedagem", "Places to stay only")]].map(([value, label]) => (
            <label key={value} className="flex items-center gap-1.5">
              <input type="radio" name="kind" value={value} defaultChecked={value === "both"} className="size-4 accent-[var(--brand)]" /> {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="space-y-1.5">
        <Label htmlFor="alert-origin">{t("Cidade de onde você sai, se for carona", "City you’re leaving from, for a ride")}</Label>
        <Input id="alert-origin" name="origin" maxLength={80} placeholder={t("Ex.: Lyon", "E.g. Lyon")} className="h-11" />
      </div>
      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-[var(--brand)]" />
        <span>{t(`Quero receber no máximo um e-mail por dia com ofertas para ${cityName}. Li a `, `I want to receive at most one email a day with offers for ${cityName}. I have read the `)}<LocalLink href="/sobre/privacidade" className="underline" target="_blank">{t("política de privacidade", "privacy policy")}</LocalLink>.</span>
      </label>
      <Turnstile onToken={onToken} />
      {state.status === "error" && <p role="alert" className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground">{state.message}</p>}
      <Button type="submit" disabled={pending || !token} className="h-11 w-full rounded-md font-bold">{pending ? t("Enviando...", "Sending...") : t("Me avise", "Notify me")}</Button>
    </form>
  );
}
