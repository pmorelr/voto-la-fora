import { tr, type Lang } from "@/i18n";
import type { Story } from "@/lib/data";

/** Mural "Quem foi votar": relatos aprovados, como a pessoa escreveu, com nome e cidade se ela informou. */
export function Stories({ stories, lang }: { stories: Story[]; lang: Lang }) {
  const t = tr(lang);
  return (
    <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
      {stories.map((s) => (
        <figure key={s.id} className="mb-4 break-inside-avoid rounded-2xl border bg-card p-6">
          <blockquote className="whitespace-pre-line text-[17px] leading-relaxed">{s.body}</blockquote>
          <figcaption className="mt-4 text-sm font-bold">
            {s.first_name || t("Anônimo", "Anonymous")}
            {s.city && <span className="font-normal text-muted-foreground">, {s.city}</span>}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
