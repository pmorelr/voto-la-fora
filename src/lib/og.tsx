import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { locais } from "@/content/abstencao";
import { tr, type Lang } from "@/i18n";

// Card de prévia de link (WhatsApp, Telegram, Facebook), no estilo "Jornal" do site.
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const RED = "#2b2825"; // cor de destaque do card: grafite, como o site
const INK = "#1f1d1b";
const MUTED = "#6b6560";

async function fonts() {
  const dir = join(process.cwd(), "assets", "fonts");
  const [serif, sans, sansBold] = await Promise.all([
    readFile(join(dir, "Newsreader-SemiBold.ttf")),
    readFile(join(dir, "SourceSans3-Regular.ttf")),
    readFile(join(dir, "SourceSans3-Bold.ttf")),
  ]);
  return [
    { name: "Newsreader", data: serif, weight: 600 as const, style: "normal" as const },
    { name: "Source Sans 3", data: sans, weight: 400 as const, style: "normal" as const },
    { name: "Source Sans 3", data: sansBold, weight: 700 as const, style: "normal" as const },
  ];
}

function Brand({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", fontFamily: "Newsreader", fontSize: size, color: INK, letterSpacing: "-0.02em", lineHeight: 1 }}>Voto Lá Fora</div>
  );
}

/** Card do site inteiro (sem cidade) ou de uma cidade de votação. */
export async function ogImage(city?: string, lang: Lang = "pt") {
  const t = tr(lang);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#fff", fontFamily: "Source Sans 3" }}>
        <div style={{ height: 16, background: RED, display: "flex" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 72px 52px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: RED, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {t("2º turno · domingo, 25 de outubro", "2nd round · Sunday, 25 October")}
            </div>
            {city ? (
              <div style={{ display: "flex", flexDirection: "column", marginTop: 26 }}>
                <div style={{ display: "flex", fontFamily: "Newsreader", fontSize: 128, color: INK, letterSpacing: "-0.02em", lineHeight: 1 }}>{city}</div>
                <div style={{ display: "flex", marginTop: 26, fontSize: 40, color: MUTED, lineHeight: 1.3 }}>
                  {t("Caronas e lugar para dormir para chegar à seção eleitoral.", "Rides and places to sleep to get to the polling station.")}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", marginTop: 30 }}>
                <Brand size={136} />
                <div style={{ display: "flex", marginTop: 30, fontSize: 40, color: MUTED, lineHeight: 1.3, maxWidth: 980 }}>
                  {t("Caronas e lugar para dormir entre brasileiros, para chegar à seção eleitoral no exterior.", "Rides and places to sleep among Brazilians, to get to the polling station abroad.")}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "2px solid #e6e2dd", paddingTop: 26 }}>
            {city ? <Brand size={44} /> : <div style={{ display: "flex", fontSize: 30, color: MUTED }}>{t(`${locais.total} locais de votação em ${locais.paises} países`, `${locais.total} polling places in ${locais.paises} countries`)}</div>}
            <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: RED }}>votolafora.com.br</div>
          </div>
        </div>
      </div>
    ),
    { ...ogSize, fonts: await fonts() },
  );
}
