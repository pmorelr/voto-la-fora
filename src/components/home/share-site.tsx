"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Images, MessageCircle } from "lucide-react";
import { useLang, useT } from "@/i18n/client";

// Imagens de story (1080×1920) em public/compartilhar, geradas de divulgacao/stories-curtos/um-story-grafite*.html.
const story = { pt: "/compartilhar/voto-la-fora-story.png", en: "/compartilhar/voto-la-fora-story-en.png" } as const;

/** Compartilhar: a imagem do story (Instagram e outros apps) e uma mensagem pronta no WhatsApp. */
export function ShareSite({ siteUrl }: { siteUrl: string }) {
  const lang = useLang();
  const t = useT();
  const ref = useRef<HTMLElement>(null);
  const file = useRef<File | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const src = story[lang];
  const link = lang === "en" ? `${siteUrl}/en` : siteUrl;
  const message = t(
    `Não tem como ir votar no 2º turno, dia 25/10? O Voto Lá Fora conecta brasileiros no exterior que oferecem uma carona ou um lugar para dormir a quem precisa chegar à seção eleitoral. Encontre ou ofereça ajuda: ${link}`,
    `Voting abroad in Brazil's 2nd round on 25 October and can't get to the polls? Voto Lá Fora connects Brazilians abroad who can offer a ride or a place to sleep with people who need to reach their polling place. Find help or offer it: ${link}`,
  );

  // O celular só abre o compartilhamento logo depois do toque: a imagem é baixada antes, quando a seção aparece.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      fetch(src)
        .then((r) => r.blob())
        .then((b) => { file.current = new File([b], src.split("/").pop()!, { type: "image/png" }); })
        .catch(() => {});
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [src]);

  async function shareStory() {
    setHint(null);
    const f = file.current;
    if (f && navigator.canShare?.({ files: [f] })) {
      try {
        await navigator.share({ files: [f] });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    // Computador ou navegador sem compartilhamento de arquivos: baixa a imagem.
    const a = document.createElement("a");
    a.href = src;
    a.download = src.split("/").pop()!;
    a.click();
    setHint(t("Imagem baixada. Para postar nos stories, abra o Instagram no celular e escolha a imagem.", "Image downloaded. To post it to your story, open Instagram on your phone and pick the image."));
  }

  return (
    <section ref={ref} aria-labelledby="compartilhe" className="mx-auto max-w-6xl px-4 pb-14 md:pb-20">
      <div className="grid items-center gap-6 rounded-2xl border bg-card p-6 sm:grid-cols-[1fr_auto] md:p-8">
        <div>
          <h2 id="compartilhe" className="text-3xl md:text-4xl">{t("Espalhe a ideia", "Spread the word")}</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            {t(
              "Quanto mais gente souber, mais caronas e lugares para dormir aparecem. Poste o story ou mande no WhatsApp para quem vota fora do Brasil.",
              "The more people know, the more rides and places to stay show up. Post the story or send it on WhatsApp to people who vote outside Brazil.",
            )}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={shareStory} className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 font-bold text-primary-foreground transition hover:bg-brand-deep">
              <Images className="size-5" aria-hidden /> {t("Postar nos stories", "Post to your story")}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-md border-[1.5px] border-foreground px-6 font-bold transition hover:bg-secondary">
              <MessageCircle className="size-5" aria-hidden /> {t("Mandar no WhatsApp", "Send on WhatsApp")}
            </a>
          </div>
          {hint && <p role="status" className="mt-3 text-sm text-muted-foreground">{hint}</p>}
        </div>
        <Image src={src} alt={t("Imagem do story: Não tem como ir votar? Caronas e lugares para ficar.", "Story image: Can't get to the polls? Rides and places to stay.")} width={1080} height={1920} sizes="140px" className="mx-auto w-[110px] rounded-xl border shadow-sm sm:w-[140px]" />
      </div>
    </section>
  );
}
