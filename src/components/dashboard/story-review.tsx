"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { reviewStoryAction } from "@/app/actions/stories";
import { Button } from "@/components/ui/button";

/** Aprovar (aparece no mural), recusar ou devolver à fila um relato. */
export function StoryReview({ id, status }: { id: string; status: "pending" | "approved" | "rejected" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const act = (s: "approved" | "rejected" | "pending") => start(async () => {
    const res = await reviewStoryAction(id, s);
    if (!res.ok) alert(res.message);
    router.refresh();
  });
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "approved" && <Button size="sm" className="rounded-md" disabled={pending} onClick={() => act("approved")}>Aprovar e publicar</Button>}
      {status !== "rejected" && <Button size="sm" variant="outline" className="rounded-md" disabled={pending} onClick={() => act("rejected")}>{status === "approved" ? "Tirar do mural" : "Não publicar"}</Button>}
      {status !== "pending" && <Button size="sm" variant="ghost" className="rounded-md" disabled={pending} onClick={() => act("pending")}>Voltar para a fila</Button>}
    </div>
  );
}
