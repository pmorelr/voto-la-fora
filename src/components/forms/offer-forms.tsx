"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LiabilityNotice } from "@/components/forms/liability-notice";
import { Info } from "lucide-react";
import { saveRideAction, saveStayAction, type RideInput, type StayInput } from "@/app/actions/offers";
import { AuthStep } from "@/components/forms/auth-step";
import { CitySelect } from "@/components/forms/city-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { election } from "@/lib/config";
import type { FormCountry } from "@/lib/data";
import { isGroupTrip, nightLabel } from "@/lib/format";
import { lp } from "@/i18n";
import { useLang, useT } from "@/i18n/client";

type Session = { authed: boolean; hasProfile: boolean };
type Saved = { ok: true; id: string; citySlug: string } | { ok: false; message: string };

function Rules({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl bg-accent p-4 text-sm text-accent-foreground">
      <Info className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">{children}</div>
    </div>
  );
}

/** Parte comum: publica direto se a pessoa já tem conta; senão, pede o e-mail e o código antes. */
function useOfferSubmit(session: Session, save: () => Promise<Saved>, editing: boolean) {
  const router = useRouter();
  const lang = useLang();
  const [stage, setStage] = useState<"form" | "auth">("form");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const publish = () =>
    start(async () => {
      setError(null);
      const r = await save();
      if (!r.ok) {
        setStage("form");
        return setError(r.message);
      }
      router.push(lp(lang, editing ? "/meus-anuncios" : `/meus-anuncios?novo=${r.id}`));
      router.refresh();
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (session.authed && session.hasProfile) publish();
    else setStage("auth");
  };

  return { stage, error, pending, submit, publish };
}

function AuthPanel({ session, onDone }: { session: Session; onDone: () => void }) {
  const t = useT();
  return (
    <div className="space-y-3 rounded-2xl border border-brand/40 bg-card p-5">
      <h2 className="text-xl">{t("Falta só confirmar quem você é", "Just confirm who you are")}</h2>
      <AuthStep onDone={onDone} needsProfileOnly={session.authed && !session.hasProfile} submitLabel={t("Publicar", "Publish")} />
    </div>
  );
}

export function RideForm({ countries, session, initial, editingId }: { countries: FormCountry[]; session: Session; initial: RideInput & { country: string }; editingId?: string }) {
  const [v, setV] = useState(initial);
  const [ack, setAck] = useState(false);
  const lang = useLang();
  const t = useT();
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((old) => ({ ...old, [k]: value }));
  const { stage, error, pending, submit, publish } = useOfferSubmit(session, () => saveRideAction({ ...v, ack }, editingId, lang), Boolean(editingId));
  const group = isGroupTrip(v.vehicle);
  const ways = [
    ["car", t("Carro", "Car")],
    ["van", "Van"],
    ["train", t("Trem, em grupo", "Train, as a group")],
    ["bus", t("Ônibus de linha, em grupo", "Scheduled bus, as a group")],
  ] as const;

  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={stage === "auth" || Boolean(editingId)} className="contents">
        <CitySelect countries={countries} country={v.country} city={v.citySlug} onChange={(country, city) => setV((o) => ({ ...o, country, citySlug: city }))} />
      </fieldset>
      <fieldset disabled={stage === "auth"} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="origin">{t("Cidade de onde você sai", "City you’re leaving from")}</Label>
          <Input id="origin" required maxLength={80} value={v.originCity} onChange={(e) => set("originCity", e.target.value)} placeholder={t("Ex.: Lyon", "E.g. Lyon")} className="h-11" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="departDate">{t("Dia da saída", "Departure date")}</Label>
            <Input id="departDate" type="date" required min={election.departMin} max={election.departMax} value={v.departDate} onChange={(e) => set("departDate", e.target.value)} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="departTime">{t("Hora da saída, no horário local", "Departure time, local time")}</Label>
            <Input id="departTime" type="time" required value={v.departTime} onChange={(e) => set("departTime", e.target.value)} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="returnDate">{t("Dia da volta, se houver", "Return date, if any")}</Label>
            <Input id="returnDate" type="date" min={election.departMin} max={election.departMax} value={v.returnDate} onChange={(e) => set("returnDate", e.target.value)} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="returnTime">{t("Hora da volta", "Return time")}</Label>
            <Input id="returnTime" type="time" value={v.returnTime} onChange={(e) => set("returnTime", e.target.value)} className="h-11" />
          </div>
        </div>
        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">{t("Como vocês vão", "How you’re travelling")}</legend>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:flex sm:flex-wrap">
            {ways.map(([k, label]) => (
              <label key={k} className="flex items-center gap-1.5">
                <input type="radio" name="vehicle" checked={v.vehicle === k} onChange={() => set("vehicle", k)} className="size-4 accent-[var(--brand)]" /> {label}
              </label>
            ))}
          </div>
          {group && (
            <p className="rounded-lg border border-dashed border-foreground/40 px-3 py-2 text-sm">
              {t(
                "Só transporte público regular, como trem ou ônibus de linha. Cada pessoa compra a própria passagem: ninguém paga a viagem de ninguém. Nada de ônibus fretado, van alugada ou transporte contratado.",
                "Only regular public transport, such as trains or scheduled buses. Everyone buys their own ticket: nobody pays for anyone else's trip. No chartered coaches, hired vans or paid transport.",
              )}
            </p>
          )}
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="seats">{group ? t("Vagas no grupo, sem contar você", "Places in the group, not counting you") : t("Vagas livres, sem contar você", "Free seats, not counting you")}</Label>
            <select id="seats" value={String(v.seats)} onChange={(e) => set("seats", Number(e.target.value))} className="h-11 w-full rounded-lg border border-input bg-background px-3">
              {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="meeting">{t("Ponto de encontro aproximado", "Approximate meeting point")}</Label>
          <Input id="meeting" maxLength={140} value={v.meetingHint} onChange={(e) => set("meetingHint", e.target.value)} placeholder={group ? t("Ex.: na entrada da estação de Nijmegen", "E.g. at the entrance of Nijmegen station") : t("Ex.: perto da estação Part-Dieu", "E.g. near Part-Dieu station")} className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">{t("Observações", "Notes")}</Label>
          <Textarea id="notes" maxLength={500} rows={3} value={v.notes} onChange={(e) => set("notes", e.target.value)} placeholder={t("Ex.: tem espaço para uma mala pequena por pessoa", "E.g. room for one small suitcase per person")} />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={v.womenOnly} onChange={(e) => set("womenOnly", e.target.checked)} className="size-4 accent-[var(--brand)]" /> {t("Só para mulheres", "Women only")}
        </label>
        <Rules>
          <p>{t("O site só faz a ponte entre quem oferece e quem procura. Qualquer combinação, inclusive sobre despesas da viagem, é feita direto entre vocês, na conversa.", "The site only connects people who offer with people who need help. Anything you agree, including about trip costs, is arranged directly between you, in conversation.")}</p>
          <p>{group
            ? t("Cada pessoa compra a própria passagem. Sem material de campanha e sem pedir voto durante a viagem.", "Everyone buys their own ticket. No campaign material and no asking for votes during the trip.")
            : t("Só no seu carro ou na sua van. Sem material de campanha no veículo e sem pedir voto durante a viagem.", "Only in your own car or van. No campaign material in the vehicle and no asking for votes during the trip.")}</p>
          <p>{t("Não coloque telefone, e-mail ou valores no texto. Quem pedir uma vaga deixa o WhatsApp, e você chama.", "Don’t put a phone number, email or prices in the text. Whoever requests a seat leaves their WhatsApp number, and you contact them.")}</p>
        </Rules>
      </fieldset>
      {error && <p role="alert" className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground">{error}</p>}
      {stage === "form" ? (
        <>
          <LiabilityNotice checked={ack} onChange={setAck} offer />
          <Button type="submit" disabled={pending || !v.citySlug || !ack} className="h-12 w-full rounded-md text-base font-bold">
            {pending ? t("Publicando...", "Publishing...") : editingId ? t("Salvar alterações", "Save changes") : session.authed && session.hasProfile ? t("Publicar carona", "Publish ride") : t("Continuar", "Continue")}
          </Button>
        </>
      ) : (
        <AuthPanel session={session} onDone={publish} />
      )}
    </form>
  );
}

export function StayForm({ countries, session, initial, editingId }: { countries: FormCountry[]; session: Session; initial: StayInput & { country: string }; editingId?: string }) {
  const [v, setV] = useState(initial);
  const [ack, setAck] = useState(false);
  const lang = useLang();
  const t = useT();
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((old) => ({ ...old, [k]: value }));
  const { stage, error, pending, submit, publish } = useOfferSubmit(session, () => saveStayAction({ ...v, ack }, editingId, lang), Boolean(editingId));
  const toggleNight = (night: string) =>
    set("nights", v.nights.includes(night) ? v.nights.filter((n) => n !== night) : [...v.nights, night].sort());

  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={stage === "auth" || Boolean(editingId)} className="contents">
        <CitySelect countries={countries} country={v.country} city={v.citySlug} onChange={(country, city) => setV((o) => ({ ...o, country, citySlug: city }))} />
      </fieldset>
      <fieldset disabled={stage === "auth"} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="area">{t("Bairro ou região", "Neighbourhood or area")}</Label>
          <Input id="area" required maxLength={80} value={v.areaHint} onChange={(e) => set("areaHint", e.target.value)} placeholder={t("Ex.: Belleville", "E.g. Belleville")} className="h-11" />
          <p className="text-xs text-muted-foreground">{t("Só o bairro. O endereço você combina pelo WhatsApp com quem for.", "Just the neighbourhood. You share the address on WhatsApp with whoever comes.")}</p>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t("Noites", "Nights")}</legend>
          {election.nights.map((n) => (
            <label key={n} className="flex items-center gap-2">
              <input type="checkbox" checked={v.nights.includes(n)} onChange={() => toggleNight(n)} className="size-4 accent-[var(--brand)]" /> {t("Noite de", "Night of")} {nightLabel(n, lang)}
            </label>
          ))}
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="capacity">{t("Quantas pessoas cabem", "How many people you can host")}</Label>
            <select id="capacity" value={String(v.capacity)} onChange={(e) => set("capacity", Number(e.target.value))} className="h-11 w-full rounded-lg border border-input bg-background px-3">
              {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kind">{t("Onde a pessoa dorme", "Where they will sleep")}</Label>
            <select id="kind" value={v.kind} onChange={(e) => set("kind", e.target.value as StayInput["kind"])} className="h-11 w-full rounded-lg border border-input bg-background px-3">
              <option value="room">{t("Quarto", "Room")}</option>
              <option value="couch">{t("Sofá", "Sofa")}</option>
              <option value="mattress">{t("Colchão", "Mattress")}</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rules">{t("Regras da casa", "House rules")}</Label>
          <Textarea id="rules" maxLength={500} rows={3} value={v.rules} onChange={(e) => set("rules", e.target.value)} placeholder={t("Ex.: sem fumar, chegada até 22h, tem gato", "E.g. no smoking, arrive by 10 pm, there is a cat")} />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={v.womenOnly} onChange={(e) => set("womenOnly", e.target.checked)} className="size-4 accent-[var(--brand)]" /> {t("Só para mulheres", "Women only")}
        </label>
        <Rules>
          <p>{t("Ofereça um lugar para dormir na casa onde você mora. O site só faz a ponte: o que for preciso combinar fica entre você e quem pedir, na conversa.", "Offer a place to sleep in the home where you live. The site only connects you: anything that needs arranging is between you and whoever asks, in conversation.")}</p>
          <p>{t("Sem material de campanha e sem pedir voto durante a estadia.", "No campaign material and no asking for votes during the stay.")}</p>
          <p>{t("Não coloque telefone, e-mail, endereço ou valores no texto. Quem pedir deixa o WhatsApp, e você chama.", "Don’t put a phone number, email, address or prices in the text. Whoever asks leaves their WhatsApp number, and you contact them.")}</p>
        </Rules>
      </fieldset>
      {error && <p role="alert" className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground">{error}</p>}
      {stage === "form" ? (
        <>
          <LiabilityNotice checked={ack} onChange={setAck} offer />
          <Button type="submit" disabled={pending || !v.citySlug || v.nights.length === 0 || !ack} className="h-12 w-full rounded-md text-base font-bold">
            {pending ? t("Publicando...", "Publishing...") : editingId ? t("Salvar alterações", "Save changes") : session.authed && session.hasProfile ? t("Publicar hospedagem", "Publish place to stay") : t("Continuar", "Continue")}
          </Button>
        </>
      ) : (
        <AuthPanel session={session} onDone={publish} />
      )}
    </form>
  );
}
