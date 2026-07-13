import type { PushSubscription as WebPushSubscription } from "web-push";

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const TABLE = "push_subscriptions";

function headers(extra: Record<string, string> = {}) {
  return {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "content-type": "application/json",
    ...extra
  };
}

export async function listSubscriptions(): Promise<WebPushSubscription[]> {
  const r = await fetch(`${URL_BASE}/rest/v1/${TABLE}?select=endpoint,keys`, {
    headers: headers(),
    cache: "no-store"
  });
  if (!r.ok) throw new Error(`listSubscriptions failed: ${r.status} ${await r.text()}`);
  const rows = (await r.json()) as { endpoint: string; keys: { p256dh: string; auth: string } }[];
  return rows.map((row) => ({ endpoint: row.endpoint, keys: row.keys }));
}

export async function addSubscription(sub: WebPushSubscription) {
  const r = await fetch(`${URL_BASE}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify({ endpoint: sub.endpoint, keys: sub.keys }),
    cache: "no-store"
  });
  if (!r.ok && r.status !== 409) {
    throw new Error(`addSubscription failed: ${r.status} ${await r.text()}`);
  }
}

export async function removeSubscription(endpoint: string) {
  const qs = `endpoint=eq.${encodeURIComponent(endpoint)}`;
  const r = await fetch(`${URL_BASE}/rest/v1/${TABLE}?${qs}`, {
    method: "DELETE",
    headers: headers()
  });
  if (!r.ok) {
    throw new Error(`removeSubscription failed: ${r.status} ${await r.text()}`);
  }
}
