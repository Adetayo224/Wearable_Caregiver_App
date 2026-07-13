import { NextResponse } from "next/server";
import { removeSubscription } from "@/lib/subscriptions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { endpoint } = (await req.json()) as { endpoint?: string };
  if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  await removeSubscription(endpoint);
  return NextResponse.json({ ok: true });
}
