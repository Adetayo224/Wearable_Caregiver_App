import { NextResponse } from "next/server";
import { addSubscription } from "@/lib/subscriptions";
import type { PushSubscription as WebPushSubscription } from "web-push";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sub = (await req.json()) as WebPushSubscription;
  if (!sub?.endpoint) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }
  await addSubscription(sub);
  return NextResponse.json({ ok: true });
}
