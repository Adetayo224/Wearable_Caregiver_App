"use client";
import { useEffect, useState } from "react";
import { getSupabase, DEVICE_ID } from "@/lib/supabase";
import type { Alert } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { CheckIcon } from "@/components/Icons";

function badgeClass(kind: string) {
  switch (kind) {
    case "fall":
      return "bg-accent-soft text-accent border-accent-ring";
    case "vitals_abnormal":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "geofence":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    default:
      return "bg-bg text-muted border-line";
  }
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open">("all");
  const toast = useToast();

  useEffect(() => {
    const sb = getSupabase();
    let cancelled = false;

    (async () => {
      const { data, error } = await sb
        .from("alerts")
        .select("*")
        .eq("device_id", DEVICE_ID)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) console.error(error);
      if (!cancelled) {
        setAlerts((data as Alert[]) || []);
        setLoading(false);
      }
    })();

    const channel = sb
      .channel("alerts-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: `device_id=eq.${DEVICE_ID}`
        },
        (payload) => {
          setAlerts((prev) => [payload.new as Alert, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "alerts",
          filter: `device_id=eq.${DEVICE_ID}`
        },
        (payload) => {
          const next = payload.new as Alert;
          setAlerts((prev) => prev.map((a) => (a.id === next.id ? next : a)));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      sb.removeChannel(channel);
    };
  }, []);

  async function resolve(a: Alert) {
    const sb = getSupabase();
    const { error } = await sb.from("alerts").update({ resolved: true }).eq("id", a.id);
    if (error) {
      toast("Could not mark resolved");
      console.error(error);
      return;
    }
    setAlerts((prev) => prev.map((x) => (x.id === a.id ? { ...x, resolved: true } : x)));
    toast("Alert resolved");
  }

  const unresolved = alerts.filter((a) => !a.resolved).length;
  const shown = filter === "open" ? alerts.filter((a) => !a.resolved) : alerts;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Alerts</h1>
          <p className="text-xs text-muted mt-0.5">
            {unresolved > 0 ? (
              <span className="text-accent font-medium">{unresolved} unresolved</span>
            ) : (
              "All clear"
            )}
            {" · "}
            {alerts.length} total
          </p>
        </div>
        <div className="inline-flex bg-bg rounded-md p-0.5 border border-line text-xs">
          <button
            onClick={() => setFilter("all")}
            className={
              "px-2.5 py-1 rounded " + (filter === "all" ? "bg-surface text-ink" : "text-muted")
            }
          >
            All
          </button>
          <button
            onClick={() => setFilter("open")}
            className={
              "px-2.5 py-1 rounded " + (filter === "open" ? "bg-surface text-ink" : "text-muted")
            }
          >
            Open
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface border border-line rounded-xl animate-pulse" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="bg-surface border border-dashed border-line rounded-xl p-6 text-center text-sm text-muted">
          No alerts.
        </div>
      ) : (
        <ul className="space-y-2">
          {shown.map((a) => (
            <li
              key={a.id}
              className={
                "bg-surface border rounded-xl p-4 shadow-card animate-fadein " +
                (a.resolved ? "border-line opacity-70" : "border-line")
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={
                        "inline-flex items-center rounded-full text-[11px] font-medium px-2 py-0.5 border " +
                        badgeClass(a.alert_type)
                      }
                    >
                      {a.alert_type}
                    </span>
                    <span className="text-xs text-muted">{formatDateTime(a.created_at)}</span>
                    {a.resolved && (
                      <span className="text-[11px] text-muted inline-flex items-center gap-1">
                        <CheckIcon className="w-3 h-3" /> resolved
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink mt-1.5 break-words">
                    {a.message || "No message"}
                  </p>
                  <div className="mt-1.5 text-[11px] text-muted flex flex-wrap gap-x-3 gap-y-0.5">
                    {a.heart_rate != null && <span>HR {a.heart_rate}</span>}
                    {a.spo2 != null && <span>SpO2 {a.spo2}</span>}
                    {a.body_temp != null && <span>Temp {a.body_temp.toFixed?.(1) ?? a.body_temp}</span>}
                    {a.gps_lat != null && a.gps_lon != null && (
                      <span className="font-mono">
                        {a.gps_lat.toFixed(4)}, {a.gps_lon.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
                {!a.resolved && (
                  <button
                    onClick={() => resolve(a)}
                    className="shrink-0 px-3 py-1.5 text-xs rounded-md bg-ink text-white"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
