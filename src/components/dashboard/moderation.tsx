"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { banAction, resolveReportAction, reviewAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

export function ReviewButtons({ kind, id, ownerId, cityName }: { kind: "ride" | "stay"; id: string; ownerId: string; cityName: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const act = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" className="rounded-md" disabled={pending} onClick={() => act(() => reviewAction(kind, id, true, cityName))}>Aprovar</Button>
      <Button size="sm" variant="destructive" className="rounded-md" disabled={pending} onClick={() => { if (confirm("Remover este anúncio? Quem pediu vaga é avisado.")) act(() => reviewAction(kind, id, false, cityName)); }}>Remover</Button>
      <Button size="sm" variant="ghost" className="rounded-md text-destructive" disabled={pending} onClick={() => { if (confirm("Banir esta pessoa? Todos os anúncios dela saem do ar.")) act(() => banAction(ownerId)); }}>Banir</Button>
    </div>
  );
}

export function ResolveButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button size="sm" variant="outline" className="rounded-md" disabled={pending} onClick={() => start(async () => { await resolveReportAction(id); router.refresh(); })}>
      Resolvida
    </Button>
  );
}
