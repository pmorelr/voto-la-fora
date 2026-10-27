"use client";

import { useCallback, useState, useTransition } from "react";
import { saveProfileAction, sendCodeAction, verifyCodeAction } from "@/app/actions/auth";
import { Turnstile } from "@/components/forms/turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalLink, useLang, useT } from "@/i18n/client";

type Stage = "email" | "code" | "profile";

/**
 * Conta leve de quem oferece: e-mail, código de 6 dígitos, primeiro nome e consentimento.
 * Chama onDone quando a pessoa está logada e com perfil.
 */
export function AuthStep({ onDone, needsProfileOnly = false, submitLabel }: { onDone: () => void; needsProfileOnly?: boolean; submitLabel?: string }) {
  const lang = useLang();
  const t = useT();
  const [stage, setStage] = useState<Stage>(needsProfileOnly ? "profile" : "email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [consent, setConsent] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const onCaptcha = useCallback((t: string) => setCaptcha(t), []);

  const sendCode = () =>
    start(async () => {
      setError(null);
      const r = await sendCodeAction(email, captcha, lang);
      setCaptchaReset((n) => n + 1);
      if (!r.ok) return setError(r.message);
      setStage("code");
    });

  const verify = () =>
    start(async () => {
      setError(null);
      const r = await verifyCodeAction(email, code, lang);
      if (!r.ok) return setError(r.message);
      if (r.firstName) return onDone();
      setStage("profile");
    });

  const saveProfile = () =>
    start(async () => {
      setError(null);
      const r = await saveProfileAction(firstName, consent, lang);
      if (!r.ok) return setError(r.message);
      onDone();
    });

  return (
    <div className="space-y-4">
      {stage === "email" && (
        <>
          <p className="text-muted-foreground">{t("Para você poder editar ou cancelar o anúncio depois, confirmamos seu e-mail com um código. Sem senha.", "So you can edit or cancel your listing later, we confirm your email with a code. No password.")}</p>
          <div className="space-y-1.5">
            <Label htmlFor="auth-email">{t("Seu e-mail", "Your email")}</Label>
            <Input id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
          </div>
          <Turnstile onToken={onCaptcha} resetKey={captchaReset} />
          <Button type="button" onClick={sendCode} disabled={pending || !email || !captcha} className="h-11 w-full rounded-md font-bold">
            {pending ? t("Enviando...", "Sending...") : t("Receber o código", "Get the code")}
          </Button>
        </>
      )}
      {stage === "code" && (
        <>
          <p className="text-muted-foreground">{t("Mandamos um código de 6 números para ", "We sent a 6-digit code to ")}<strong>{email}</strong>{t(". Pode demorar um minuto. Olhe também o spam.", ". It may take a minute. Check your spam folder too.")}</p>
          <div className="space-y-1.5">
            <Label htmlFor="auth-code">{t("Código", "Code")}</Label>
            <Input id="auth-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="h-12 text-center text-2xl tracking-[0.4em]" />
          </div>
          <Button type="button" onClick={verify} disabled={pending || code.length !== 6} className="h-11 w-full rounded-md font-bold">
            {pending ? t("Conferindo...", "Checking...") : t("Confirmar", "Confirm")}
          </Button>
          <button type="button" onClick={() => { setStage("email"); setCode(""); }} className="w-full text-sm text-muted-foreground underline">{t("Usar outro e-mail", "Use a different email")}</button>
        </>
      )}
      {stage === "profile" && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="auth-name">{t("Seu primeiro nome, como vai aparecer no anúncio", "Your first name, as it will appear on the listing")}</Label>
            <Input id="auth-name" autoComplete="given-name" maxLength={30} value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-11" />
          </div>
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 accent-[var(--brand)]" />
            <span>
              {t("Li e aceito os ", "I have read and accept the ")}
              <LocalLink href="/sobre/termos" target="_blank" className="underline">{t("termos", "terms")}</LocalLink>
              {t(" e a ", " and the ")}
              <LocalLink href="/sobre/privacidade" target="_blank" className="underline">{t("política de privacidade", "privacy policy")}</LocalLink>
              {t(". Entendo que meu primeiro nome aparece nos anúncios e que meus dados são apagados até 15/11/2026.", ". I understand that my first name appears on listings and that my data is deleted by 15 November 2026.")}
            </span>
          </label>
          <Button type="button" onClick={saveProfile} disabled={pending || firstName.trim().length < 2 || !consent} className="h-11 w-full rounded-md font-bold">
            {pending ? t("Salvando...", "Saving...") : (submitLabel ?? t("Continuar", "Continue"))}
          </Button>
        </>
      )}
      {error && <p role="alert" className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground">{error}</p>}
    </div>
  );
}
