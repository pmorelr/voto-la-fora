"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { moderateReportAction, type Decision } from "@/app/actions/moderation";
import { Button } from "@/components/ui/button";

const confirmacoes: Record<Decision, string> = {
  keep: "Manter o anúncio como está e arquivar as denúncias?",
  clear: "Tirar o texto livre do anúncio (observações e ponto de encontro, ou regras da casa) e mantê-lo no ar?",
  remove: "Remover este anúncio? Ele sai do site e quem pediu vaga é avisado.",
  ban: "Banir esta pessoa? Todos os anúncios dela saem do ar e ela não consegue voltar com o mesmo e-mail.",
};

/** Decisão sobre um anúncio denunciado, com aviso opcional por e-mail a quem anunciou. */
export function ReportReview({ kind, id, hasText }: { kind: "ride" | "stay"; id: string; hasText: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notify, setNotify] = useState(true);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const act = (decision: Decision) => {
    if (!confirm(confirmacoes[decision])) return;
    start(async () => {
      const r = await moderateReportAction(kind, id, decision, notify, message);
      if (!r.ok) setResult(r.message);
      else {
        setResult(decision !== "keep" && notify ? (r.notified ? "Feito. Quem anunciou foi avisado por e-mail." : "Feito, mas o e-mail para quem anunciou não saiu.") : "Feito.");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-3 border-t pt-3">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="size-4 accent-[var(--brand)]" />
        Avisar quem anunciou por e-mail (ao tirar o texto, remover ou banir)
      </label>
      {notify && (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Explicação para quem anunciou (opcional). Ex.: o anúncio condicionava a vaga ao voto."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="rounded-md" disabled={pending} onClick={() => act("keep")}>Manter anúncio</Button>
        {hasText && <Button size="sm" variant="outline" className="rounded-md" disabled={pending} onClick={() => act("clear")}>Tirar o texto e manter</Button>}
        <Button size="sm" variant="destructive" className="rounded-md" disabled={pending} onClick={() => act("remove")}>Remover anúncio</Button>
        <Button size="sm" variant="ghost" className="rounded-md text-destructive" disabled={pending} onClick={() => act("ban")}>Banir pessoa</Button>
      </div>
      {result && <p role="status" className="text-sm font-semibold">{result}</p>}
    </div>
  );
}
