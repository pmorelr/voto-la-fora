import { NextResponse, type NextRequest } from "next/server";
import { site } from "@/lib/config";
import { updateSession } from "@/lib/supabase/proxy";
import { unprefixed } from "@/i18n";

// Modo manutenção, pela variável MODO_MANUTENCAO na Vercel e novo deploy:
//   "1"        o site inteiro, inclusive formulários, ações do servidor e a rotina diária, mostra só o aviso abaixo;
//   "dominio"  só o domínio próprio mostra o aviso; o endereço *.vercel.app segue com o site completo,
//              e a rotina diária continua rodando (ela exige CRON_SECRET).
// Para voltar: remover a variável e publicar de novo.
const modoManutencao = process.env.MODO_MANUTENCAO;

function emManutencao(request: NextRequest) {
  if (modoManutencao === "1") return true;
  if (modoManutencao !== "dominio") return false;
  const host = (request.headers.get("host") ?? request.nextUrl.hostname).toLowerCase();
  if (host.endsWith(".vercel.app")) return false;
  return !request.nextUrl.pathname.startsWith("/api/cron/");
}

// Rotas que usam a sessão de quem oferece.
const comSessao = ["/ajudar", "/meus-anuncios", "/entrar", "/moderacao"];

// Arquivos da raiz que não passam pelo idioma.
const semIdioma = (path: string) => path.startsWith("/api/") || path === "/robots.txt" || path === "/sitemap.xml";

export async function proxy(request: NextRequest) {
  if (emManutencao(request)) return paginaManutencao();
  const { pathname } = request.nextUrl;
  if (semIdioma(pathname)) return NextResponse.next();

  // /pt/... é só o endereço interno do português: quem chega nele vai para o endereço sem prefixo, para os
  // buscadores não verem a mesma página em dois endereços. Só para páginas abertas no navegador (GET/HEAD sem
  // cabeçalhos de navegação interna do Next), para não atrapalhar ações e pré-carregamentos.
  const interno = request.headers.has("rsc") || request.headers.has("next-action") || request.headers.has("next-router-prefetch");
  if (/^\/pt(\/|$)/.test(pathname) && (request.method === "GET" || request.method === "HEAD") && !interno) {
    const destino = request.nextUrl.clone();
    destino.pathname = pathname.replace(/^\/pt/, "") || "/";
    return NextResponse.redirect(destino, 308);
  }

  // Português sem prefixo: /votar é servido por /pt/votar. Inglês segue como está.
  const prefixed = /^\/(en|pt)(\/|$)/.test(pathname);
  const rewriteTo = prefixed ? undefined : new URL(`/pt${pathname === "/" ? "" : pathname}${request.nextUrl.search}`, request.url);
  const bare = prefixed ? unprefixed(pathname) : pathname;

  if (comSessao.some((p) => bare === p || bare.startsWith(`${p}/`))) return updateSession(request, rewriteTo);
  return rewriteTo ? NextResponse.rewrite(rewriteTo) : NextResponse.next();
}

function paginaManutencao() {
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${site.name} · Voltamos em breve</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:#2b2825;color:#fff}
  main{max-width:34rem}
  h1{font-size:clamp(2.2rem,9vw,3.6rem);line-height:1;margin:0 0 16px;font-weight:900;letter-spacing:-.02em}
  p{font-size:1.125rem;line-height:1.6;margin:0 0 10px}
  a{color:#fff}
</style></head>
<body><main>
  <h1>Voltamos em breve.</h1>
  <p>O ${site.name} está passando por ajustes e volta ao ar em breve.</p>
  <p>Dúvidas: <a href="mailto:contato@votolafora.com.br">contato@votolafora.com.br</a></p>
</main></body></html>`;
  return new NextResponse(html, {
    status: 503,
    headers: { "content-type": "text/html; charset=utf-8", "retry-after": "86400", "cache-control": "no-store" },
  });
}

// Tudo, menos os arquivos estáticos do Next.js e do mapa.
export const config = {
  matcher: ["/((?!_next/static|_next/image|maplibre/|compartilhar/|imprensa/|icon.svg|apple-icon|apple-touch-icon|favicon.ico).*)"],
};
