import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Newsreader, Source_Sans_3 } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { htmlLang, isLang, langs, tr } from "@/i18n";
import { LangProvider } from "@/i18n/client";
import { site, siteText } from "@/lib/config";
import "../globals.css";

const sans = Source_Sans_3({ variable: "--font-sans", subsets: ["latin"] });
const serif = Newsreader({ variable: "--font-serif", subsets: ["latin"] });

export function generateStaticParams() {
  return langs.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = tr(lang);
  const text = siteText(lang);
  return {
    metadataBase: new URL(site.url),
    title: { default: `${site.name}: ${t("carona e hospedagem para votar", "rides and places to stay to go and vote")}`, template: `%s · ${site.name}` },
    description: text.description,
    openGraph: { title: site.name, description: text.description, locale: lang === "en" ? "en_GB" : "pt_BR", type: "website", siteName: site.name },
    robots: site.indexable ? undefined : { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#171513" },
  ],
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={htmlLang[lang]} className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <LangProvider lang={lang}>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter lang={lang} />
        </LangProvider>
      </body>
    </html>
  );
}
