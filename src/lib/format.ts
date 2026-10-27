import { intlLocale, type Lang } from "@/i18n";

// Datas sempre no fuso da cidade de votação: quem viaja combina no horário local.

function parts(ts: number, timeZone: string) {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(ts);
  return Object.fromEntries(p.map((x) => [x.type, x.value]));
}

function offsetMs(ts: number, timeZone: string) {
  const p = parts(ts, timeZone);
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - ts;
}

/** "2026-10-24" + "07:30" no fuso dado -> instante UTC. Trata a troca de horário de verão. */
export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const first = offsetMs(guess, timeZone);
  let ts = guess - first;
  const second = offsetMs(ts, timeZone);
  if (second !== first) ts = guess - second;
  return new Date(ts);
}

/** Instante -> { date: "2026-10-24", time: "07:30" } no fuso dado (para preencher formulários). */
export function utcToZoned(iso: string, timeZone: string) {
  const p = parts(new Date(iso).getTime(), timeZone);
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

export function formatDateTime(iso: string, timeZone: string, lang: Lang = "pt") {
  return new Intl.DateTimeFormat(intlLocale[lang], {
    timeZone, weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso)).replace(",", "").replace(" ", " ");
}

const weekday = (date: string, lang: Lang) =>
  new Intl.DateTimeFormat(intlLocale[lang], { timeZone: "UTC", weekday: "short" }).format(new Date(`${date}T12:00:00Z`)).replace(".", "");

/** "2026-10-24" -> "sáb 24 para dom 25" / "Sat 24 to Sun 25" */
export function nightLabel(date: string, lang: Lang = "pt") {
  const d = new Date(`${date}T12:00:00Z`);
  const next = new Date(d.getTime() + 86_400_000).toISOString().slice(0, 10);
  return `${weekday(date, lang)} ${+date.slice(8)} ${lang === "en" ? "to" : "para"} ${weekday(next, lang)} ${+next.slice(8)}`;
}

export const vehicleLabel = { car: "Carro", van: "Van", train: "Trem, em grupo", bus: "Ônibus de linha, em grupo" } as const;
export const stayKindLabel = { room: "Quarto", couch: "Sofá", mattress: "Colchão" } as const;
const vehicleLabelEn = { car: "Car", van: "Van", train: "Train, as a group", bus: "Scheduled bus, as a group" } as const;
const stayKindLabelEn = { room: "Room", couch: "Sofa", mattress: "Mattress" } as const;
export const vehicleLabels = (lang: Lang) => (lang === "en" ? vehicleLabelEn : vehicleLabel);
/** Grupo de viagem em transporte público regular (trem ou ônibus de linha), cada pessoa com a própria passagem. */
export const isGroupTrip = (vehicle: string) => vehicle === "train" || vehicle === "bus";
export const stayKindLabels = (lang: Lang) => (lang === "en" ? stayKindLabelEn : stayKindLabel);

export function plural(n: number, one: string, many: string, lang: Lang = "pt") {
  return `${n.toLocaleString(intlLocale[lang])} ${n === 1 ? one : many}`;
}

export function formatInt(n: number, lang: Lang = "pt") {
  return n.toLocaleString(intlLocale[lang]);
}

export function formatPct(n: number | null | undefined, digits = 0, lang: Lang = "pt") {
  if (n === null || n === undefined) return "";
  return `${n.toLocaleString(intlLocale[lang], { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

/** Fuso europeu sai do horário de verão na madrugada de 25/10/2026. */
export function hasEuropeanDstChange(timeZone: string) {
  return timeZone.startsWith("Europe/") || timeZone === "Atlantic/Canary" || timeZone === "Atlantic/Madeira";
}

/** Dias inteiros entre hoje, no fuso de Paris, e o 2º turno. */
export function daysUntilRunoff(): number {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return Math.round((Date.parse("2026-10-25T00:00:00Z") - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

export function countdownLabel(days: number, lang: Lang = "pt"): string {
  if (lang === "en") {
    if (days > 1) return `${days} days to go`;
    if (days === 1) return "It's tomorrow";
    if (days === 0) return "It's today. Polling stations close at 5 pm, local time";
    return "The election is over. Thank you to everyone who voted";
  }
  if (days > 1) return `Faltam ${days} dias`;
  if (days === 1) return "É amanhã";
  if (days === 0) return "É hoje. As seções fecham às 17h, hora local";
  return "A eleição passou. Obrigado a quem foi votar";
}
