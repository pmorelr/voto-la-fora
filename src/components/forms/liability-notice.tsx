"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";
import { LocalLink, useLang, useT } from "@/i18n/client";
import { siteText } from "@/lib/config";

/**
 * Aviso de responsabilidade com confirmação obrigatória, na hora de publicar uma oferta ou pedir uma vaga.
 * Controlado (formulários de oferta) ou pelo nome "ack" num formulário comum (pedido).
 * Em ofertas (`offer`), a mesma caixa confirma também o compromisso de não condicionar a vaga ao voto.
 */
export function LiabilityNotice({ checked, onChange, offer = false }: { checked?: boolean; onChange?: (value: boolean) => void; offer?: boolean }) {
  const t = useT();
  const text = siteText(useLang());
  const controlled = onChange !== undefined;
  return (
    <div className="space-y-3 rounded-lg border border-foreground/15 bg-secondary p-4 text-sm">
      <p className="flex items-center gap-2 font-bold"><ShieldAlert className="size-4 shrink-0" /> {t("Antes de continuar", "Before you continue")}</p>
      <p>{text.liability}</p>
      <p>{text.noVerification} {t("Confira com cuidado com quem você combina.", "Take care when deciding who you make arrangements with.")}</p>
      {offer && (
        <p className="flex items-start gap-2 rounded-md border-2 border-foreground bg-card p-3 font-bold"><AlertTriangle className="mt-0.5 size-4 shrink-0" /> <span>{text.offerWarning}</span></p>
      )}
      <label className="flex items-start gap-2 font-semibold">
        <input
          type="checkbox"
          name="ack"
          required
          className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]"
          {...(controlled ? { checked: Boolean(checked), onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked) } : {})}
        />
        <span>
          {offer
            ? text.offerAck
            : t("Li e entendi. O que eu combinar com a outra pessoa é responsabilidade nossa, e aceito os ", "I have read and understood. Whatever I arrange with the other person is our own responsibility, and I accept the ")}
          <LocalLink href="/sobre/termos" target="_blank" className="underline">{t("termos de uso", "terms of use")}</LocalLink>.
        </span>
      </label>
    </div>
  );
}
