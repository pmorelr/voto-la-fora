// Extrai os locais de votação do exterior do arquivo oficial do TSE "Eleitorado por local de votação 2026"
// e grava content/dados/tse-locais-2026.json, que é a fonte dos locais do site (scripts/build-cidades.mjs).
// O TSE atualiza o arquivo até a eleição: rode de novo e confira o `git diff` do JSON.
// Uso: node scripts/tse-locais.mjs [caminho do .zip já baixado]
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const URL_ZIP = "https://cdn.tse.jus.br/estatistica/sead/odsele/eleitorado_locais_votacao/eleitorado_local_votacao_2026.zip";
const CSV_ZZ = "eleitorado_local_votacao_2026_ZZ.csv";
const OUT = "content/dados/tse-locais-2026.json";
const TURNO = "2";

let zip = process.argv[2];
if (!zip) {
  zip = path.join(tmpdir(), "eleitorado_local_votacao_2026.zip");
  console.log(`baixando ${URL_ZIP} (cerca de 175 MB)…`);
  const res = await fetch(URL_ZIP);
  if (!res.ok) throw new Error(`TSE respondeu ${res.status}`);
  writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
  console.log(`arquivo do TSE de ${res.headers.get("last-modified")}`);
}
if (!existsSync(zip)) throw new Error(`não achei ${zip}`);

// O CSV do TSE vem em Latin-1, separado por ponto e vírgula, com aspas.
const texto = new TextDecoder("latin1").decode(execFileSync("unzip", ["-p", zip, CSV_ZZ], { maxBuffer: 1 << 28 }));
function linhas(s) {
  const out = [];
  let campo = "", linha = [], aspas = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (aspas) {
      if (c === '"' && s[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ";") { linha.push(campo); campo = ""; }
    else if (c === "\n") { linha.push(campo.replace(/\r$/, "")); out.push(linha); linha = []; campo = ""; }
    else campo += c;
  }
  if (campo || linha.length) { linha.push(campo); out.push(linha); }
  return out;
}
const [cab, ...dados] = linhas(texto);
const secoes = dados.filter((l) => l.length === cab.length).map((l) => Object.fromEntries(cab.map((k, i) => [k, l[i].trim()])));
const doTurno = secoes.filter((s) => s.NR_TURNO === TURNO);
if (!doTurno.length) throw new Error(`nenhuma seção do ${TURNO}º turno no arquivo`);

// Seção agregada vota onde vota a sua seção principal. Por isso o local vem da principal: "AARHUS" ou "FLORENÇA"
// são grupos de eleitores, não lugares.
const chave = (s, secao) => `${s.CD_MUNICIPIO}|${s.NR_ZONA}|${secao}`;
const porSecao = new Map(doTurno.map((s) => [chave(s, s.NR_SECAO), s]));
const normal = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");

const municipios = {};
for (const s of doTurno) {
  const principal = s.NR_SECAO_PRINCIPAL !== "-1" ? porSecao.get(chave(s, s.NR_SECAO_PRINCIPAL)) ?? s : s;
  // Um mesmo prédio aparece com mais de um número de local (Edimburgo) ou com grafias diferentes (Melbourne):
  // o endereço identifica o lugar.
  const id = normal(principal.DS_ENDERECO).slice(0, 40) || normal(principal.NM_LOCAL_VOTACAO);
  const locais = (municipios[s.NM_MUNICIPIO] ??= {});
  const l = (locais[id] ??= { local: principal.NM_LOCAL_VOTACAO, endereco: principal.DS_ENDERECO, eleitores: 0, secoes: 0 });
  l.eleitores += +s.QT_ELEITOR_SECAO;
  if (s.NR_SECAO_PRINCIPAL === "-1") l.secoes += 1;
}

const saida = {
  fonte: `TSE, dados abertos, "Eleitorado por local de votação 2026" (${URL_ZIP}), UF ZZ, ${TURNO}º turno`,
  gerado_pelo_tse_em: `${doTurno[0].DT_GERACAO} ${doTurno[0].HH_GERACAO}`,
  turno: +TURNO,
  municipios: Object.fromEntries(
    Object.entries(municipios)
      .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
      .map(([m, ls]) => [m, Object.values(ls).sort((a, b) => b.eleitores - a.eleitores)]),
  ),
};
writeFileSync(OUT, JSON.stringify(saida, null, 1) + "\n");
const n = Object.values(saida.municipios).flat().length;
console.log(`${OUT}: ${Object.keys(saida.municipios).length} municípios, ${n} locais, ${doTurno.length} seções (TSE, ${saida.gerado_pelo_tse_em})`);
