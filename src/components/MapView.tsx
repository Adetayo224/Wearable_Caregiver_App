"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import L, { CircleMarker, Circle, Map as LeafletMap } from "leaflet";
import { getSupabase, DEVICE_ID } from "@/lib/supabase";
import type { HealthReading } from "@/lib/types";
import {
  GEOFENCE_RADIUS_M,
  getHome,
  haversineMeters,
  isOutsideGeofence
} from "@/lib/geofence";

export default function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<CircleMarker | null>(null);
  const geofenceRef = useRef<Circle | null>(null);
  const homeMarkerRef = useRef<CircleMarker | null>(null);

  const home = useMemo(() => getHome(), []);
  const [reading, setReading] = useState<HealthReading | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [home.lat, home.lon],
      zoom: 10,
      zoomControl: true
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19
    }).addTo(map);

    const homeM = L.circleMarker([home.lat, home.lon], {
      radius: 6,
      color: "#0a0a0a",
      fillColor: "#0a0a0a",
      fillOpacity: 1,
      weight: 2
    }).addTo(map).bindTooltip("Home");
    homeMarkerRef.current = homeM;

    const gf = L.circle([home.lat, home.lon], {
      radius: GEOFENCE_RADIUS_M,
      color: "#0a0a0a",
      weight: 1.5,
      fillColor: "#0a0a0a",
      fillOpacity: 0.04,
      dashArray: "4 6"
    }).addTo(map);
    geofenceRef.current = gf;

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [home]);

  useEffect(() => {
    const sb = getSupabase();
    let cancelled = false;

    (async () => {
      const { data } = await sb
        .from("health_readings")
        .select("*")
        .eq("device_id", DEVICE_ID)
        .order("created_at", { ascending: false })
        .limit(1);
      if (!cancelled) setReading((data?.[0] as HealthReading) ?? null);
    })();

    const channel = sb
      .channel("map-latest")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "health_readings",
          filter: `device_id=eq.${DEVICE_ID}`
        },
        (payload) => setReading(payload.new as HealthReading)
      )
      .subscribe();

    return () => {
      cancelled = true;
      sb.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !reading?.gps_locked || reading.gps_lat == null || reading.gps_lon == null) return;

    const point = { lat: reading.gps_lat, lon: reading.gps_lon };
    const outside = isOutsideGeofence(home, point);
    const color = outside ? "#dc2626" : "#0a0a0a";

    if (!markerRef.current) {
      markerRef.current = L.circleMarker([point.lat, point.lon], {
        radius: 8,
        color,
        fillColor: color,
        fillOpacity: 0.85,
        weight: 2
      }).addTo(map);
    } else {
      markerRef.current.setLatLng([point.lat, point.lon]);
      markerRef.current.setStyle({ color, fillColor: color });
    }
    markerRef.current
      .bindTooltip(outside ? "Outside geofence" : "Inside geofence", { direction: "top" });

    if (geofenceRef.current) {
      geofenceRef.current.setStyle({ color: outside ? "#dc2626" : "#0a0a0a" });
    }
  }, [reading, home]);

  const point =
    reading?.gps_locked && reading.gps_lat != null && reading.gps_lon != null
      ? { lat: reading.gps_lat, lon: reading.gps_lon }
      : null;
  const outside = point ? isOutsideGeofence(home, point) : false;
  const dist = point ? haversineMeters(home, point) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Live location</h1>
          <p className="text-xs text-muted mt-0.5">
            Home: {home.lat.toFixed(4)}, {home.lon.toFixed(4)} · 30 km geofence
          </p>
        </div>
        <span
          className={
            "inline-flex items-center gap-1 rounded-full text-xs font-medium px-2.5 py-1 border " +
            (point
              ? outside
                ? "bg-accent-soft text-accent border-accent-ring"
                : "bg-bg text-ink border-line"
              : "bg-bg text-muted border-line")
          }
        >
          {point ? (outside ? "Outside geofence" : "Inside geofence") : "No GPS lock"}
        </span>
      </div>

      <div
        ref={containerRef}
        className="w-full h-[60vh] min-h-[380px] rounded-xl overflow-hidden border border-line"
      />

      <div className="bg-surface border border-line rounded-xl p-4 shadow-card text-sm">
        {point ? (
          <>
            <div className="text-muted text-xs uppercase tracking-wide">Position</div>
            <div className="mt-1 font-mono">
              {point.lat.toFixed(5)}, {point.lon.toFixed(5)}
            </div>
            <div className="text-xs text-muted mt-1">
              Distance from home: {dist ? (dist / 1000).toFixed(2) : "—"} km
            </div>
          </>
        ) : (
          <div className="text-muted">Waiting for GPS lock…</div>
        )}
      </div>
    </div>
  );
}
