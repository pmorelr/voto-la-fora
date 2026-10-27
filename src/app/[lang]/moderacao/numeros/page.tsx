import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDashboard, getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Números", robots: { index: false, follow: false } };

type Tipo = {
  anuncios: number; vagas: number; pedidos: number; pendentes: number; confirmados: number; recusados: number;
  vencidos: number; cancelados: number; pessoas_confirmadas: number; anuncios_com_pedido: number; anuncios_com_confirmado: number;
};
type Linha = { nome: string; anuncios: number; caronas: number; hospedagens: number; pedidos: number; confirmados: number };
type Stats = {
  gerado_em: string;
  totais: { anuncios: number; paises: number; cidades: number; quem_oferece: number; quem_pede: number; contas: number; avisos_confirmados: number };
  por_tipo: { ride: Tipo; stay: Tipo };
  por_dia: { dia: string; caronas: number; hospedagens: number; pedidos: number; confirmados: number }[];
  paises: (Linha & { codigo: string })[];
  cidades: (Linha & { slug: string; pais: string })[];
};

const n = (v: number) => v.toLocaleString("pt-BR");
const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : "–");
const diaCurto = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

function Tile({ value, label, sub }: { value: number | string; label: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="font-serif text-3xl font-bold leading-none tabular-nums md:text-4xl">{typeof value === "number" ? n(value) : value}</p>
      <p className="mt-2 text-sm leading-snug text-muted-foreground">{label}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Barra horizontal de magnitude, uma cor só (a do texto). */
function Bar({ label, value, max, note }: { label: string; value: number; max: number; note?: string }) {
  const w = max ? Math.max(value ? 1.5 : 0, (100 * value) / max) : 0;
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm md:grid-cols-[minmax(0,11.5rem)_1fr_auto]" title={`${label}: ${n(value)}${note ? ` (${note})` : ""}`}>
      <span className="order-1 truncate text-muted-foreground">{label}</span>
      <span className="order-3 col-span-2 h-2.5 rounded-sm bg-secondary md:order-2 md:col-span-1"><span className="block h-full rounded-sm bg-foreground" style={{ width: `${w}%` }} /></span>
      <span className="order-2 w-24 text-right tabular-nums md:order-3"><span className="font-semibold">{n(value)}</span>{note && <span className="ml-2 inline-block w-9 text-xs text-muted-foreground">{note}</span>}</span>
    </div>
  );
}

function TipoCard({ titulo, t, unidade }: { titulo: string; t: Tipo; unidade: string }) {
  const max = Math.max(t.anuncios, t.pedidos, 1);
  return (
    <section className="space-y-5 rounded-2xl border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-2xl">{titulo}</h3>
        <p className="text-sm text-muted-foreground">{n(t.vagas)} {unidade}</p>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Dos anúncios</p>
        <Bar label="Anúncios no ar" value={t.anuncios} max={max} />
        <Bar label="Com pelo menos 1 pedido" value={t.anuncios_com_pedido} max={max} note={pct(t.anuncios_com_pedido, t.anuncios)} />
        <Bar label="Com contato feito" value={t.anuncios_com_confirmado} max={max} note={pct(t.anuncios_com_confirmado, t.anuncios)} />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Dos pedidos</p>
        <Bar label="Pedidos feitos" value={t.pedidos} max={max} />
        <Bar label="Confirmados (em contato)" value={t.confirmados} max={max} note={pct(t.confirmados, t.pedidos)} />
        <Bar label="Esperando resposta" value={t.pendentes} max={max} note={pct(t.pendentes, t.pedidos)} />
        <Bar label="Recusados" value={t.recusados} max={max} note={pct(t.recusados, t.pedidos)} />
        <Bar label="Vencidos sem resposta" value={t.vencidos} max={max} note={pct(t.vencidos, t.pedidos)} />
        <Bar label="Cancelados" value={t.cancelados} max={max} note={pct(t.cancelados, t.pedidos)} />
      </div>
      <p className="text-sm text-muted-foreground"><b className="text-foreground">{n(t.pessoas_confirmadas)}</b> {t.pessoas_confirmadas === 1 ? "pessoa já tem" : "pessoas já têm"} vaga confirmada.</p>
    </section>
  );
}

/** Colunas por dia, uma série, com o valor no passar do mouse e rótulo só no maior dia. */
function Daily({ titulo, dados, valor }: { titulo: string; dados: Stats["por_dia"]; valor: (d: Stats["por_dia"][number]) => number }) {
  const vals = dados.map(valor);
  const max = Math.max(...vals, 1);
  const iMax = vals.indexOf(Math.max(...vals));
  const total = vals.reduce((a, b) => a + b, 0);
  return (
    <figure className="rounded-2xl border bg-card p-5">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">{titulo}</span>
        <span className="text-sm text-muted-foreground">{n(total)} no total</span>
      </figcaption>
      <div className="mt-4 flex h-32 items-end gap-[2px]">
        {dados.map((d, i) => (
          <div key={d.dia} className="group relative flex h-full flex-1 flex-col justify-end" title={`${diaCurto(d.dia)}: ${n(vals[i])}`}>
            {i === iMax && vals[i] > 0 && <span className="mb-1 text-center text-xs font-semibold tabular-nums">{n(vals[i])}</span>}
            <span className="block rounded-t-[4px] bg-foreground/85 group-hover:bg-foreground" style={{ height: `${(100 * vals[i]) / max}%`, minHeight: vals[i] ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between border-t pt-1 text-xs text-muted-foreground">
        <span>{diaCurto(dados[0].dia)}</span>
        <span>{diaCurto(dados[dados.length - 1].dia)}</span>
      </div>
    </figure>
  );
}

function Tabela({ linhas, primeira, extra }: { linhas: Linha[]; primeira: string; extra?: (l: Linha) => string }) {
  const max = Math.max(...linhas.map((l) => l.anuncios), 1);
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full min-w-[34rem] text-sm">
        <thead className="text-left text-xs uppercase tracking-[0.06em] text-muted-foreground">
          <tr className="border-b"><th className="p-3">{primeira}</th><th className="p-3">Anúncios</th><th className="p-3 text-right">Caronas</th><th className="p-3 text-right">Hospedagens</th><th className="p-3 text-right">Pedidos</th><th className="p-3 text-right">Em contato</th></tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.nome + (extra?.(l) ?? "")} className="border-b last:border-0">
              <td className="p-3 font-semibold">{l.nome}{extra && <span className="ml-1 font-normal text-muted-foreground">{extra(l)}</span>}</td>
              <td className="p-3"><span className="flex items-center gap-2"><span className="h-2 w-24 rounded-sm bg-secondary"><span className="block h-full rounded-sm bg-foreground" style={{ width: `${(100 * l.anuncios) / max}%` }} /></span><span className="tabular-nums">{n(l.anuncios)}</span></span></td>
              <td className="p-3 text-right tabular-nums">{n(l.caronas)}</td>
              <td className="p-3 text-right tabular-nums">{n(l.hospedagens)}</td>
              <td className="p-3 text-right tabular-nums">{n(l.pedidos)}</td>
              <td className="p-3 text-right tabular-nums">{n(l.confirmados)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function NumerosPage() {
  const session = await getSession();
  if (!session.authed || !session.hasProfile) notFound();
  const dash = await getDashboard();
  if (!dash.profile?.is_admin) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_stats");
  if (error) throw error;
  const s = data as unknown as Stats;
  const { ride, stay } = s.por_tipo;
  const pedidos = ride.pedidos + stay.pedidos;
  const confirmados = ride.confirmados + stay.confirmados;
  const hora = new Date(s.gerado_em).toLocaleString("pt-BR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-10 md:py-14">
      <div>
        <Link href="/moderacao" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Moderação</Link>
        <h1 className="mt-3 text-4xl">Números</h1>
        <p className="mt-2 text-muted-foreground">Atualizado a cada visita: {hora}, hora de Paris. Só conta anúncios no ar ou lotados, sem cancelados, removidos ou de contas banidas.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl">Visão geral</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile value={s.totais.anuncios} label="anúncios no ar" />
          <Tile value={ride.anuncios} label="caronas" sub={`${n(ride.vagas)} vagas nos carros`} />
          <Tile value={stay.anuncios} label="lugares para dormir" sub={`para até ${n(stay.vagas)} pessoas`} />
          <Tile value={s.totais.paises} label="países com anúncio" sub={`${n(s.totais.cidades)} cidades de votação`} />
          <Tile value={pedidos} label="pedidos de vaga" sub={`de ${n(s.totais.quem_pede)} pessoas diferentes`} />
          <Tile value={confirmados} label="contatos feitos" sub={`${pct(confirmados, pedidos)} dos pedidos`} />
          <Tile value={s.totais.quem_oferece} label="pessoas que oferecem" sub={`${n(s.totais.contas)} contas criadas`} />
          <Tile value={s.totais.avisos_confirmados} label='inscrições no "Me avise"' sub="confirmadas" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Pedidos e contatos</h2>
        <p className="max-w-3xl text-muted-foreground">“Em contato” quer dizer que quem oferece confirmou o pedido e passou a ver o WhatsApp de quem pediu.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <TipoCard titulo="Caronas" t={ride} unidade="vagas oferecidas" />
          <TipoCard titulo="Hospedagens" t={stay} unidade="lugares oferecidos" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Dia a dia</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Daily titulo="Caronas novas" dados={s.por_dia} valor={(d) => d.caronas} />
          <Daily titulo="Hospedagens novas" dados={s.por_dia} valor={(d) => d.hospedagens} />
          <Daily titulo="Pedidos de vaga" dados={s.por_dia} valor={(d) => d.pedidos} />
          <Daily titulo="Contatos feitos" dados={s.por_dia} valor={(d) => d.confirmados} />
        </div>
        <details className="rounded-xl border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Ver em tabela</summary>
          <table className="mt-3 w-full tabular-nums">
            <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-1">Dia</th><th className="text-right">Caronas</th><th className="text-right">Hospedagens</th><th className="text-right">Pedidos</th><th className="text-right">Contatos</th></tr></thead>
            <tbody>{s.por_dia.map((d) => <tr key={d.dia} className="border-t"><td className="py-1">{diaCurto(d.dia)}</td><td className="text-right">{d.caronas}</td><td className="text-right">{d.hospedagens}</td><td className="text-right">{d.pedidos}</td><td className="text-right">{d.confirmados}</td></tr>)}</tbody>
          </table>
        </details>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Por país</h2>
        <Tabela linhas={s.paises} primeira="País" />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Cidades de votação com mais anúncios</h2>
        <Tabela linhas={s.cidades.slice(0, 20)} primeira="Cidade" extra={(l) => (l as Stats["cidades"][number]).pais} />
        {s.cidades.length > 20 && <p className="text-sm text-muted-foreground">Mais {s.cidades.length - 20} cidades com anúncio.</p>}
      </section>
    </main>
  );
}
