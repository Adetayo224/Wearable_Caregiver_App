import { getWebPush } from "@/lib/webpush";
import { listSubscriptions, removeSubscription } from "@/lib/subscriptions";
import { jsonResponse, withJson } from "@/lib/apiResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
  record?: {
    id?: string | number;
    alert_type?: string;
    message?: string;
    device_id?: string;
  };
  type?: string;
};

export async function POST(req: Request) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  if (secret) {
    const headerSecret = req.headers.get("x-webhook-secret");
    if (headerSecret !== secret) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return withJson(async () => {
    const payload = ((await req.json().catch(() => ({}))) as Body) || {};

    let title = payload.title;
    let body = payload.body;
    let tag = payload.tag;
    const url = payload.url || "/alerts";

    if ((!title || !body) && payload.record) {
      const r = payload.record;
      title = title || `Caregiver alert: ${r.alert_type || "alert"}`;
      body = body || r.message || "New alert from wearable";
      tag = tag || (r.id != null ? `alert-${r.id}` : undefined);
    }

    if (!title) title = "Caregiver alert";
    if (!body) body = "New alert from wearable";

    const webpush = getWebPush();
    const subs = await listSubscriptions();
    const notificationPayload = JSON.stringify({ title, body, url, tag });

    const results = await Promise.allSettled(
      subs.map((s) => webpush.sendNotification(s, notificationPayload))
    );

    let sent = 0;
    let removed = 0;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled") {
        sent++;
      } else {
        const err = r.reason as { statusCode?: number };
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await removeSubscription(subs[i].endpoint).catch(() => {});
          removed++;
        }
      }
    }

    return { ok: true, sent, removed, total: subs.length };
  });
}
