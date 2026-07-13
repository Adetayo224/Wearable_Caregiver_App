import { promises as fs } from "node:fs";
import path from "node:path";
import type { PushSubscription as WebPushSubscription } from "web-push";

const FILE = path.join(process.cwd(), "push-subscriptions.json");

async function readAll(): Promise<WebPushSubscription[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeAll(list: WebPushSubscription[]) {
  await fs.writeFile(FILE, JSON.stringify(list, null, 2));
}

export async function listSubscriptions() {
  return readAll();
}

export async function addSubscription(sub: WebPushSubscription) {
  const all = await readAll();
  if (!all.find((s) => s.endpoint === sub.endpoint)) {
    all.push(sub);
    await writeAll(all);
  }
}

export async function removeSubscription(endpoint: string) {
  const all = await readAll();
  await writeAll(all.filter((s) => s.endpoint !== endpoint));
}
