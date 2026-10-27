// Motivos da denúncia: [texto que vai para a moderação, sempre em português; texto em inglês para o formulário].
export const reportReasons = {
  politica: ["Propaganda política ou vaga condicionada ao voto", "Political content, or a spot that depends on how you vote"],
  valor: ["Cobra valor ou pede pagamento", "Asks for money or payment"],
  contato: ["Telefone, e-mail, link ou endereço no anúncio", "Phone, email, link or address in the listing"],
  golpe: ["Parece golpe ou anúncio falso", "Looks like a scam or a fake listing"],
  outro: ["Outro motivo", "Something else"],
} as const;

export type ReportReason = keyof typeof reportReasons;
