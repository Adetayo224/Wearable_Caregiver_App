"use client";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-[60vh] min-h-[380px] rounded-xl border border-line bg-surface animate-pulse" />
  )
});

export default function MapPage() {
  return <MapView />;
}
