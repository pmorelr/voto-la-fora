import type { MetadataRoute } from "next";
import { site } from "@/lib/config";

// Até o lançamento, nada entra nos buscadores. Para liberar: PERMITIR_INDEXACAO=1 e novo deploy.
// As páginas de cidade e de pedido têm noindex próprio, porque mostram anúncios.
// Os leitores de prévia de link (WhatsApp, Facebook, Telegram etc.) podem ler sempre, para o card aparecer.
const previews = ["facebookexternalhit", "Facebot", "WhatsApp", "TelegramBot", "Twitterbot", "LinkedInBot", "Slackbot", "Discordbot"];

// Páginas de conta, moderação, pedidos e avisos: nunca nos buscadores, em nenhum idioma.
const privadas = ["/entrar", "/meus-anuncios", "/moderacao", "/pedido/", "/aviso/"];

export default function robots(): MetadataRoute.Robots {
  if (!site.indexable) return { rules: [{ userAgent: previews, allow: "/" }, { userAgent: "*", disallow: "/" }] };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", ...privadas, ...privadas.map((p) => `/en${p}`)],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
