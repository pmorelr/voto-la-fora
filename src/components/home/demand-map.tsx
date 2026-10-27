"use client";

import { LngLatBounds, MapLibreMap, NavigationControl, Popup, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { lp, tr } from "@/i18n";
import { useLang } from "@/i18n/client";
import type { DemandOrigin } from "@/lib/data";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export type Region = { key: string; bounds: [[number, number], [number, number]] };

/** Raio da bolha: área proporcional ao número de pessoas (raiz quadrada), com mínimo legível. */
const radius = (n: number) => Math.round(5 + 4.5 * Math.sqrt(n));

/** Mapa de bolhas: uma por cidade de partida, maior quanto mais gente esperando. Uma cor só, a do grafite. */
export default function DemandMap({ origens, region }: { origens: DemandOrigin[]; region: Region | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const lang = useLang();

  useEffect(() => {
    if (!ref.current) return;
    const map = new MapLibreMap({
      container: ref.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      attributionControl: { compact: true },
      cooperativeGestures: true,
      center: [8, 48],
      zoom: 3,
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    const t = tr(lang);
    const popup = new Popup({ closeButton: true, closeOnClick: true, maxWidth: "280px", offset: 10, focusAfterOpen: false });
    const conteudo = (o: DemandOrigin) => {
      const el = document.createElement("div");
      el.className = "space-y-1.5 text-[13px] leading-snug text-[#1f1d1b]";
      const h = document.createElement("p");
      h.className = "text-sm font-bold";
      h.textContent = o.lugar;
      const n = document.createElement("p");
      n.textContent = o.pessoas === 1 ? t("1 pessoa espera carona para:", "1 person is waiting for a ride to:") : t(`${o.pessoas} pessoas esperam carona para:`, `${o.pessoas} people are waiting for a ride to:`);
      el.append(h, n);
      for (const d of o.destinos) {
        const row = document.createElement("p");
        const oferta = d.caronas === 0 ? t("nenhuma carona saindo daqui ainda", "no ride from here yet") : d.caronas === 1 ? t("1 carona saindo daqui", "1 ride from here") : t(`${d.caronas} caronas saindo daqui`, `${d.caronas} rides from here`);
        row.textContent = `${d.cidade}: ${d.pessoas} · ${oferta}`;
        const a = document.createElement("a");
        a.href = `${lp(lang, "/ajudar/carona")}?cidade=${encodeURIComponent(d.slug)}&origem=${encodeURIComponent(o.lugar)}`;
        a.className = "block font-bold underline";
        a.textContent = t(`Oferecer carona para ${d.cidade}`, `Offer a ride to ${d.cidade}`);
        el.append(row, a);
      }
      return el;
    };

    map.on("load", () => {
      // Nomes de lugares no idioma do site quando o mapa tiver, como nos outros mapas.
      for (const layer of map.getStyle().layers) {
        if (layer.type === "symbol" && map.getLayoutProperty(layer.id, "text-field")) {
          map.setLayoutProperty(layer.id, "text-field", ["coalesce", ["get", lang === "en" ? "name:en" : "name:pt"], ["get", "name:latin"], ["get", "name"]]);
        }
      }
      map.addSource("demanda", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: origens.map((o, i) => ({ type: "Feature", id: i, properties: { i, r: radius(o.pessoas), n: o.pessoas }, geometry: { type: "Point", coordinates: [o.lon, o.lat] } })),
        },
      });
      // Maiores por baixo, para as pequenas continuarem clicáveis; anel claro separa bolhas sobrepostas.
      map.addLayer({
        id: "demanda",
        type: "circle",
        source: "demanda",
        layout: { "circle-sort-key": ["-", 0, ["get", "n"]] },
        paint: {
          "circle-radius": ["get", "r"],
          "circle-color": "#2b2825",
          "circle-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.95, 0.72],
          "circle-stroke-color": "#fbfaf8",
          "circle-stroke-width": 1.5,
        },
      });
      let hovered: number | null = null;
      const show = (e: { features?: { id?: string | number; properties: Record<string, unknown> }[]; lngLat: { lng: number; lat: number } }) => {
        const f = e.features?.[0];
        if (!f) return;
        const o = origens[Number(f.properties.i)];
        if (hovered !== null) map.setFeatureState({ source: "demanda", id: hovered }, { hover: false });
        hovered = Number(f.id);
        map.setFeatureState({ source: "demanda", id: hovered }, { hover: true });
        popup.setLngLat([o.lon, o.lat]).setDOMContent(conteudo(o)).addTo(map);
      };
      map.on("mouseenter", "demanda", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "demanda", () => { map.getCanvas().style.cursor = ""; });
      map.on("mousemove", "demanda", show);
      map.on("click", "demanda", show);
    });

    return () => { popup.remove(); map.remove(); mapRef.current = null; };
  }, [origens, lang]);

  // Região escolhida nos botões acima do mapa.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const fit = () => {
      if (region) map.fitBounds(region.bounds, { padding: 40, maxZoom: 7, animate: true });
      else if (origens.length) {
        const b = new LngLatBounds([origens[0].lon, origens[0].lat], [origens[0].lon, origens[0].lat]);
        origens.forEach((o) => b.extend([o.lon, o.lat]));
        map.fitBounds(b, { padding: 40, maxZoom: 7, animate: false });
      }
    };
    if (map.loaded()) fit(); else map.once("load", fit);
  }, [region, origens]);

  return <div ref={ref} className="h-[440px] w-full overflow-hidden rounded-2xl border bg-muted lg:h-[600px]" />;
}
