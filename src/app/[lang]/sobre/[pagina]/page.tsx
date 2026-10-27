import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asLang, lp, tr } from "@/i18n";
import { alternates } from "@/lib/seo";
import { legalPage, legalPages, legalPagesEn, type LegalSlug } from "@/lib/content";

export function generateStaticParams() {
  return Object.keys(legalPages).map((pagina) => ({ pagina }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/sobre/[pagina]">): Promise<Metadata> {
  const { pagina, lang } = await params;
  if (!(pagina in legalPages)) return {};
  return { alternates: alternates(asLang(lang), `/sobre/${pagina}`), title: asLang(lang) === "en" ? legalPagesEn[pagina as LegalSlug] : legalPages[pagina as LegalSlug] };
}

export default async function SobrePagina({ params }: PageProps<"/[lang]/sobre/[pagina]">) {
  const { pagina, lang: raw } = await params;
  const lang = asLang(raw);
  const t = tr(lang);
  if (!(pagina in legalPages)) notFound();
  const page = legalPage(pagina as LegalSlug, lang);
  if (!page) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <nav className="flex flex-wrap gap-2 text-sm">
        {Object.entries(lang === "en" ? legalPagesEn : legalPages).map(([slug, label]) => (
          <Link key={slug} href={lp(lang, `/sobre/${slug}`)} className={`rounded-full border px-3 py-1 ${slug === pagina ? "border-brand bg-accent font-bold text-accent-foreground" : "hover:border-brand"}`}>{label}</Link>
        ))}
      </nav>
      <h1 className="mt-6 text-4xl">{page.title}</h1>
      {page.draft && <p className="mt-4 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground">{t("Rascunho em revisão jurídica. Pode mudar antes do lançamento.", "Draft under legal review. It may change before launch.")}</p>}
      <article className="prose-site mt-6" dangerouslySetInnerHTML={{ __html: page.html }} />
    </main>
  );
}
