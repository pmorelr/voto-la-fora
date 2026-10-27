// Traduz as chaves de erro do banco (raise exception '<chave>') para mensagens em português e inglês.
import type { Lang } from "@/i18n";

const messages: Record<string, string> = {
  not_authenticated: "Entre com seu e-mail para continuar.",
  profile_required: "Falta só o seu primeiro nome para continuar.",
  banned: "Esta conta foi bloqueada pela moderação.",
  consent_required: "É preciso aceitar os termos e a política de privacidade para continuar.",
  city_not_found: "Não encontramos essa cidade de votação.",
  depart_out_of_window: "A saída precisa ser entre 19 e 27 de outubro.",
  rate_limited: "Muitas tentativas em pouco tempo. Tente de novo mais tarde.",
  too_many_listings: "Você já tem 5 anúncios ativos. Cancele um para criar outro.",
  seats_below_confirmed: "Já há mais vagas confirmadas do que esse número.",
  invalid_nights: "Escolha noites entre 23 e 25 de outubro.",
  nights_below_confirmed: "Há pessoas confirmadas em uma noite que você tirou.",
  capacity_below_confirmed: "Há mais pessoas confirmadas do que essa capacidade.",
  not_found: "Não encontramos esse anúncio ou pedido.",
  invalid_status: "Ação inválida para este anúncio.",
  request_expired: "Esse pedido venceu: passaram 48 horas sem resposta.",
  not_pending: "Esse pedido já foi respondido.",
  listing_not_open: "Esse anúncio não está aceitando pedidos agora.",
  not_enough_seats: "Não há vagas suficientes nessa carona.",
  not_enough_space: "Não há espaço suficiente nessas noites.",
  women_only: "Este anúncio é só para mulheres.",
  already_requested: "Você já pediu uma vaga neste anúncio.",
  too_many_pending: "Você já tem 3 pedidos esperando resposta. Espere uma resposta ou cancele um deles.",
  not_cancellable: "Esse pedido já foi encerrado.",
  forbidden: "Você não tem permissão para isso.",
};

const messagesEn: Record<string, string> = {
  not_authenticated: "Sign in with your email to continue.",
  profile_required: "We just need your first name to continue.",
  banned: "This account was blocked by moderation.",
  consent_required: "You need to accept the terms and the privacy policy to continue.",
  city_not_found: "We couldn't find that voting city.",
  depart_out_of_window: "The departure must be between 19 and 27 October.",
  rate_limited: "Too many attempts in a short time. Please try again later.",
  too_many_listings: "You already have 5 active listings. Cancel one to create another.",
  seats_below_confirmed: "There are already more confirmed seats than that number.",
  invalid_nights: "Choose nights between 23 and 25 October.",
  nights_below_confirmed: "There are confirmed people on a night you removed.",
  capacity_below_confirmed: "There are more confirmed people than that capacity.",
  not_found: "We couldn't find that listing or request.",
  invalid_status: "That action isn't valid for this listing.",
  request_expired: "This request expired: 48 hours passed without a reply.",
  not_pending: "This request has already been answered.",
  listing_not_open: "This listing isn't accepting requests right now.",
  not_enough_seats: "There aren't enough seats left in this ride.",
  not_enough_space: "There isn't enough space on those nights.",
  women_only: "This listing is for women only.",
  already_requested: "You have already requested a spot in this listing.",
  too_many_pending: "You already have 3 requests waiting for a reply. Wait for an answer or cancel one of them.",
  not_cancellable: "This request is already closed.",
  forbidden: "You don't have permission to do that.",
};

export function errorMessage(error: unknown, lang: Lang = "pt"): string {
  const raw =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "";
  if (lang === "en") return messagesEn[raw.trim()] ?? "Something went wrong. Please try again in a moment.";
  return messages[raw.trim()] ?? "Algo deu errado. Tente de novo em instantes.";
}
