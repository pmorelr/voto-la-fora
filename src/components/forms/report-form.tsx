"use client";

import { useActionState, useCallback, useState } from "react";
import { Flag } from "lucide-react";
import { reportListingAction, type ReportState } from "@/app/actions/report";
import { Turnstile } from "@/components/forms/turnstile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LocalLink, useLang, useT } from "@/i18n/client";
import { reportReasons } from "@/lib/report-reasons";

export function ReportForm({ kind, listingId, citySlug }: { kind: "ride" | "stay"; listingId: string; citySlug: string }) {
  const lang = useLang();
  const t = useT();
  const [state, action, pending] = useActionState<ReportState, FormData>(reportListingAction, { status: "idle" });
  const [token, setToken] = useState("");
  const onToken = useCallback((v: string) => setToken(v), []);

  if (state.status === "ok") {
    return (
      <div className="rounded-2xl border border-brand/40 bg-accent p-5">
        <p className="flex items-center gap-2 font-bold"><Flag className="size-5" /> {t("Denúncia recebida", "Report received")}</p>
        <p className="mt-1">{t("Obrigado. Vamos olhar este anúncio e tirá-lo do ar se ele quebrar as regras do site.", "Thank you. We will look at this listing and take it down if it breaks the site's rules.")}</p>
        <LocalLink href={`/cidade/${citySlug}`} className="mt-3 inline-block font-bold text-brand-text underline">{t("Voltar às ofertas", "Back to the offers")}</LocalLink>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border bg-card p-5">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="turnstileToken" value={token} />
      <input type="hidden" name="lang" value={lang} />
      <fieldset className="space-y-2">
        <legend className="font-semibold">{t("O que há de errado?", "What is wrong?")}</legend>
        {Object.entries(reportReasons).map(([value, [pt, en]]) => (
          <label key={value} className="flex items-start gap-2">
            <input type="radio" name="reason" value={value} required className="mt-1 size-4 accent-[var(--brand)]" /> {t(pt, en)}
          </label>
        ))}
      </fieldset>
      <div className="space-y-1.5">
        <Label htmlFor="report-details">{t("Detalhes (opcional)", "Details (optional)")}</Label>
        <textarea id="report-details" name="details" maxLength={800} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-base" />
      </div>
      <p className="text-sm text-muted-foreground">{t("A denúncia é anônima: quem anunciou não fica sabendo quem denunciou.", "Reports are anonymous: the person who posted the listing won't know who reported it.")}</p>
      <Turnstile onToken={onToken} />
      {state.status === "error" && <p role="alert" className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground">{state.message}</p>}
      <Button type="submit" disabled={pending || !token} className="h-11 w-full rounded-md font-bold">{pending ? t("Enviando...", "Sending...") : t("Enviar denúncia", "Send report")}</Button>
    </form>
  );
}
