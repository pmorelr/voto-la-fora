"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAccountAction, signOutAction } from "@/app/actions/auth";
import { decideRequestAction, flagRequestAction, setListingStatusAction } from "@/app/actions/dashboard";
import { AuthStep } from "@/components/forms/auth-step";
import { Button } from "@/components/ui/button";
import { lp } from "@/i18n";
import { useLang, useT } from "@/i18n/client";

type Kind = "ride" | "stay";

function useAct() {
  const router = useRouter();
  const t = useT();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.message ?? t("Algo deu errado.", "Something went wrong."));
      router.refresh();
    });
  return { pending, error, run };
}

export function RequestButtons({ kind, id }: { kind: Kind; id: string }) {
  const { pending, error, run } = useAct();
  const lang = useLang();
  const t = useT();
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button size="lg" disabled={pending} onClick={() => run(() => decideRequestAction(kind, id, true, lang))} className="rounded-md font-bold">{t("Confirmar vaga", "Confirm spot")}</Button>
        <Button size="lg" variant="outline" disabled={pending} onClick={() => run(() => decideRequestAction(kind, id, false, lang))} className="rounded-md">{t("Recusar", "Decline")}</Button>
        <Button size="lg" variant="ghost" disabled={pending} onClick={() => { if (confirm(t("Marcar como número que não confere ou spam? O pedido será recusado.", "Flag as a wrong number or spam? The request will be declined."))) run(() => flagRequestAction(kind, id, lang)); }} className="rounded-md text-muted-foreground">
          {t("Número não confere", "Wrong number")}
        </Button>
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}

export function ListingButtons({ kind, id, status, editHref }: { kind: Kind; id: string; status: string; editHref: string }) {
  const { pending, error, run } = useAct();
  const router = useRouter();
  const lang = useLang();
  const t = useT();
  if (status === "cancelled" || status === "removed") return null;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="rounded-md" onClick={() => router.push(lp(lang, editHref))}>{t("Editar", "Edit")}</Button>
        {status === "paused" ? (
          <Button size="sm" variant="outline" className="rounded-md" disabled={pending} onClick={() => run(() => setListingStatusAction(kind, id, "open", lang))}>{t("Reabrir", "Reopen")}</Button>
        ) : (
          <Button size="sm" variant="outline" className="rounded-md" disabled={pending} onClick={() => run(() => setListingStatusAction(kind, id, "paused", lang))}>{t("Pausar", "Pause")}</Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          className="rounded-md"
          disabled={pending}
          onClick={() => { if (confirm(t("Cancelar este anúncio? Quem tinha pedido vaga é avisado por e-mail, se deixou e-mail.", "Cancel this listing? People who requested a spot will be notified by email, if they left one."))) run(() => setListingStatusAction(kind, id, "cancelled", lang)); }}
        >
          {t("Cancelar anúncio", "Cancel listing")}
        </Button>
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}

export function AccountButtons() {
  const router = useRouter();
  const lang = useLang();
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" className="rounded-md" disabled={pending} onClick={() => start(async () => { await signOutAction(); router.push(lp(lang, "/")); router.refresh(); })}>{t("Sair", "Sign out")}</Button>
      <Button
        variant="ghost"
        className="rounded-md text-destructive"
        disabled={pending}
        onClick={() => {
          if (!confirm(t("Apagar sua conta e todos os seus anúncios e pedidos recebidos? Não dá para desfazer.", "Delete your account and all your listings and received requests? This can’t be undone."))) return;
          start(async () => { await deleteAccountAction(lang); router.push(lp(lang, "/")); router.refresh(); });
        }}
      >
        {t("Apagar minha conta", "Delete my account")}
      </Button>
    </div>
  );
}

export function LoginPanel() {
  const router = useRouter();
  const t = useT();
  return <AuthStep onDone={() => router.refresh()} submitLabel={t("Entrar", "Sign in")} />;
}

export function ProfilePanel() {
  const router = useRouter();
  const t = useT();
  return <AuthStep onDone={() => router.refresh()} needsProfileOnly submitLabel={t("Salvar", "Save")} />;
}
