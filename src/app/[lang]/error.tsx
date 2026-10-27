"use client"; // Error boundaries precisam ser Client Components

import { useEffect } from "react";
import { useT } from "@/i18n/client";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">{t("Algo deu errado", "Something went wrong")}</h1>
      <p className="mt-3 text-muted-foreground">
        {t("Não conseguimos carregar esta página agora. Tente de novo em instantes.", "We couldn’t load this page right now. Please try again in a moment.")}
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-6 font-semibold text-primary-foreground transition hover:bg-brand-deep"
      >
        {t("Tentar de novo", "Try again")}
      </button>
    </main>
  );
}
