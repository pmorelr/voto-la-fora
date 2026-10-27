"use client";

import { LngLatBounds, MapLibreMap, Marker, NavigationControl, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { useLang } from "@/i18n/client";
import { cn } from "@/lib/utils";

// Ver scripts/copy-maplibre-worker.mjs.
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export type MapPin = { id: string; lat: number; lon: number; label: string; href?: string; kind?: "city" | "origin" };
/** `group`: grupo de viagem em transporte público, desenhado tracejado. */
export type MapArc = { from: [number, number]; to: [number, number]; group?: boolean };

// Curva suave entre partida e chegada. Não é rota de estrada: só mostra o trajeto.
function curve([x1, y1]: [number, number], [x2, y2]: [number, number], n = 40) {
  const cx = (x1 + x2) / 2 - (y2 - y1) * 0.18;
  const cy = (y1 + y2) / 2 + (x2 - x1) * 0.18;
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [(1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t * t * x2, (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t * t * y2];
  });
}

function pinElement(pin: MapPin) {
  const el = document.createElement(pin.href ? "a" : "div");
  if (pin.href) (el as HTMLAnchorElement).href = pin.href;
  el.className = "group flex items-center gap-1.5";
  el.setAttribute("aria-label", pin.label);
  const dot = document.createElement("span");
  dot.className =
    pin.kind === "origin"
      ? "block size-3 rounded-full border-2 border-[#2b2825] bg-white"
      : "block size-4 rounded-full border-2 border-white bg-[#2b2825] shadow";
  const label = document.createElement("span");
  label.className =
    pin.kind === "origin"
      ? "rounded bg-white/90 px-1.5 py-0.5 text-[11px] font-medium text-[#1f1d1b] shadow-sm"
      : "rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#1f1d1b] shadow group-hover:bg-[#2b2825] group-hover:text-white";
  label.textContent = pin.label;
  el.append(dot, label);
  return el;
}

export default function VoteMap({ pins, arcs = [], className }: { pins: MapPin[]; arcs?: MapArc[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const lang = useLang();

  useEffect(() => {
    if (!ref.current) return;
    const map = new MapLibreMap({
      container: ref.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      attributionControl: { compact: true },
      cooperativeGestures: true,
      locale: lang === "en"
        ? {
            "CooperativeGesturesHandler.WindowsHelpText": "Use Ctrl + scroll to zoom the map",
            "CooperativeGesturesHandler.MacHelpText": "Use ⌘ + scroll to zoom the map",
            "CooperativeGesturesHandler.MobileHelpText": "Use two fingers to move the map",
            "NavigationControl.ZoomIn": "Zoom in",
            "NavigationControl.ZoomOut": "Zoom out",
          }
        : {
            "CooperativeGesturesHandler.WindowsHelpText": "Use Ctrl e a rolagem para aproximar o mapa",
            "CooperativeGesturesHandler.MacHelpText": "Use ⌘ e a rolagem para aproximar o mapa",
            "CooperativeGesturesHandler.MobileHelpText": "Use dois dedos para mover o mapa",
            "NavigationControl.ZoomIn": "Aproximar",
            "NavigationControl.ZoomOut": "Afastar",
          },
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.on("error", (e) => console.error("Erro no mapa:", e.error?.message ?? e));
    if (process.env.NODE_ENV !== "production") (window as unknown as { __map?: MapLibreMap }).__map = map;

    const points: [number, number][] = [...pins.map((p) => [p.lon, p.lat] as [number, number]), ...arcs.flatMap((a) => [a.from, a.to])];
    if (points.length === 1) {
      map.jumpTo({ center: points[0], zoom: 8 });
    } else if (points.length > 1) {
      const bounds = new LngLatBounds(points[0], points[0]);
      points.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, { padding: { top: 48, bottom: 88, left: 40, right: 96 }, maxZoom: 8, animate: false });
    }

    const markers = pins.map((pin) => new Marker({ element: pinElement(pin), anchor: "left", offset: [-8, 0] }).setLngLat([pin.lon, pin.lat]).addTo(map));

    map.on("load", () => {
      // Nomes de lugares em português quando o mapa tiver.
      for (const layer of map.getStyle().layers) {
        if (layer.type === "symbol" && map.getLayoutProperty(layer.id, "text-field")) {
          map.setLayoutProperty(layer.id, "text-field", ["coalesce", ["get", lang === "en" ? "name:en" : "name:pt"], ["get", "name:latin"], ["get", "name"]]);
        }
      }
      if (arcs.length === 0) return;
      map.addSource("arcs", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: arcs.map((a) => ({ type: "Feature", properties: { group: Boolean(a.group) }, geometry: { type: "LineString", coordinates: curve(a.from, a.to) } })),
        },
      });
      map.addLayer({
        id: "arcs",
        type: "line",
        source: "arcs",
        filter: ["!=", ["get", "group"], true],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#2b2825", "line-width": 2.5, "line-opacity": 0.85 },
      });
      // Grupos de trem ou ônibus: mesma cor, linha tracejada.
      map.addLayer({
        id: "arcs-grupos",
        type: "line",
        source: "arcs",
        filter: ["==", ["get", "group"], true],
        layout: { "line-cap": "butt", "line-join": "round" },
        paint: { "line-color": "#2b2825", "line-width": 2.5, "line-opacity": 0.85, "line-dasharray": [2, 1.6] },
      });
    });

    return () => {
      markers.forEach((m) => m.remove());
      map.remove();
    };
  }, [pins, arcs, lang]);

  return <div ref={ref} className={cn("h-[380px] w-full overflow-hidden rounded-2xl border bg-muted", className)} />;
}
