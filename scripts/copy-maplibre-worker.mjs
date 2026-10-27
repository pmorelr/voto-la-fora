// O MapLibre 6 roda o desenho do mapa num worker em módulo separado, que o empacotador
// do Next não resolve. Copiamos o worker e a parte compartilhada para public/maplibre.
import { copyFileSync, mkdirSync } from "node:fs";

const from = "node_modules/maplibre-gl/dist";
const to = "public/maplibre";
mkdirSync(to, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) copyFileSync(`${from}/${file}`, `${to}/${file}`);
