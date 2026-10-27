/** Normaliza para o formato internacional (+código do país e número). Devolve null se não parecer válido. */
export function normalizeWhatsapp(input: string): string | null {
  let s = input.trim().replace(/[\s().-]/g, "");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  if (!s.startsWith("+")) return null;
  return /^\+[1-9][0-9]{7,14}$/.test(s) ? s : null;
}

export function whatsappLink(e164: string, text?: string) {
  const digits = e164.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Link para a pessoa mandar algo a si mesma ou a alguém (abre a escolha de conversa). */
export function whatsappShareLink(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
