"use client";
import { useEffect } from "react";
import { getSupabase, DEVICE_ID } from "@/lib/supabase";
import type { Alert } from "@/lib/types";

export default function AlertPushBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const sb = getSupabase();
    const channel = sb
      .channel("alerts-foreground")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: `device_id=eq.${DEVICE_ID}`
        },
        async (payload) => {
          const alert = payload.new as Alert;
          if (Notification.permission !== "granted") return;
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification("Caregiver alert: " + (alert.alert_type || "alert"), {
            body: alert.message || "New alert from wearable",
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            tag: "alert-" + alert.id,
            data: { url: "/alerts" }
          });
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  return null;
}
