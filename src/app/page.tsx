"use client";
import { useEffect, useState } from "react";
import { getSupabase, DEVICE_ID } from "@/lib/supabase";
import type { HealthReading } from "@/lib/types";
import MetricCard from "@/components/MetricCard";
import { HeartIcon, OxygenIcon, TempIcon, LocationIcon, FallIcon, BatteryIcon } from "@/components/Icons";
import Link from "next/link";

function formatTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}

export default function HomePage() {
  const [reading, setReading] = useState<HealthReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

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
      if (!cancelled) {
        setReading((data?.[0] as HealthReading) ?? null);
        setLoading(false);
      }
    })();

    const channel = sb
      .channel("health-latest")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "health_readings",
          filter: `device_id=eq.${DEVICE_ID}`
        },
        (payload) => {
          setReading(payload.new as HealthReading);
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      cancelled = true;
      sb.removeChannel(channel);
    };
  }, []);

  const hr = reading?.heart_rate ?? null;
  const spo2 = reading?.spo2 ?? null;
  const temp = reading?.body_temp ?? null;
  const fall = reading?.fall_detected ?? false;

  const hrWarn = hr !== null && (hr < 50 || hr > 120);
  const spo2Warn = spo2 !== null && spo2 < 92;
  const tempWarn = temp !== null && (temp < 35 || temp > 38);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Live vitals</h1>
          <p className="text-xs text-muted mt-0.5">
            Device <span className="font-mono">{DEVICE_ID}</span>
            {" · "}
            <span className={connected ? "text-ink" : "text-muted"}>
              {connected ? "Live" : "Connecting…"}
            </span>
            {reading?.created_at ? ` · Updated ${formatTime(reading.created_at)}` : ""}
          </p>
        </div>
        {fall ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft text-accent text-xs font-medium px-2.5 py-1 border border-accent-ring">
            Fall detected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-bg text-muted text-xs font-medium px-2.5 py-1 border border-line">
            Stable
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Heart rate"
          value={hr}
          unit="bpm"
          icon={<HeartIcon className="w-5 h-5" />}
          warn={hrWarn}
          pulse={hr !== null && !hrWarn}
          updatedAt={reading?.created_at}
        />
        <MetricCard
          label="SpO2"
          value={spo2}
          unit="%"
          icon={<OxygenIcon className="w-5 h-5" />}
          warn={spo2Warn}
          updatedAt={reading?.created_at}
        />
        <MetricCard
          label="Body temp"
          value={temp !== null ? temp.toFixed(1) : temp}
          unit="°C"
          icon={<TempIcon className="w-5 h-5" />}
          warn={tempWarn}
          updatedAt={reading?.created_at}
        />
        <MetricCard
          label="Fall status"
          value={fall ? "Detected" : "Normal"}
          icon={<FallIcon className="w-5 h-5" />}
          warn={fall}
          updatedAt={reading?.created_at}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-line rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs uppercase tracking-wide">GPS</span>
            <LocationIcon className="w-4 h-4" />
          </div>
          <div className="mt-2 text-sm text-ink">
            {reading?.gps_locked && reading?.gps_lat && reading?.gps_lon ? (
              <>
                <div className="font-mono">
                  {reading.gps_lat.toFixed(5)}, {reading.gps_lon.toFixed(5)}
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {reading.gps_satellites ?? 0} sats · {reading.gps_speed?.toFixed(1) ?? "0.0"} m/s
                </div>
              </>
            ) : (
              <span className="text-muted">No GPS lock</span>
            )}
          </div>
          <Link href="/map" className="mt-3 inline-block text-xs text-ink underline underline-offset-2">
            View map
          </Link>
        </div>

        <div className="bg-surface border border-line rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs uppercase tracking-wide">Buzzer</span>
            <BatteryIcon className="w-4 h-4" />
          </div>
          <div className="mt-2 text-sm text-ink">
            {reading?.buzzer_active ? (
              <span className="text-accent font-medium">Active</span>
            ) : (
              <span className="text-muted">Silent</span>
            )}
          </div>
          <div className="text-xs text-muted mt-3">
            {loading ? "Loading device state…" : "Realtime stream from device."}
          </div>
        </div>
      </div>

      {!reading && !loading && (
        <div className="bg-surface border border-dashed border-line rounded-xl p-6 text-center text-sm text-muted">
          No readings yet from <span className="font-mono">{DEVICE_ID}</span>.
        </div>
      )}
    </div>
  );
}
