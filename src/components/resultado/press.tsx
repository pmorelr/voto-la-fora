import { ArrowUpRight } from "lucide-react";
import { tr, type Lang } from "@/i18n";
import { materias, videos } from "@/content/imprensa";

const data = (iso: string, lang: Lang) =>
  new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "pt-BR", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));

/** "Na imprensa": os vídeos primeiro, depois as matérias, com manchete, veículo e trechos que citam o site. */
export function Press({ lang }: { lang: Lang }) {
  const t = tr(lang);
  return (
    <div className="space-y-8">
      {videos.map((v) => (
        <figure key={v.arquivo} className="overflow-hidden rounded-2xl border bg-card">
          <video controls preload="metadata" playsInline poster={`/imprensa/${v.arquivo}.jpg`} className="aspect-video w-full bg-black">
            <source src={`/imprensa/${v.arquivo}.mp4`} type="video/mp4" />
            {(["pt", "en"] as const).map((l) => (
              <track key={l} kind="subtitles" srcLang={l} src={`/imprensa/${v.arquivo}.${l}.vtt`} label={l === "pt" ? "Português" : "English"} default={l === lang} />
            ))}
          </video>
          <figcaption className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-text">
              {v.veiculo} <span className="font-semibold text-muted-foreground normal-case tracking-normal">· {v.programa} · {data(v.data, lang)}</span>
            </p>
            <p className="mt-1 font-serif text-xl font-bold">{v.titulo[lang]}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {v.descricao[lang]}{" "}
              <a href={v.original} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground underline">{t("Ver no programa completo", "Watch in the full programme")}</a>
            </p>
          </figcaption>
        </figure>
      ))}

      <ul className="grid gap-4 md:grid-cols-2">
        {materias.map((m) => (
          <li key={m.url} className="flex flex-col rounded-2xl border bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-text">
              {m.veiculo} <span className="font-semibold text-muted-foreground normal-case tracking-normal">· {data(m.data, lang)}</span>
            </p>
            <a href={m.url} target="_blank" rel="noopener noreferrer" className="group mt-2 font-serif text-xl font-bold leading-snug hover:underline">
              {m.titulo} <ArrowUpRight className="inline size-4 align-baseline text-muted-foreground transition group-hover:text-foreground" />
            </a>
            {m.autor && <p className="mt-1 text-sm text-muted-foreground">{t(`Por ${m.autor}`, `By ${m.autor}`)}</p>}
            <p className="mt-4 text-[15px] leading-relaxed">{m.trecho[lang]}</p>
            <blockquote className="mt-4 border-l-2 border-primary/40 pl-4 font-serif text-lg italic leading-snug">“{m.citacao}”</blockquote>
            {m.tambem && (
              <p className="mt-auto pt-4 text-sm text-muted-foreground">
                {t("Publicada também em", "Also published by")}{" "}
                {m.tambem.map((x, i) => (
                  <span key={x.url}>
                    {i > 0 && (i === m.tambem!.length - 1 ? t(" e ", " and ") : ", ")}
                    <a href={x.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground underline">{x.veiculo}</a>
                  </span>
                ))}
              </p>
            )}
          </li>
        ))}
      </ul>
      {lang === "en" && <p className="text-sm text-muted-foreground">All articles are in Portuguese; quotes are shown in the original.</p>}
    </div>
  );
}
