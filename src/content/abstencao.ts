import dados from "../../content/dados/cidades.json";
import type { Lang } from "@/i18n";
import { cityName, countryName } from "@/i18n/data";

// Dados oficiais do TSE (1º turno de 2026) agregados por país. Fonte em content/dados/README.md.
export const totais = {
  exterior: { aptos: 916534, compareceram: 341766, abstencao: 62.69 },
  pais: { abstencao: 21.08 },
};

// Dados abertos do TSE de 2022 (detalhe e votação por partido, UF ZZ, cargo Presidente). Fonte em content/dados/README.md.
export const exterior2022 = {
  turno1: { aptos: 695355, compareceram: 304032, abstencao: 56.19 },
  // Os dois candidatos do 2º turno tiveram 152.905 e 145.264 votos válidos no exterior.
  turno2Diferenca: 7641,
};

// Locais de votação no exterior em 2026 (eleitorado por local de votação do TSE): cidades do TSE com seção mais os
// locais extras.
const comSecao = [...dados.cidades.filter((c) => c.has_section), ...dados.locais_extras];
export const locais = { total: comSecao.length, paises: new Set(comSecao.map((c) => c.country_code)).size };

const destaque = ["ES", "IT", "GB", "FR", "PT", "CH", "DE", "IE", "BE", "NL", "US", "JP"];

export type LinhaPais = { code: string; name: string; cities: string[]; aptos: number; compareceram: number; abstencao: number };

export function paisesEmDestaque(lang: Lang = "pt"): LinhaPais[] {
  return destaque
    .map((code) => {
      const p = dados.paises.find((x) => x.code === code)!;
      const cities = [...dados.cidades.filter((c) => c.country_code === code && c.has_section), ...dados.locais_extras.filter((c) => c.country_code === code)].map((c) => cityName(lang, c.slug, c.name));
      return { code, name: countryName(lang, p.name), cities, aptos: p.voters, compareceram: p.turnout, abstencao: p.abstention_pct ?? 0 };
    })
    .sort((a, b) => b.abstencao - a.abstencao);
}

// Distâncias em linha reta, calculadas pelas coordenadas das cidades. Por estrada é mais.
export const distancias = [
  { origem: "Toulouse", destino: "Paris 590 km, Marselha 320 km", origemEn: "Toulouse", destinoEn: "Paris 590 km, Marseille 320 km" },
  { origem: "Bordeaux", destino: "Paris ou Marselha, 500 km", origemEn: "Bordeaux", destinoEn: "Paris or Marseille, 500 km" },
  { origem: "Estrasburgo", destino: "Paris, 400 km", origemEn: "Strasbourg", destinoEn: "Paris, 400 km" },
  { origem: "Sevilha", destino: "Madri, 390 km", origemEn: "Seville", destinoEn: "Madrid, 390 km" },
  { origem: "Palermo", destino: "Roma, 430 km", origemEn: "Palermo", destinoEn: "Rome, 430 km" },
  { origem: "Nantes", destino: "Paris, 340 km", origemEn: "Nantes", destinoEn: "Paris, 340 km" },
  { origem: "Bari", destino: "Roma, 375 km", origemEn: "Bari", destinoEn: "Rome, 375 km" },
];
