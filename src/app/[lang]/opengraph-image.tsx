import { asLang } from "@/i18n";
import { ogContentType, ogImage, ogSize } from "@/lib/og";

export const alt = "Voto Lá Fora";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  return ogImage(undefined, asLang((await params).lang));
}
