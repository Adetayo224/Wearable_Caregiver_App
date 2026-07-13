# Caregiver Dashboard (PWA)

Next.js 14 App Router + TypeScript + Tailwind + Supabase realtime + Web Push.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000. The PWA install prompt appears from the browser's address bar or menu. The push-notification opt-in banner shows on first load.

## Environment

`.env.local` is already populated with the Supabase project URL, the `wearable_01` device ID, and a freshly-generated VAPID key pair. To regenerate VAPID keys:

```bash
npm run generate-vapid
```

Copy the output over `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` in `.env.local`, then restart `npm run dev` and clear any existing push subscription in the browser.

## What works out of the box

All five pages, realtime vitals, the map with geofence, the alerts feed, sending messages, delivery tracking, and **foreground** notifications (while any tab is open) work immediately after deployment. Nothing else needs to be configured for day-to-day use.

## Push notifications

Two independent triggers are wired up:

1. **Foreground realtime bridge (always on)** — while any tab is open, `AlertPushBridge` listens to Supabase realtime `INSERT`s on `alerts` and calls `showNotification` via the service worker. No extra setup required.
2. **Background Web Push (optional)** — needed only if you want alerts to notify the caregiver when the app is completely closed. Subscriptions land at `POST /api/subscribe` and are stored in the Supabase `push_subscriptions` table. To fire real pushes, wire a Supabase Database Webhook to hit `POST /api/notify`.

### Required for background push: create the subscription table (one-time)

```sql
create table if not exists push_subscriptions (
  endpoint text primary key,
  keys jsonb not null,
  created_at timestamptz default now()
);
alter table push_subscriptions enable row level security;
create policy "anon insert" on push_subscriptions for insert to anon with check (true);
create policy "anon read"   on push_subscriptions for select to anon using (true);
create policy "anon delete" on push_subscriptions for delete to anon using (true);
```

### Required for background push: wire the Supabase webhook

Supabase Studio → Database → Webhooks → New:

- Table: `alerts`, event: `Insert`
- URL: `https://<your-deployment>/api/notify`
- HTTP method: `POST`
- Optional header `x-webhook-secret: <PUSH_WEBHOOK_SECRET>` (matches `.env.local`)

The webhook posts a `{ type, record }` payload that `/api/notify` maps into a push. You can also POST manually to test:

```bash
curl -X POST https://<your-deployment>/api/notify \
  -H 'content-type: application/json' \
  -d '{"title":"Test","body":"Push works","url":"/alerts"}'
```

Or by inserting a row directly:

```sql
insert into alerts (device_id, alert_type, message)
values ('wearable_01', 'fall', 'Test fall alert');
```

Without the webhook: foreground bridge still fires while a tab is open. With the webhook: pushes also arrive when the site is closed.

## Pages

- `/` — live vitals dashboard (realtime subscription).
- `/map` — Leaflet map with a 30 km geofence around the configured home point.
- `/alerts` — alerts feed, colored badges, unresolved counter, resolve action.
- `/messages` — 110-char message sender to `messages` with delivery tracking.
- `/settings` — device info, home coordinates, push-permission status.

## Design

White surface, black ink, one accent color (`#dc2626`) for warnings and alerts. Flat, no gradients, subtle card elevation, mobile-first with a bottom tab bar under `sm:`.
