import { addSubscription } from "@/lib/subscriptions";
import { jsonResponse, withJson } from "@/lib/apiResponse";
import type { PushSubscription as WebPushSubscription } from "web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withJson(async () => {
    const sub = (await req.json()) as WebPushSubscription;
    if (!sub?.endpoint) {
      throw Object.assign(new Error("Invalid subscription"), { status: 400 });
    }
    await addSubscription(sub);
    return { ok: true };
  });
}

export function GET() {
  return jsonResponse({ hint: "POST a PushSubscription object here." });
}
