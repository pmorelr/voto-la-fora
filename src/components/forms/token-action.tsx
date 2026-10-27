"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { LocalLink, useLang, useT } from "@/i18n/client";

type State = { status: "idle" } | { status: "error"; message: string } | { status: "ok"; citySlug?: string; cityName?: string };

/** Botão que executa uma ação a partir de um link de e-mail. O clique evita que leitores automáticos executem a ação. */
export function TokenAction({
  token, action, label, done, doneLink,
}: {
  token: string;
  action: (prev: State, form: FormData) => Promise<State>;
  label: string;
  done: string;
  doneLink?: { href: string; label: string };
}) {
  const lang = useLang();
  const t = useT();
  const [state, run, pending] = useActionState<State, FormData>(action, { status: "idle" });
  if (state.status === "ok") {
    const href = state.citySlug ? `/cidade/${state.citySlug}` : doneLink?.href;
    return (
      <div className="space-y-3 rounded-2xl border border-brand/40 bg-accent p-6">
        <p className="text-lg font-bold">{done}{state.cityName ? t(` Avisaremos sobre ${state.cityName}.`, ` We will let you know about ${state.cityName}.`) : ""}</p>
        {href && <LocalLink href={href} className="font-bold text-brand-text underline">{state.cityName ? t(`Ver ofertas para ${state.cityName}`, `See offers for ${state.cityName}`) : doneLink?.label}</LocalLink>}
      </div>
    );
  }
  return (
    <form action={run} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="lang" value={lang} />
      {state.status === "error" && <p role="alert" className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground">{state.message}</p>}
      <Button type="submit" disabled={pending || !token} className="h-12 rounded-md px-6 text-base font-bold">{pending ? t("Aguarde...", "Please wait...") : label}</Button>
    </form>
  );
}
