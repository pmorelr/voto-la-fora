# Dados do voto no exterior

## Fonte

Resultados oficiais do TSE, 1º turno de 04/10/2026, eleição 6257, cargo Presidente. Lidos em 06/10/2026 dos arquivos públicos de resultados.tse.jus.br:

- `oficial/ele2026/6257/config/mun-e006257-cm.jws`: lista das 186 cidades do exterior (UF "ZZ") com o código TSE.
- `oficial/ele2026/6257/dados/zz/zz<código>-c0001-e006257-u.jws`: eleitorado, comparecimento e abstenção de cada cidade.
- `oficial/ele2026/6257/dados/zz/zz-c0001-e006257-u.jws` e `.../dados/br/br-c0001-e006257-u.jws`: totais do exterior e do país.

Os arquivos `.jws` são JSON assinado. O conteúdo é a parte do meio, em base64url.

Comparação com 2022: dados abertos do TSE em cdn.tse.jus.br/estatistica/sead/odsele (`detalhe_votacao_munzona_2022` e `votacao_partido_munzona_2022`, UF "ZZ", cargo Presidente), lidos em 07/10/2026.

| Exterior, 2022 | Aptos | Compareceram | Abstenção |
|---|---|---|---|
| 1º turno | 695.355 | 304.032 | 56,19% |
| 2º turno | 695.578 | 310.148 | 55,33% |

No 2º turno de 2022, o candidato mais votado no exterior teve 152.905 votos válidos, e o segundo, 145.264. A diferença foi de 7.641 votos.

Locais de votação: dados abertos do TSE, "Eleitorado por local de votação 2026" (cdn.tse.jus.br/estatistica/sead/odsele/eleitorado_locais_votacao/eleitorado_local_votacao_2026.zip), UF ZZ, 2º turno. O TSE atualiza o arquivo até a eleição; a versão em uso foi gerada pelo TSE em 08/10/2026. `node scripts/tse-locais.mjs` baixa de novo e grava `tse-locais-2026.json`; depois `node scripts/build-cidades.mjs` e conferir o `git diff`.

Uma seção agregada vota onde vota a sua seção principal. Por isso nomes como "AARHUS", "FLORENÇA" ou "CAVAN" não são lugares: são grupos de eleitores que votam na embaixada ou no consulado. O endereço identifica o prédio.

São 164 locais em 102 países: 144 cidades do TSE com seção e 20 locais em outras cidades (Hamburgo na seção de Berlim, Colônia na de Frankfurt e outros, em `satelites` de `scripts/cidades-base.mjs`). Os eleitores de Ciudad Guayana votam na Embaixada em Caracas, e os de Trípoli, na Embaixada em Túnis: essas duas cidades não viram destino, e a cidade anfitriã ganha uma observação. 40 cidades do TSE não tiveram votação instalada no 1º turno (zero comparecimento e zero abstenção) e aparecem em /votar com a orientação de justificar a ausência.

Até 08/10/2026 os locais vinham de uma planilha de planejamento ("Seções Eleitorais Exterior"), repassada por um contato em 07/10/2026. Ela não era do TSE e trazia locais que não existem: Manchester (eleitores da região que votam em Edimburgo, confirmado pelo consulado no Reino Unido em 08/10) e Hyannis (os eleitores votam em Framingham). As duas linhas ficam desligadas no banco (`desativados` em `scripts/cidades-base.mjs`). A planilha também tinha nomes de local errados (Córdoba, Salto del Guairá, Bahrein, Haiti) e contagens de eleitores de outra versão do cadastro.

## 2º turno (25/10/2026)

Resultados oficiais do TSE, eleição 6258 (2º turno), cargo Presidente, lidos em 26/10/2026 dos mesmos arquivos públicos de resultados.tse.jus.br (`oficial/ele2026/6258/dados/zz/...`), com 100% das seções totalizadas. Exterior: 916.683 aptos, 381.443 compareceram, abstenção de 58,37% (62,69% no 1º turno). `tse-exterior-2turno-2026.csv` traz, por cidade, os aptos e o comparecimento nos dois turnos. A página "Resultado" usa `src/content/resultado.ts`, que guarda também as contagens do site em 26/10/2026 (os dados do site são apagados até 15/11).

## Arquivos

- `tse-locais-2026.json`: locais de votação do 2º turno por cidade do TSE (nome e endereço como o TSE registra, eleitores, seções), extraídos do arquivo do TSE por `scripts/tse-locais.mjs`.
- `tse-exterior-1turno-2026.csv`: uma linha por cidade. Colunas: cidade, código TSE, aptos, compareceram, abstenção, abstenção em %.
- 40 cidades pequenas aparecem com zero comparecimento e zero abstenção. Somam 423 eleitores e são lugares onde a seção não foi instalada.

## Totais oficiais

| | Aptos | Compareceram | Abstenção |
|---|---|---|---|
| Exterior | 916.534 | 341.766 | 62,69% |
| Total do país | 158.745.502 | 125.275.835 | 21,08% |

## Por país, em ordem de eleitorado

| País | Cidades com seção | Aptos | Abstenção |
|---|---|---|---|
| Estados Unidos | 11 | 265.022 | 71,6% |
| Portugal | 3 (Lisboa, Porto, Faro) | 134.374 | 61,5% |
| Japão | 3 (Nagoia, Tóquio, Hamamatsu) | 88.293 | 58,5% |
| Canadá | 4 | 46.345 | 51,6% |
| Reino Unido | 2 (Londres, Edimburgo) | 41.895 | 63,0% |
| Alemanha | 3 (Berlim, Munique, Frankfurt) | 41.401 | 53,5% |
| Espanha | 2 (Madri, Barcelona) | 40.718 | 70,5% |
| Itália | 2 (Milão, Roma) | 38.747 | 68,8% |
| França metropolitana | 2 (Paris, Marselha) | 29.617 | 61,5% |
| Suíça | 2 (Zurique, Genebra) | 26.982 | 58,4% |
| Austrália | 2 (Sydney, Camberra) | 20.274 | 58,6% |
| Irlanda | 1 (Dublin) | 16.720 | 49,7% |
| Argentina | 5 | 13.004 | 54,2% |
| Países Baixos | 1 (Amsterdã) | 12.752 | 49,4% |
| Bélgica | 1 (Bruxelas) | 10.073 | 49,5% |
| Paraguai | 6 | 9.207 | 48,1% |
| Suécia | 1 (Estocolmo) | 4.866 | 46,4% |
| Áustria | 1 (Viena) | 3.134 | 51,4% |
| Dinamarca | 1 (Copenhague) | 2.856 | 46,7% |
| Noruega | 1 (Oslo) | 2.185 | 58,4% |

Caiena e Saint-Georges-de-l'Oyapock ficam na Guiana Francesa e não entram na linha da França metropolitana.

## Cuidados de leitura

- Abstenção alta não vem só da distância. Há cadastros de quem já voltou ao Brasil e não transferiu o título. Nos Estados Unidos, a imprensa registrou medo de fiscalização migratória e a mudança do local de votação em Nova York.
- O padrão, porém, é consistente: países pequenos ou bem servidos por trem, com uma seção alcançável, ficam perto de 50%. Países grandes com duas seções passam de 60% e chegam a 70%.
