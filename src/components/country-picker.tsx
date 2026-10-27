"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LocalLink, useLang, useT } from "@/i18n/client";
import { plural } from "@/lib/format";

export type CountryRow = { code: string; name: string; cities: number; voters: number; open_rides: number; open_stays: number };

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function CountryPicker({ countries, basePath }: { countries: CountryRow[]; basePath: string }) {
  const lang = useLang();
  const t = useT();
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const n = normalize(q.trim());
    return n ? countries.filter((c) => normalize(c.name).includes(n)) : countries;
  }, [q, countries]);

  return (
    <div>
      <label className="relative block max-w-md">
        <span className="sr-only">{t("Procure seu país", "Search for your country")}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Procure seu país", "Search for your country")} className="h-12 pl-9 text-base" />
      </label>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <li key={c.code}>
            <LocalLink href={`${basePath}/${c.code.toLowerCase()}`} className="flex h-full items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 transition hover:border-brand">
              <span>
                <span className="block font-bold">{c.name}</span>
                <span className="text-sm text-muted-foreground">
                  {lang === "en" ? plural(c.cities, "city with a polling place", "cities with a polling place", lang) : plural(c.cities, "cidade com seção", "cidades com seção")}
                </span>
              </span>
              {c.open_rides + c.open_stays > 0 && (
                <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">
                  {lang === "en" ? plural(c.open_rides + c.open_stays, "offer", "offers", lang) : plural(c.open_rides + c.open_stays, "oferta", "ofertas")}
                </span>
              )}
            </LocalLink>
          </li>
        ))}
        {filtered.length === 0 && <li className="text-muted-foreground">{t("Nenhum país com seção eleitoral com esse nome.", "No country with a polling place matches that name.")}</li>}
      </ul>
    </div>
  );
}
