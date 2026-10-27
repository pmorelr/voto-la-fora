"use client";

import { Label } from "@/components/ui/label";
import { useT } from "@/i18n/client";
import type { FormCountry } from "@/lib/data";

export function CitySelect({ countries, country, city, onChange }: {
  countries: FormCountry[];
  country: string;
  city: string;
  onChange: (country: string, city: string) => void;
}) {
  const t = useT();
  const cities = countries.find((c) => c.code === country)?.cities ?? [];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="country">{t("País", "Country")}</Label>
        <select
          id="country"
          value={country}
          onChange={(e) => {
            const next = countries.find((c) => c.code === e.target.value);
            onChange(e.target.value, next?.cities.length === 1 ? next.cities[0].slug : "");
          }}
          className="h-11 w-full rounded-lg border border-input bg-background px-3"
        >
          <option value="">{t("Escolha o país", "Choose the country")}</option>
          {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="city">{t("Cidade de votação", "Voting city")}</Label>
        <select id="city" value={city} disabled={!country} onChange={(e) => onChange(country, e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 disabled:opacity-50">
          <option value="">{t("Escolha a cidade", "Choose the city")}</option>
          {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </div>
    </div>
  );
}
