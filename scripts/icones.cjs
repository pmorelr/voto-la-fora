/* eslint-disable @typescript-eslint/no-require-imports -- script CommonJS de linha de comando (node scripts/icones.cjs) */
// Ícone do Voto Lá Fora (opção A, 10/10/2026): V do título (Newsreader SemiBold) branco-creme no quadrado grafite.
// Uso: node scripts/icones.cjs (precisa de opentype.js: npm i --no-save opentype.js@1)
const path = require("path");
const RAIZ = path.resolve(__dirname, "..");
const ot = require("opentype.js");
const fs = require("fs");
const sharp = require("sharp");
const f = ot.loadSync(RAIZ + "/assets/fonts/Newsreader-SemiBold.ttf");
const g = f.charToGlyph("V");
const BG = "#2b2825", FG = "#fbfaf8";

// V centrado num quadro de 100: escala 0,039 (como na proposta, corpo 78), centro óptico um pouco acima do meio.
function vPath(size, cx, cy) {
  const s = size / f.unitsPerEm;
  const bb = g.getBoundingBox();
  const x = cx - ((bb.x1 + bb.x2) / 2) * s;
  const y = cy + ((bb.y1 + bb.y2) / 2) * s; // em SVG o y cresce para baixo
  return g.getPath(x, y, size).toPathData(2);
}
const icone = (rx) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100"${rx ? ` rx="${rx}"` : ""} fill="${BG}"/><path d="${vPath(78, 50, 48)}" fill="${FG}"/></svg>`;

(async () => {
  const svgAba = icone(22);
  fs.writeFileSync(RAIZ + "/src/app/icon.svg", svgAba + "\n");
  // Ícones em PNG: favicon (16, 32, 48) com cantos arredondados; tela inicial do iPhone (180) sem cantos, o iOS arredonda.
  const png = (svg, n) => sharp(Buffer.from(svg), { density: 600 }).resize(n, n).png().toBuffer();
  const tamanhos = [16, 32, 48];
  const pngs = await Promise.all(tamanhos.map((n) => png(svgAba, n)));
  // .ico com PNGs dentro (aceito por todos os navegadores atuais).
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let off = head.length;
  pngs.forEach((b, i) => {
    const e = 6 + 16 * i, n = tamanhos[i];
    head.writeUInt8(n, e); head.writeUInt8(n, e + 1); head.writeUInt8(0, e + 2); head.writeUInt8(0, e + 3);
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6); head.writeUInt32LE(b.length, e + 8); head.writeUInt32LE(off, e + 12);
    off += b.length;
  });
  fs.writeFileSync(RAIZ + "/src/app/favicon.ico", Buffer.concat([head, ...pngs]));
  const apple = await png(icone(0), 180);
  fs.writeFileSync(RAIZ + "/src/app/apple-icon.png", apple);
  fs.writeFileSync(RAIZ + "/public/apple-touch-icon.png", apple);
  fs.writeFileSync(RAIZ + "/public/apple-touch-icon-precomposed.png", apple);
  // Instagram: capa de destaque (1080×1920, o círculo fica no centro) e versão quadrada.
  const ig = (w, h, size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${BG}"/><path d="${vPath(size, w / 2, h / 2 - size * 0.02)}" fill="${FG}"/></svg>`;
  fs.mkdirSync(RAIZ + "/divulgacao/instagram", { recursive: true });
  await sharp(Buffer.from(ig(1080, 1920, 760))).png().toFile(RAIZ + "/divulgacao/instagram/destaque-voto-la-fora.png");
  await sharp(Buffer.from(ig(1080, 1080, 760))).png().toFile(RAIZ + "/divulgacao/instagram/icone-voto-la-fora-1080.png");
  fs.writeFileSync(RAIZ + "/divulgacao/instagram/icone-voto-la-fora.svg", icone(0) + "\n");
  console.log("ok");
})();
