// Resultado do 2º turno de 2026 no exterior e o uso do Voto Lá Fora (26/10/2026). Fontes em content/dados/README.md:
// TSE, eleições 6257 e 6258, cargo Presidente, UF ZZ (content/dados/tse-exterior-2turno-2026.csv); contagens do banco
// de produção em 26/10/2026, só totais, guardadas aqui porque os dados do site são apagados até 15/11/2026.

export const exterior = {
  turno1: { aptos: 916534, compareceram: 341766, abstencao: 62.69 },
  turno2: { aptos: 916683, compareceram: 381443, abstencao: 58.37 },
};
// 2022: 56,19% no 1º turno e 55,33% no 2º.
export const queda2022 = 0.86;

export const site = { ofertantes: 1571, caronas: 586, hospedagens: 1089, contatos: 201, lugares: 251, lugaresCarona: 134, lugaresHospedagem: 117, paises: 39 };

// Por cidade de votação, abstenção do 1º para o 2º turno, conforme o número de anúncios no site.
export const porOfertas = [
  { faixa: "20+", cidades: 24, variacao: -5.2, votantes: 13.6 },
  { faixa: "1-19", cidades: 39, variacao: -3.6, votantes: 10.1 },
  { faixa: "0", cidades: 82, variacao: -2.1, votantes: 4.7 },
];

export type PaisResultado = { code: string; name: string; aptos: number; compareceram1: number; compareceram2: number; abstencao1: number; abstencao2: number; caronas: number; hospedagens: number };

// Países com ofertas no site e pelo menos 1.000 eleitores, da maior queda da abstenção para a menor.
export const paises: PaisResultado[] = [
  { code: "NO", name: "Noruega", aptos: 2190, compareceram1: 909, compareceram2: 1097, abstencao1: 58.40, abstencao2: 49.91, caronas: 2, hospedagens: 5 },
  { code: "AU", name: "Austrália", aptos: 20280, compareceram1: 8399, compareceram2: 9795, abstencao1: 58.57, abstencao2: 51.70, caronas: 17, hospedagens: 21 },
  { code: "CN", name: "China", aptos: 1503, compareceram1: 432, compareceram2: 532, abstencao1: 71.20, abstencao2: 64.60, caronas: 0, hospedagens: 1 },
  { code: "CH", name: "Suíça", aptos: 26988, compareceram1: 11238, compareceram2: 12876, abstencao1: 58.35, abstencao2: 52.29, caronas: 21, hospedagens: 28 },
  { code: "NZ", name: "Nova Zelândia", aptos: 3119, compareceram1: 339, compareceram2: 526, abstencao1: 89.13, abstencao2: 83.14, caronas: 3, hospedagens: 1 },
  { code: "CA", name: "Canadá", aptos: 46361, compareceram1: 22446, compareceram2: 25039, abstencao1: 51.57, abstencao2: 45.99, caronas: 30, hospedagens: 39 },
  { code: "PT", name: "Portugal", aptos: 134400, compareceram1: 51683, compareceram2: 59040, abstencao1: 61.54, abstencao2: 56.07, caronas: 108, hospedagens: 114 },
  { code: "DK", name: "Dinamarca", aptos: 2855, compareceram1: 1522, compareceram2: 1677, abstencao1: 46.71, abstencao2: 41.26, caronas: 4, hospedagens: 24 },
  { code: "AR", name: "Argentina", aptos: 13009, compareceram1: 5954, compareceram2: 6624, abstencao1: 54.21, abstencao2: 49.08, caronas: 3, hospedagens: 3 },
  { code: "DE", name: "Alemanha", aptos: 41404, compareceram1: 19246, compareceram2: 21360, abstencao1: 53.51, abstencao2: 48.41, caronas: 51, hospedagens: 194 },
  { code: "GB", name: "Reino Unido", aptos: 41911, compareceram1: 15491, compareceram2: 17626, abstencao1: 63.02, abstencao2: 57.94, caronas: 22, hospedagens: 56 },
  { code: "FR", name: "França", aptos: 29617, compareceram1: 11415, compareceram2: 12903, abstencao1: 61.46, abstencao2: 56.43, caronas: 48, hospedagens: 248 },
  { code: "NL", name: "Países Baixos", aptos: 12761, compareceram1: 6450, compareceram2: 7093, abstencao1: 49.42, abstencao2: 44.42, caronas: 28, hospedagens: 34 },
  { code: "ES", name: "Espanha", aptos: 40718, compareceram1: 12018, compareceram2: 13972, abstencao1: 70.48, abstencao2: 65.69, caronas: 30, hospedagens: 129 },
  { code: "US", name: "Estados Unidos", aptos: 265047, compareceram1: 75389, compareceram2: 87407, abstencao1: 71.55, abstencao2: 67.02, caronas: 123, hospedagens: 55 },
  { code: "IE", name: "Irlanda", aptos: 16725, compareceram1: 8417, compareceram2: 9086, abstencao1: 49.66, abstencao2: 45.67, caronas: 38, hospedagens: 19 },
  { code: "IT", name: "Itália", aptos: 38757, compareceram1: 12071, compareceram2: 13512, abstencao1: 68.85, abstencao2: 65.14, caronas: 20, hospedagens: 33 },
  { code: "SE", name: "Suécia", aptos: 4866, compareceram1: 2607, compareceram2: 2778, abstencao1: 46.42, abstencao2: 42.91, caronas: 7, hospedagens: 15 },
  { code: "AT", name: "Áustria", aptos: 3135, compareceram1: 1522, compareceram2: 1623, abstencao1: 51.44, abstencao2: 48.23, caronas: 3, hospedagens: 13 },
  { code: "FI", name: "Finlândia", aptos: 1278, compareceram1: 718, compareceram2: 756, abstencao1: 43.82, abstencao2: 40.85, caronas: 0, hospedagens: 3 },
  { code: "ZA", name: "África do Sul", aptos: 1012, compareceram1: 435, compareceram2: 460, abstencao1: 57.02, abstencao2: 54.55, caronas: 0, hospedagens: 1 },
  { code: "BE", name: "Bélgica", aptos: 10075, compareceram1: 5091, compareceram2: 5326, abstencao1: 49.46, abstencao2: 47.14, caronas: 12, hospedagens: 31 },
  { code: "AE", name: "Emirados Árabes Unidos", aptos: 2988, compareceram1: 1396, compareceram2: 1465, abstencao1: 53.28, abstencao2: 50.97, caronas: 1, hospedagens: 1 },
  { code: "MX", name: "México", aptos: 3959, compareceram1: 1315, compareceram2: 1384, abstencao1: 66.78, abstencao2: 65.04, caronas: 1, hospedagens: 3 },
  { code: "JP", name: "Japão", aptos: 88299, compareceram1: 36627, compareceram2: 37616, abstencao1: 58.52, abstencao2: 57.40, caronas: 6, hospedagens: 0 },
  { code: "UY", name: "Uruguai", aptos: 3163, compareceram1: 1751, compareceram2: 1771, abstencao1: 44.64, abstencao2: 44.01, caronas: 1, hospedagens: 1 },
];

// Países com ofertas e menos de 1.000 eleitores (fora da tabela: poucas dezenas de votos mudam muito a porcentagem).
export const paisesPequenos = ["Angola", "Argélia", "Egito", "Eslováquia", "Eslovênia", "Estônia", "Hong Kong", "Hungria", "Polônia", "Senegal", "Tchéquia", "Turquia"];
