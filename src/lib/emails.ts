import "server-only";
import { cityNameEnFromPt } from "@/i18n/data";
import { lp } from "@/i18n";
import { site, siteEn } from "./config";
import { formatDateTime, isGroupTrip, nightLabel } from "./format";
import type { Mail } from "./email";
import type { PublicRide, PublicStay } from "./data";

// E-mails do site: sem propaganda, sem nome de partido ou candidato.
// Todos saem em português e, logo abaixo, em inglês: o site não guarda o idioma de cada pessoa.

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Part = { title: string; paragraphs: string[]; cta?: { label: string; url: string } };

function block(p: Part) {
  return `<h1 style="font-size:22px;line-height:1.3;margin:0 0 16px">${esc(p.title)}</h1>
${p.paragraphs.map((x) => `<p style="font-size:16px;line-height:1.55;margin:0 0 14px">${x}</p>`).join("\n")}
${p.cta ? `<p style="margin:22px 0"><a href="${p.cta.url}" style="background:#2b2825;color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:999px;display:inline-block">${esc(p.cta.label)}</a></p>` : ""}`;
}

function layout(pt: Part, en: Part) {
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1f1d1b">
<p style="font-size:14px;color:#2b2825;font-weight:bold;margin:0 0 8px">${esc(site.name)}</p>
${block(pt)}
<div lang="en" style="border-top:1px solid #e6e2dd;margin-top:28px;padding-top:20px">
<p style="font-size:12px;color:#6b6560;margin:0 0 10px">In English</p>
${block(en)}
</div>
<p style="font-size:12px;line-height:1.5;color:#6b6560;margin:24px 0 0">${esc(site.independence)} O site só conecta pessoas. Dados apagados até ${esc(site.retentionDate)}.<br>${esc(siteEn.independence)} The site only connects people. Data deleted by ${esc(siteEn.retentionDate)}.</p>
</div>`;
  const strip = (x: string) => x.replace(/<[^>]+>/g, "");
  const textOf = (p: Part) => [p.title, "", ...p.paragraphs.map(strip), p.cta ? `${p.cta.label}: ${p.cta.url}` : ""];
  const text = [...textOf(pt), "", "— In English —", "", ...textOf(en), "", site.independence, siteEn.independence].join("\n");
  return { html, text };
}

const tipo = (kind: "ride" | "stay") => (kind === "ride" ? "carona" : "hospedagem");
const kindEn = (kind: "ride" | "stay") => (kind === "ride" ? "ride" : "place to stay");
const url = (lang: "pt" | "en", path: string) => `${site.url}${lp(lang, path)}`;

export function novoPedido(p: { to: string; offererFirstName: string; requesterFirstName: string; kind: "ride" | "stay"; cityName: string; people: number; message: string }): Mail {
  const cityEn = cityNameEnFromPt(p.cityName);
  const { html, text } = layout(
    {
      title: `${p.requesterFirstName} pediu uma vaga`,
      paragraphs: [
        `Oi, ${esc(p.offererFirstName)}. ${esc(p.requesterFirstName)} pediu ${p.people === 1 ? "uma vaga" : `${p.people} vagas`} na sua ${tipo(p.kind)} para votar em ${esc(p.cityName)}.`,
        `Mensagem: “${esc(p.message)}”`,
        "Responda em até 48 horas. Depois disso, o pedido vence e a vaga volta a aparecer para outras pessoas.",
        esc(site.liability),
      ],
      cta: { label: "Ver o pedido", url: url("pt", "/meus-anuncios") },
    },
    {
      title: `${p.requesterFirstName} requested a spot`,
      paragraphs: [
        `Hi ${esc(p.offererFirstName)}, ${esc(p.requesterFirstName)} requested ${p.people === 1 ? "a spot" : `${p.people} spots`} in your ${kindEn(p.kind)} to vote in ${esc(cityEn)}.`,
        `Message: “${esc(p.message)}”`,
        "Please reply within 48 hours. After that the request expires and the spot is shown to other people again.",
        esc(siteEn.liability),
      ],
      cta: { label: "See the request", url: url("en", "/meus-anuncios") },
    },
  );
  return { to: p.to, subject: `${p.requesterFirstName} pediu uma vaga na sua ${tipo(p.kind)} · requested a spot in your ${kindEn(p.kind)}`, html, text };
}

export function pedidoRecebido(p: { to: string; firstName: string; offererFirstName: string; kind: "ride" | "stay"; cityName: string; cancelUrl: string }): Mail {
  const cityEn = cityNameEnFromPt(p.cityName);
  const { html, text } = layout(
    {
      title: "Seu pedido foi enviado",
      paragraphs: [
        `Oi, ${esc(p.firstName)}. Seu pedido de ${tipo(p.kind)} para ${esc(p.cityName)} chegou para ${esc(p.offererFirstName)}.`,
        `Se ${esc(p.offererFirstName)} confirmar, vai te chamar no WhatsApp para combinar. Avisamos aqui também.`,
        "Se não puder mais ir, cancele pelo link abaixo para liberar a vaga.",
      ],
      cta: { label: "Cancelar meu pedido", url: p.cancelUrl },
    },
    {
      title: "Your request was sent",
      paragraphs: [
        `Hi ${esc(p.firstName)}, your request for a ${kindEn(p.kind)} to ${esc(cityEn)} has reached ${esc(p.offererFirstName)}.`,
        `If ${esc(p.offererFirstName)} confirms, they will message you on WhatsApp to arrange the details. We will let you know here too.`,
        "If you can no longer go, cancel with the link below so the spot is freed up.",
      ],
      cta: { label: "Cancel my request", url: p.cancelUrl },
    },
  );
  return { to: p.to, subject: `Pedido enviado para ${p.offererFirstName} · Request sent to ${p.offererFirstName}`, html, text };
}

export function pedidoRespondido(p: { to: string; firstName: string; offererFirstName: string; kind: "ride" | "stay"; confirmed: boolean }): Mail {
  const { html, text } = p.confirmed
    ? layout(
        {
          title: "Sua vaga foi confirmada",
          paragraphs: [
            `Oi, ${esc(p.firstName)}. ${esc(p.offererFirstName)} confirmou sua vaga na ${tipo(p.kind)}.`,
            `${esc(p.offererFirstName)} vai te chamar no WhatsApp para combinar os detalhes. Confira se o número que você deixou está certo.`,
            "Leve um documento oficial com foto para votar.",
            esc(site.liability),
          ],
        },
        {
          title: "Your spot is confirmed",
          paragraphs: [
            `Hi ${esc(p.firstName)}, ${esc(p.offererFirstName)} confirmed your spot in the ${kindEn(p.kind)}.`,
            `${esc(p.offererFirstName)} will message you on WhatsApp to arrange the details. Check that the number you left is correct.`,
            "Bring an official photo ID to vote.",
            esc(siteEn.liability),
          ],
        },
      )
    : layout(
        {
          title: "Seu pedido não pôde ser aceito",
          paragraphs: [
            `Oi, ${esc(p.firstName)}. Desta vez ${esc(p.offererFirstName)} não conseguiu aceitar seu pedido.`,
            "Veja outras caronas e hospedagens para a sua cidade de votação, ou peça para ser avisada quando surgir algo novo.",
          ],
          cta: { label: "Ver outras ofertas", url: url("pt", "/votar") },
        },
        {
          title: "Your request could not be accepted",
          paragraphs: [
            `Hi ${esc(p.firstName)}, this time ${esc(p.offererFirstName)} could not accept your request.`,
            "Look at other rides and places to stay for your voting city, or ask to be notified when something new comes up.",
          ],
          cta: { label: "See other offers", url: url("en", "/votar") },
        },
      );
  return {
    to: p.to,
    subject: p.confirmed ? "Vaga confirmada · Spot confirmed" : "Seu pedido não foi aceito · Your request was not accepted",
    html,
    text,
  };
}

export function anuncioCancelado(p: { to: string; firstName: string; kind: "ride" | "stay"; cityName: string }): Mail {
  const cityEn = cityNameEnFromPt(p.cityName);
  const { html, text } = layout(
    {
      title: `A ${tipo(p.kind)} foi cancelada`,
      paragraphs: [
        `Oi, ${esc(p.firstName)}. Quem ofereceu a ${tipo(p.kind)} para ${esc(p.cityName)} precisou cancelar.`,
        "Veja outras ofertas para a sua cidade de votação.",
      ],
      cta: { label: "Ver outras ofertas", url: url("pt", "/votar") },
    },
    {
      title: `The ${kindEn(p.kind)} was cancelled`,
      paragraphs: [
        `Hi ${esc(p.firstName)}, the person who offered the ${kindEn(p.kind)} to ${esc(cityEn)} had to cancel.`,
        "Look at other offers for your voting city.",
      ],
      cta: { label: "See other offers", url: url("en", "/votar") },
    },
  );
  return { to: p.to, subject: `A ${tipo(p.kind)} para ${p.cityName} foi cancelada · The ${kindEn(p.kind)} to ${cityEn} was cancelled`, html, text };
}

export function pedidoCancelado(p: { to: string; offererFirstName: string; requesterFirstName: string; kind: "ride" | "stay"; wasConfirmed: boolean }): Mail {
  const { html, text } = layout(
    {
      title: `${p.requesterFirstName} cancelou o pedido`,
      paragraphs: [
        `Oi, ${esc(p.offererFirstName)}. ${esc(p.requesterFirstName)} cancelou o pedido na sua ${tipo(p.kind)}.`,
        p.wasConfirmed ? "A vaga voltou a aparecer para outras pessoas." : "O pedido ainda estava pendente; nada muda no seu anúncio.",
      ],
      cta: { label: "Ver meus anúncios", url: url("pt", "/meus-anuncios") },
    },
    {
      title: `${p.requesterFirstName} cancelled the request`,
      paragraphs: [
        `Hi ${esc(p.offererFirstName)}, ${esc(p.requesterFirstName)} cancelled the request for your ${kindEn(p.kind)}.`,
        p.wasConfirmed ? "The spot is shown to other people again." : "The request was still pending; nothing changes in your listing.",
      ],
      cta: { label: "See my listings", url: url("en", "/meus-anuncios") },
    },
  );
  return { to: p.to, subject: `${p.requesterFirstName} cancelou o pedido · cancelled the request`, html, text };
}

export function lembrete(p: { to: string; firstName: string; pending: number }): Mail {
  const { html, text } = layout(
    {
      title: "Tem gente esperando sua resposta",
      paragraphs: [
        `Oi, ${esc(p.firstName)}. ${p.pending === 1 ? "Um pedido espera" : `${p.pending} pedidos esperam`} sua resposta há mais de 24 horas.`,
        "Os pedidos vencem em 48 horas. Confirme ou recuse para a pessoa poder se organizar.",
      ],
      cta: { label: "Responder agora", url: url("pt", "/meus-anuncios") },
    },
    {
      title: "People are waiting for your reply",
      paragraphs: [
        `Hi ${esc(p.firstName)}, ${p.pending === 1 ? "one request has" : `${p.pending} requests have`} been waiting for your reply for more than 24 hours.`,
        "Requests expire after 48 hours. Please confirm or decline so the person can make plans.",
      ],
      cta: { label: "Reply now", url: url("en", "/meus-anuncios") },
    },
  );
  return { to: p.to, subject: "Pedidos esperando sua resposta · Requests waiting for your reply", html, text };
}

export function avisoConfirmar(p: { to: string; cityName: string; confirmUrl: string }): Mail {
  const cityEn = cityNameEnFromPt(p.cityName);
  const { html, text } = layout(
    {
      title: `Confirme seu aviso para ${p.cityName}`,
      paragraphs: [
        `Você pediu para ser avisado quando surgirem caronas ou hospedagens para votar em ${esc(p.cityName)}.`,
        "Confirme pelo botão abaixo. Sem a confirmação, não mandamos nada.",
      ],
      cta: { label: "Confirmar aviso", url: p.confirmUrl },
    },
    {
      title: `Confirm your alert for ${cityEn}`,
      paragraphs: [
        `You asked to be notified when rides or places to stay come up for voting in ${esc(cityEn)}.`,
        "Confirm with the button below. Without confirmation, we will not send anything.",
      ],
      cta: { label: "Confirm alert", url: p.confirmUrl },
    },
  );
  return { to: p.to, subject: `Confirme seu aviso para ${p.cityName} · Confirm your alert for ${cityEn}`, html, text };
}

/** Alguém pediu o "Me avise" com um e-mail que já tem aviso confirmado para a cidade: só um lembrete, sem link. */
export function avisoJaAtivo(p: { to: string; cityName: string; cityUrl: string }): Mail {
  const cityEn = cityNameEnFromPt(p.cityName);
  const { html, text } = layout(
    {
      title: `Você já recebe os avisos de ${p.cityName}`,
      paragraphs: [
        `Recebemos um novo pedido de aviso para ${esc(p.cityName)} com este e-mail. Ele já está confirmado, então nada muda: você continua recebendo no máximo um e-mail por dia com as ofertas novas.`,
        "Se não foi você, pode ignorar esta mensagem. Para parar de receber, use o link de cancelar em qualquer e-mail de aviso.",
      ],
      cta: { label: `Ver ${p.cityName}`, url: p.cityUrl },
    },
    {
      title: `You already get alerts for ${cityEn}`,
      paragraphs: [
        `We received a new alert request for ${esc(cityEn)} with this email address. It is already confirmed, so nothing changes: you still get at most one email a day with new offers.`,
        "If this wasn't you, you can ignore this message. To stop receiving alerts, use the unsubscribe link in any alert email.",
      ],
      cta: { label: `See ${cityEn}`, url: p.cityUrl },
    },
  );
  return { to: p.to, subject: `Você já recebe os avisos de ${p.cityName} · You already get alerts for ${cityEn}`, html, text };
}

export function avisoNovidades(p: {
  to: string; cityName: string; citySlug: string; timezone: string; unsubscribeUrl: string;
  rides: PublicRide[]; stays: PublicStay[];
}): Mail {
  const cityEn = cityNameEnFromPt(p.cityName);
  const linesPt = [
    ...p.rides.map((r) => `${isGroupTrip(r.vehicle) ? (r.vehicle === "bus" ? "Grupo de ônibus" : "Grupo de trem") : "Carona"} de ${esc(r.origin_city)}, ${formatDateTime(r.depart_at, p.timezone)}, ${r.seats_left} ${r.seats_left === 1 ? "vaga" : "vagas"}, com ${esc(r.first_name)}`),
    ...p.stays.map((s) => `Hospedagem em ${esc(s.area_hint)}, ${s.nights.map((n) => nightLabel(n.night)).join("; ")}, com ${esc(s.first_name)}`),
  ];
  const linesEn = [
    ...p.rides.map((r) => `${isGroupTrip(r.vehicle) ? (r.vehicle === "bus" ? "Bus group" : "Train group") : "Ride"} from ${esc(r.origin_city)}, ${formatDateTime(r.depart_at, p.timezone, "en")}, ${r.seats_left} ${r.seats_left === 1 ? "seat" : "seats"}, with ${esc(r.first_name)}`),
    ...p.stays.map((s) => `Place to stay in ${esc(s.area_hint)}, ${s.nights.map((n) => nightLabel(n.night, "en")).join("; ")}, with ${esc(s.first_name)}`),
  ];
  const { html, text } = layout(
    {
      title: `Novidades para votar em ${p.cityName}`,
      paragraphs: [...linesPt.map((l) => `• ${l}`), `Para não receber mais: <a href="${p.unsubscribeUrl}">cancelar este aviso</a>.`],
      cta: { label: "Ver e pedir uma vaga", url: url("pt", `/cidade/${p.citySlug}`) },
    },
    {
      title: `New offers for voting in ${cityEn}`,
      paragraphs: [...linesEn.map((l) => `• ${l}`), `To stop receiving these: <a href="${p.unsubscribeUrl}">cancel this alert</a>.`],
      cta: { label: "See and request a spot", url: url("en", `/cidade/${p.citySlug}`) },
    },
  );
  return { to: p.to, subject: `Novas ofertas para votar em ${p.cityName} · New offers for ${cityEn}`, html, text };
}

/** Aviso interno para a moderação: chegou uma denúncia. Só vai para o contato do site. */
export function denunciaRecebida(p: { kind: "ride" | "stay"; listingId: string; cityName: string; citySlug: string; reason: string }): Mail {
  const linhas = [
    `Anúncio: ${tipo(p.kind)} em ${p.cityName} (${p.listingId.slice(0, 8)})`,
    `Motivo: ${p.reason}`,
    `Página da cidade: ${url("pt", `/cidade/${p.citySlug}`)}`,
    `Moderação: ${url("pt", "/moderacao")}`,
  ];
  return {
    to: site.contactEmail,
    subject: `Denúncia: ${tipo(p.kind)} em ${p.cityName}`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1f1d1b"><h1 style="font-size:20px;margin:0 0 16px">Nova denúncia</h1>${linhas.map((l) => `<p style="font-size:15px;line-height:1.5;margin:0 0 10px">${esc(l)}</p>`).join("")}</div>`,
    text: ["Nova denúncia", "", ...linhas].join("\n"),
  };
}

/** Aviso a quem anunciou depois de uma decisão da moderação. A mensagem da moderação é opcional. */
export function decisaoModeracao(p: {
  to: string; firstName: string; kind: "ride" | "stay"; cityName: string; decision: "clear" | "remove" | "ban"; message?: string;
}): Mail {
  const cityEn = cityNameEnFromPt(p.cityName);
  const motivo = p.message?.trim() ? `Mensagem da moderação: “${esc(p.message.trim())}”` : null;
  const motivoEn = p.message?.trim() ? `Message from the moderators: “${esc(p.message.trim())}”` : null;
  const regras = "As regras estão nos termos de uso: a vaga nunca depende do voto, e o anúncio não pode ter propaganda, valores, telefone, e-mail, link ou endereço completo.";
  const regrasEn = "The rules are in the terms of use: a place never depends on how anyone votes, and listings cannot include campaigning, amounts, phone numbers, email addresses, links or full street addresses.";
  const contato = `Se achar que houve um engano, escreva para ${site.contactEmail}.`;
  const contatoEn = `If you think this was a mistake, write to ${site.contactEmail}.`;
  const pt = {
    clear: {
      title: `Retiramos um texto do seu anúncio`,
      paragraphs: [`Oi, ${esc(p.firstName)}. Recebemos uma denúncia sobre a sua ${tipo(p.kind)} para ${esc(p.cityName)}. Retiramos as observações do anúncio, porque elas descumpriam as regras do site. O anúncio continua no ar.`, motivo, regras, "Você pode editar o anúncio em Meus anúncios.", contato],
      cta: { label: "Meus anúncios", url: url("pt", "/meus-anuncios") },
    },
    remove: {
      title: `Seu anúncio foi removido`,
      paragraphs: [`Oi, ${esc(p.firstName)}. Recebemos uma denúncia sobre a sua ${tipo(p.kind)} para ${esc(p.cityName)} e removemos o anúncio, porque ele descumpria as regras do site. Quem tinha pedido vaga foi avisado.`, motivo, regras, contato],
    },
    ban: {
      title: `Sua conta foi suspensa`,
      paragraphs: [`Oi, ${esc(p.firstName)}. Depois de uma denúncia sobre a sua ${tipo(p.kind)} para ${esc(p.cityName)}, suspendemos a sua conta no Voto Lá Fora, e os seus anúncios saíram do ar.`, motivo, regras, contato],
    },
  }[p.decision];
  const en = {
    clear: {
      title: `We removed some text from your listing`,
      paragraphs: [`Hi ${esc(p.firstName)}, we received a report about your ${kindEn(p.kind)} to ${esc(cityEn)}. We removed the notes from the listing because they broke the site's rules. The listing is still online.`, motivoEn, regrasEn, "You can edit the listing in My listings.", contatoEn],
      cta: { label: "My listings", url: url("en", "/meus-anuncios") },
    },
    remove: {
      title: `Your listing was removed`,
      paragraphs: [`Hi ${esc(p.firstName)}, we received a report about your ${kindEn(p.kind)} to ${esc(cityEn)} and removed the listing because it broke the site's rules. Anyone who had requested a spot has been told.`, motivoEn, regrasEn, contatoEn],
    },
    ban: {
      title: `Your account was suspended`,
      paragraphs: [`Hi ${esc(p.firstName)}, following a report about your ${kindEn(p.kind)} to ${esc(cityEn)}, we suspended your Voto Lá Fora account and your listings are no longer online.`, motivoEn, regrasEn, contatoEn],
    },
  }[p.decision];
  const clean = <T extends { paragraphs: (string | null)[] }>(x: T) => ({ ...x, paragraphs: x.paragraphs.filter((v): v is string => Boolean(v)) });
  const { html, text } = layout(clean(pt), clean(en));
  return { to: p.to, subject: `${pt.title} · ${en.title}`, html, text };
}

// E-mail "antes de votar" (24/10/2026): dois textos fixos, iguais para carona e hospedagem e para quem pediu ou
// oferece. "sexta" para quem só teve contato na sexta-feira 23/10; "fim de semana" para quem tem contato no sábado ou
// no domingo. O que depende do caso fica escrito de forma condicional no próprio texto.
export type TripContact = { kind: "ride" | "stay"; timezone: string; depart_at: string | null; nights: string[] | null };
export type TripTipsRecipient = { role: "requester" | "offerer"; email: string; first_name: string; contacts: TripContact[] };

const localDate = (tz: string, iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
/** Carona que saiu na sexta, ou hospedagem cuja última noite foi a de sexta. */
export const isFridayOnly = (c: TripContact) =>
  (c.kind === "ride" ? localDate(c.timezone, c.depart_at!) : [...c.nights!].sort().at(-1)!) <= "2026-10-23";

const mural = {
  pt: "Estamos montando um mural com histórias de quem foi votar com a ajuda do site. Se quiser participar, mande um relato curto. Só publicamos se você escrever <b>“pode publicar”</b> e disser como prefere aparecer: com primeiro nome e cidade, ou sem nome. Você pode pedir para retirar a qualquer momento.",
  en: "We are putting together a wall of stories from people who got to vote with the help of the site. If you would like to take part, send us a short account. We only publish it if you write <b>“you can publish”</b> and tell us how you would like to appear: first name and city, or no name. You can ask us to take it down at any time.",
};
const domingo = {
  pt: "<b>No domingo:</b> a votação vai das 8h às 17h, hora local. Leve um documento oficial com foto e confira o endereço da sua seção no e-Título.",
  en: "<b>On Sunday:</b> voting runs from 8 am to 5 pm, local time. Bring an official photo ID and check your polling station address in the e-Título app.",
};
const relogio = {
  pt: "<b>Se você vota na Europa:</b> o relógio volta uma hora na madrugada de domingo. O celular ajusta sozinho. Vale a hora combinada no horário novo.",
  en: "<b>If you vote in Europe:</b> the clocks go back one hour early on Sunday morning. Your phone adjusts on its own. The agreed time is in the new time.",
};
const relato = {
  pt: "<b>Depois de votar, conta para a gente como foi?</b> Basta responder este e-mail: a carona ou a hospedagem aconteceu? Você conseguiu votar? Houve algum problema?",
  en: "<b>After voting, will you tell us how it went?</b> Just reply to this email: did the ride or the stay happen? Were you able to vote? Was there any problem?",
};

export function antesDeVotar(p: { to: string; firstName: string; friday: boolean }): Mail {
  const nome = esc(p.firstName);
  const pt: Part = p.friday
    ? {
        title: "Domingo é dia de votar",
        paragraphs: [
          `Oi, ${nome}. Obrigado por usar o Voto Lá Fora. A carona ou a hospedagem que você combinou pelo site para sexta-feira já aconteceu. Esperamos que tenha corrido tudo bem.`,
          domingo.pt, relogio.pt, relato.pt, mural.pt,
          "Bom voto no domingo.<br>Pedro, Voto Lá Fora",
        ],
      }
    : {
        title: "Domingo é dia de votar",
        paragraphs: [
          `Oi, ${nome}. Obrigado por usar o Voto Lá Fora. Você tem uma carona ou uma hospedagem combinada pelo site para este fim de semana. Algumas dicas para dar tudo certo:`,
          "<b>Confirme pelo WhatsApp:</b> na carona, a hora, o ponto de encontro e quantas pessoas vão; na hospedagem, a hora de chegada.",
          relogio.pt,
          "<b>Se não puder mais ir</b>, avise a outra pessoa pelo WhatsApp. Quem pediu vaga cancela pelo link do e-mail de confirmação; quem oferece fecha o anúncio em Meus anúncios. Assim a vaga fica para outra pessoa.",
          "<b>Se você oferece</b> e alguém que vai com você não deixou e-mail, repasse estas dicas pelo WhatsApp.",
          "<b>Segurança:</b> encontrem-se num lugar movimentado e conte a alguém o trajeto. Em emergência, ligue para o número de emergência local.",
          domingo.pt, relato.pt, mural.pt,
          "Boa viagem e bom voto.<br>Pedro, Voto Lá Fora",
        ],
      };
  const en: Part = p.friday
    ? {
        title: "Sunday is voting day",
        paragraphs: [
          `Hi ${nome}, thank you for using Voto Lá Fora. The ride or the stay you arranged on the site for Friday has already happened. We hope everything went well.`,
          domingo.en, relogio.en, relato.en, mural.en,
          "Have a good vote on Sunday.<br>Pedro, Voto Lá Fora",
        ],
      }
    : {
        title: "Sunday is voting day",
        paragraphs: [
          `Hi ${nome}, thank you for using Voto Lá Fora. You have a ride or a place to stay arranged on the site for this weekend. A few tips to make sure everything goes well:`,
          "<b>Confirm on WhatsApp:</b> for a ride, the time, the meeting point and how many people are going; for a stay, the arrival time.",
          relogio.en,
          "<b>If you can no longer go</b>, let the other person know on WhatsApp. If you requested a spot, cancel with the link in the confirmation email; if you are offering, close the listing in My listings. That way someone else can have the spot.",
          "<b>If you are offering</b> and someone coming with you did not leave an email, please pass these tips on to them on WhatsApp.",
          "<b>Safety:</b> meet somewhere busy and tell someone your route. In an emergency, call the local emergency number.",
          domingo.en, relato.en, mural.en,
          "Have a good trip and a good vote.<br>Pedro, Voto Lá Fora",
        ],
      };
  const { html, text } = layout(pt, en);
  return { to: p.to, subject: "Domingo é dia de votar · Sunday is voting day", html, text, replyTo: site.contactEmail };
}

// E-mail "Votou-se aqui fora" (26/10/2026): agradece a quem usou ou espalhou o site, conta o resultado e convida para
// o mural de relatos, com um link pessoal para o formulário. Um por pessoa.
export function votouSeAquiFora(p: { to: string; firstName: string | null; token: string; numeros: { ofertantes: number; paises: number; lugares: number; abstencao1: number; abstencao2: number; maisVotantes: number }; prazo: { pt: string; en: string } }): Mail {
  const n = p.numeros;
  const pt0 = (x: number) => x.toLocaleString("pt-BR");
  const en0 = (x: number) => x.toLocaleString("en-GB");
  const pctPt = (x: number) => `${x.toFixed(1).replace(".", ",")}%`;
  const pctEn = (x: number) => `${x.toFixed(1)}%`;
  const oi = p.firstName ? `Oi, ${esc(p.firstName)}.` : "Oi.";
  const hi = p.firstName ? `Hi ${esc(p.firstName)},` : "Hi,";
  const relato = (lang: "pt" | "en") => `${url(lang, "/relato")}?c=${encodeURIComponent(p.token)}`;

  const { html, text } = layout(
    {
      title: "Votou-se aqui fora",
      paragraphs: [
        `${oi} Obrigado por fazer parte do Voto Lá Fora. Você ofereceu uma vaga no carro, abriu a sua casa, pediu um lugar ou espalhou o site, e cada uma dessas coisas contou.`,
        `Em três semanas, ${pt0(n.ofertantes)} pessoas ofereceram ajuda em ${n.paises} países, e ${pt0(n.lugares)} lugares em carros e casas foram combinados pelo site.`,
        `No 2º turno, a abstenção dos brasileiros no exterior caiu de ${pctPt(n.abstencao1)} para ${pctPt(n.abstencao2)}: <b>${pt0(n.maisVotantes)} pessoas a mais votaram fora do Brasil</b>. Isso veio de muitos esforços somados, e o Voto Lá Fora foi um deles. <a href="${url("pt", "/")}" style="color:#1f1d1b">Veja os números país por país</a>.`,
        "Agora estamos montando um mural com as histórias de quem participou. Se quiser contar a sua, como foi a viagem, a hospedagem, a fila ou o que você viu, é só abrir o formulário. Leva dois minutos, e nome e cidade são opcionais.",
        `O formulário fica aberto até ${esc(p.prazo.pt)}. Nada é publicado sem a sua autorização.`,
        "Obrigado de novo.<br>Pedro, Voto Lá Fora",
      ],
      cta: { label: "Contar como foi", url: relato("pt") },
    },
    {
      title: "We voted out here",
      paragraphs: [
        `${hi} thank you for being part of Voto Lá Fora. You offered a seat in your car, opened your home, asked for a place or shared the site, and every one of those things counted.`,
        `In three weeks, ${en0(n.ofertantes)} people offered help in ${n.paises} countries, and ${en0(n.lugares)} seats and beds were arranged through the site.`,
        `In the 2nd round, abstention among Brazilians abroad fell from ${pctEn(n.abstencao1)} to ${pctEn(n.abstencao2)}: <b>${en0(n.maisVotantes)} more people voted outside Brazil</b>. That came from many combined efforts, and Voto Lá Fora was one of them. <a href="${url("en", "/")}" style="color:#1f1d1b">See the figures country by country</a>.`,
        "We are now putting together a wall of stories from people who took part. If you would like to share yours, how the trip, the stay or the queue went, or what you saw, just open the form. It takes two minutes, and name and city are optional.",
        `The form is open until ${esc(p.prazo.en)}. Nothing is published without your permission.`,
        "Thank you again.<br>Pedro, Voto Lá Fora",
      ],
      cta: { label: "Share my story", url: relato("en") },
    },
  );
  return { to: p.to, subject: "Votou-se aqui fora · We voted out here", html, text, replyTo: site.contactEmail };
}
