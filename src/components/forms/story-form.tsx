"use client";

import { useActionState, useCallback, useState } from "react";
import { submitStoryAction, type StoryState } from "@/app/actions/stories";
import { Turnstile } from "@/components/forms/turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalLink, useLang, useT } from "@/i18n/client";

type Initial = { body: string; first_name: string | null; city: string | null } | null;

export function StoryForm({ token, initial }: { token: string; initial: Initial }) {
  const lang = useLang();
  const t = useT();
  const [state, action, pending] = useActionState<StoryState, FormData>(submitStoryAction, { status: "idle" });
  const [turnstile, setTurnstile] = useState("");
  const onToken = useCallback((v: string) => setTurnstile(v), []);
  const [body, setBody] = useState(initial?.body ?? "");

  if (state.status === "ok") {
    return (
      <div className="rounded-2xl border border-brand/40 bg-accent p-6">
        <p className="font-serif text-2xl font-bold">{t("Obrigado por contar.", "Thank you for sharing.")}</p>
        <p className="mt-2">
          {t(
            "Recebemos o seu relato. Ele aparece no mural depois de uma revisão. Se quiser mudar alguma coisa, abra de novo o link do e-mail.",
            "We received your story. It will appear on the wall after a review. If you want to change anything, open the link from the email again.",
          )}
        </p>
        <LocalLink href="/" className="mt-4 inline-block font-bold text-brand-text underline">{t("Ver o resultado", "See the results")}</LocalLink>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5 rounded-2xl border bg-card p-5 md:p-6">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="turnstileToken" value={turnstile} />

      <div className="space-y-1.5">
        <Label htmlFor="body" className="text-base font-bold">{t("Seu relato", "Your story")}</Label>
        <p className="text-sm text-muted-foreground">
          {t(
            "Como foi a viagem, a hospedagem, a fila, o dia da votação? Fique à vontade para compartilhar qualquer relato ou comentário.",
            "How was the trip, the stay, the queue, election day? Feel free to share any story or comment.",
          )}
        </p>
        <textarea
          id="body" name="body" required minLength={10} maxLength={1500} rows={8} value={body} onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-base leading-relaxed"
        />
        <p className="text-right text-xs text-muted-foreground tabular-nums">{body.length}/1500</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">{t("Primeiro nome (opcional)", "First name (optional)")}</Label>
          <Input id="firstName" name="firstName" maxLength={30} autoComplete="given-name" defaultValue={initial?.first_name ?? ""} className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">{t("Cidade (opcional)", "City (optional)")}</Label>
          <Input id="city" name="city" maxLength={60} defaultValue={initial?.city ?? ""} className="h-11" />
        </div>
      </div>
      <p className="-mt-2 text-sm text-muted-foreground">{t("Sem nome, o relato aparece como anônimo.", "Without a name, the story appears as anonymous.")}</p>

      <label className="flex items-start gap-2.5 rounded-xl bg-secondary p-4 text-[15px]">
        <input type="checkbox" name="consent" required className="mt-1 size-4 shrink-0 accent-[var(--brand)]" />
        <span>
          {t(
            "Autorizo publicar este relato no mural do Voto Lá Fora, com o nome e a cidade que informei. Sei que ele passa por revisão antes de aparecer e que posso pedir para retirá-lo a qualquer momento, escrevendo para contato@votolafora.com.br.",
            "I allow Voto Lá Fora to publish this story on its wall, with the name and city I gave. I know it is reviewed before it appears and that I can ask for it to be removed at any time by writing to contato@votolafora.com.br.",
          )}
        </span>
      </label>

      <Turnstile onToken={onToken} />
      {state.status === "error" && <p role="alert" className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground">{state.message}</p>}
      <Button type="submit" disabled={pending || !turnstile} className="h-12 w-full rounded-md text-base font-bold">
        {pending ? t("Enviando...", "Sending...") : initial ? t("Atualizar o relato", "Update my story") : t("Enviar o relato", "Send my story")}
      </Button>
    </form>
  );
}
