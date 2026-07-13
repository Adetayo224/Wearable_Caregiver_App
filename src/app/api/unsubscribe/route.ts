import { removeSubscription } from "@/lib/subscriptions";
import { withJson } from "@/lib/apiResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withJson(async () => {
    const { endpoint } = (await req.json()) as { endpoint?: string };
    if (!endpoint) throw new Error("Missing endpoint");
    await removeSubscription(endpoint);
    return { ok: true };
  });
}
