"use client";

import dynamic from "next/dynamic";

// O mapa só existe no navegador.
export const VoteMap = dynamic(() => import("./vote-map"), {
  ssr: false,
  loading: () => <div className="h-[380px] w-full animate-pulse rounded-2xl border bg-muted" />,
});
export type { MapArc, MapPin } from "./vote-map";
