import "server-only";
import { site } from "@/lib/config";

export type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string };

const RESEND = "https://api.resend.com";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** POST no Resend com até 4 tentativas quando ele recusa por excesso (429) ou falha do lado dele (5xx). */
async function resendPost(path: string, body: unknown): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${RESEND}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok || attempt === 3 || (res.status !== 429 && res.status < 500)) return res;
    const retryAfter = Number(res.headers.get("retry-after"));
    await wait(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt);
  }
}

const payload = (from: string, mail: Mail) => ({ from, to: [mail.to], subject: mail.subject, html: mail.html, text: mail.text, ...(mail.replyTo ? { reply_to: mail.replyTo } : {}) });

/** Envia pelo Resend em produção; no ambiente local, entrega no Mailpit do Supabase. Nunca lança erro. */
export async function sendEmail(mail: Mail): Promise<boolean> {
  const from = process.env.EMAIL_FROM ?? `${site.name} <nao-responda@localhost>`;
  try {
    if (process.env.RESEND_API_KEY) {
      const res = await resendPost("/emails", payload(from, mail));
      if (!res.ok) console.error("Resend recusou o e-mail:", res.status, await res.text());
      return res.ok;
    }
    if (process.env.NODE_ENV !== "production") {
      const m = from.match(/^(.*)<(.+)>$/);
      const res = await fetch(`${process.env.MAILPIT_URL ?? "http://127.0.0.1:54324"}/api/v1/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          From: { Email: m?.[2] ?? from, Name: m?.[1]?.trim() ?? "" },
          To: [{ Email: mail.to }],
          ...(mail.replyTo ? { ReplyTo: [{ Email: mail.replyTo }] } : {}),
          Subject: mail.subject,
          HTML: mail.html,
          Text: mail.text,
        }),
      });
      return res.ok;
    }
    console.warn("E-mail não enviado: falta RESEND_API_KEY.");
    return false;
  } catch (error) {
    console.error("Falha ao enviar e-mail:", error);
    return false;
  }
}

/**
 * Envia muitos e-mails de uma vez (rotina diária): lotes de 100 pelo endpoint de lote do Resend, um lote por vez.
 * Devolve, na mesma ordem, se cada e-mail foi aceito. Nunca lança erro.
 */
export async function sendEmails(mails: Mail[]): Promise<boolean[]> {
  if (!process.env.RESEND_API_KEY) {
    const sent: boolean[] = [];
    for (const m of mails) sent.push(await sendEmail(m));
    return sent;
  }
  const from = process.env.EMAIL_FROM ?? `${site.name} <nao-responda@localhost>`;
  const sent: boolean[] = [];
  for (let i = 0; i < mails.length; i += 100) {
    const chunk = mails.slice(i, i + 100);
    let ok = false;
    try {
      const res = await resendPost("/emails/batch", chunk.map((m) => payload(from, m)));
      ok = res.ok;
      if (!ok) console.error("Resend recusou o lote:", res.status, await res.text());
    } catch (error) {
      console.error("Falha ao enviar o lote:", error);
    }
    sent.push(...chunk.map(() => ok));
  }
  return sent;
}
