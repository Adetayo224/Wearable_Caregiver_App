"use client";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function PWAInit() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<"idle" | "granted" | "denied" | "unsupported">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch((e) => {
      console.error("SW register failed", e);
    });

    if (!("Notification" in window) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    const perm = Notification.permission;
    if (perm === "granted") setStatus("granted");
    else if (perm === "denied") setStatus("denied");
    else setVisible(true);
  }, []);

  async function enable() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus("denied");
        setVisible(false);
        return;
      }
      setStatus("granted");
      setVisible(false);

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          )
        }));
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sub)
      });
    } catch (e) {
      console.error(e);
    }
  }

  if (!visible) return null;
  return (
    <div className="fixed z-40 bottom-24 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-96">
      <div className="bg-surface border border-line rounded-xl p-4 shadow-card animate-fadein">
        <div className="text-sm font-semibold text-ink">Enable alert notifications</div>
        <p className="text-xs text-muted mt-1">
          Get pushed when the wearable reports a new alert, even when this app isn&apos;t open.
        </p>
        <div className="mt-3 flex gap-2 justify-end">
          <button
            onClick={() => setVisible(false)}
            className="px-3 py-1.5 text-sm rounded-md border border-line text-ink"
          >
            Later
          </button>
          <button
            onClick={enable}
            className="px-3 py-1.5 text-sm rounded-md bg-ink text-white"
          >
            Enable
          </button>
        </div>
      </div>
    </div>
  );
}
