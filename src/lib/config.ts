// Tudo o que muda quando o nome ou o domínio final forem decididos (interno/PLANO.md §19) está aqui.
// Fora do código, o nome também aparece em EMAIL_FROM, em supabase/templates/codigo.html e nos textos de content/legal.
export const site = {
  name: "Voto Lá Fora",
  description:
    "Caronas e hospedagem entre brasileiros para chegar à urna no exterior no 2º turno, em 25 de outubro de 2026.",
  // Lei 9.504, art. 57-H: a autoria não pode ser atribuída a partido, campanha ou candidato.
  independence: "Iniciativa independente de brasileiros no exterior. Sem vínculo com partido, campanha ou candidato.",
  // Na Vercel, sem NEXT_PUBLIC_SITE_URL, vale o domínio de produção do projeto: votalafora.vercel.app até o
  // domínio próprio entrar, votolafora.com.br depois (a Vercel escolhe o mais curto).
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  // Buscadores só depois do lançamento (src/app/robots.ts e o noindex do layout).
  indexable: process.env.PERMITIR_INDEXACAO === "1",
  retentionDate: "15 de novembro de 2026",
  // Caixa de contato (encaminhada pela Cloudflare para o Pedro): recebe também o aviso de cada denúncia.
  contactEmail: "contato@votolafora.com.br",
  // Aviso de responsabilidade (08/10/2026): aparece ao publicar, ao pedir, no contato pelo WhatsApp e nos e-mails.
  liability:
    "O site só coloca as pessoas em contato. Ele não se responsabiliza por transporte, hospedagem, pagamentos ou confirmações entre os usuários. Tudo o que for combinado acontece de forma privada e independente, entre as pessoas, sem participação, intermediação ou influência do site.",
  noVerification: "O site não verifica identidade, antecedentes, carteira de motorista, seguro, carro nem casa de ninguém.",
  // Compromisso de quem oferece (09/10/2026; reforçado a partir da sugestão do advogado em 09/10), confirmado na
  // mesma caixa do aviso de responsabilidade.
  offerWarning:
    "Condicionar a carona ou a hospedagem ao voto é proibido e pode ser crime eleitoral (Código Eleitoral, art. 299). Se você fizer isso, responderá individualmente. O site não responde pelo que você fizer.",
  offerAck:
    "Estou ciente de que posso ser responsabilizado individualmente se condicionar a vaga ao voto. Respondo pelo que eu publicar e combinar, e aceito os ",
} as const;

// Os mesmos textos fixos em inglês (versão em /en). Termos e privacidade: vale a versão em português.
export const siteEn = {
  description: "Rides and places to stay among Brazilians, to reach the polling station abroad in the 2nd round, on 25 October 2026.",
  independence: "An independent initiative by Brazilians abroad. Not affiliated with any party, campaign or candidate.",
  retentionDate: "15 November 2026",
  liability:
    "This site only puts people in touch. It is not responsible for transport, accommodation, payments or confirmations between users. Everything that is agreed happens privately and independently, between the people involved, without any participation, intermediation or influence from the site.",
  noVerification: "The site does not verify anyone's identity, background, driving licence, insurance, car or home.",
  offerWarning:
    "Making a ride or a stay depend on how someone votes is forbidden and may be an electoral crime under Brazilian law (Electoral Code, art. 299). If you do it, you will be held personally liable. The site is not responsible for what you do.",
  offerAck:
    "I understand that I may be held personally liable if I make the place depend on a vote. I am responsible for what I publish and arrange, and I accept the ",
} as const;

/** Textos fixos do site no idioma pedido. */
export function siteText(lang: "pt" | "en") {
  return lang === "en" ? { ...site, ...siteEn } : site;
}

export const election = {
  runoffDate: "2026-10-25",
  timezone: "Europe/Paris",
  // Noites oferecidas na hospedagem: cada data é a noite que começa naquele dia.
  nights: ["2026-10-23", "2026-10-24", "2026-10-25"],
  departMin: "2026-10-19",
  departMax: "2026-10-27",
} as const;

export const tabs = [
  { href: "/", label: "Resultado", labelEn: "Results" },
  { href: "/o-problema", label: "O problema", labelEn: "The problem" },
  { href: "/votar", label: "Quero ir votar", labelEn: "Get to the polls" },
  { href: "/ajudar", label: "Quero ajudar", labelEn: "I want to help" },
  { href: "/sobre", label: "Sobre", labelEn: "About" },
] as const;
