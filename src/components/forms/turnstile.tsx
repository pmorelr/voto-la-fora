"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/i18n/client";

type TurnstileApi = {
  render: (el: HTMLElement, opts: { sitekey: string; callback: (t: string) => void; "expired-callback"?: () => void; language?: string; theme?: string }) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window { turnstile?: TurnstileApi; onTurnstileLoad?: () => void }
}

let loading: Promise<void> | null = null;
function loadScript() {
  if (window.turnstile) return Promise.resolve();
  loading ??= new Promise<void>((resolve) => {
    window.onTurnstileLoad = () => resolve();
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";
    s.async = true;
    document.head.appendChild(s);
  });
  return loading;
}

/** Verificação anti-robô do Cloudflare. Só carrega em páginas com formulário. */
export function Turnstile({ onToken, resetKey }: { onToken: (token: string) => void; resetKey?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useRef<string | null>(null);
  const lang = useLang();

  useEffect(() => {
    let cancelled = false;
    loadScript().then(() => {
      if (cancelled || !ref.current || !window.turnstile || id.current) return;
      id.current = window.turnstile.render(ref.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
        callback: onToken,
        "expired-callback": () => onToken(""),
        language: lang === "en" ? "en" : "pt-br",
        theme: "auto",
      });
    });
    return () => {
      cancelled = true;
      if (id.current && window.turnstile) window.turnstile.remove(id.current);
      id.current = null;
    };
  }, [onToken, lang]);

  useEffect(() => {
    if (resetKey && id.current && window.turnstile) window.turnstile.reset(id.current);
  }, [resetKey]);

  return <div ref={ref} className="min-h-[65px]" />;
}
