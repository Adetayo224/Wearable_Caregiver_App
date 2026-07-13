"use client";
import { useEffect, useState } from "react";
import { getHome, setHome, GEOFENCE_RADIUS_M } from "@/lib/geofence";
import { DEVICE_ID } from "@/lib/supabase";
import { useToast } from "@/components/Toast";

export default function SettingsPage() {
  const toast = useToast();
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [pushStatus, setPushStatus] = useState<"unknown" | "granted" | "denied" | "unsupported" | "default">(
    "unknown"
  );

  useEffect(() => {
    const h = getHome();
    setLat(String(h.lat));
    setLon(String(h.lon));
    if (typeof window !== "undefined") {
      if (!("Notification" in window)) setPushStatus("unsupported");
      else setPushStatus(Notification.permission as any);
    }
  }, []);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const nLat = parseFloat(lat);
    const nLon = parseFloat(lon);
    if (
      Number.isNaN(nLat) ||
      Number.isNaN(nLon) ||
      nLat < -90 ||
      nLat > 90 ||
      nLon < -180 ||
      nLon > 180
    ) {
      toast("Invalid coordinates");
      return;
    }
    setHome({ lat: nLat, lon: nLon });
    toast("Home saved");
  }

  function useCurrent() {
    if (!("geolocation" in navigator)) {
      toast("Geolocation unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLon(pos.coords.longitude.toFixed(6));
      },
      () => toast("Could not read location"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-xs text-muted mt-0.5">Device, home geofence, and push notifications.</p>
      </div>

      <div className="bg-surface border border-line rounded-xl p-4 shadow-card space-y-1 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted">Device ID</span>
          <span className="font-mono text-ink">{DEVICE_ID}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Geofence radius</span>
          <span className="text-ink">{(GEOFENCE_RADIUS_M / 1000).toFixed(0)} km</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Push notifications</span>
          <span
            className={
              "text-xs px-2 py-0.5 rounded-full border " +
              (pushStatus === "granted"
                ? "bg-bg text-ink border-line"
                : "bg-accent-soft text-accent border-accent-ring")
            }
          >
            {pushStatus}
          </span>
        </div>
      </div>

      <form
        onSubmit={save}
        className="bg-surface border border-line rounded-xl p-4 shadow-card space-y-3"
      >
        <div>
          <h2 className="text-sm font-semibold text-ink">Home coordinates</h2>
          <p className="text-xs text-muted mt-0.5">
            Center of the 30 km geofence. Stored locally in this browser.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-muted">Latitude</span>
            <input
              type="text"
              inputMode="decimal"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="6.5244"
              className="mt-1 w-full bg-transparent border border-line rounded-md px-2.5 py-1.5 text-sm font-mono text-ink outline-none focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted">Longitude</span>
            <input
              type="text"
              inputMode="decimal"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="3.3792"
              className="mt-1 w-full bg-transparent border border-line rounded-md px-2.5 py-1.5 text-sm font-mono text-ink outline-none focus:border-ink"
            />
          </label>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={useCurrent}
            className="px-3 py-1.5 text-sm rounded-md border border-line text-ink"
          >
            Use current location
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 text-sm rounded-md bg-ink text-white"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
