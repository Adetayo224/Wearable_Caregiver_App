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

## Push notifications

Two triggers are wired up:

1. **Foreground realtime bridge** — while any tab is open, `AlertPushBridge` listens to Supabase realtime `INSERT`s on `alerts` and shows a `showNotification` via the service worker.
2. **Web Push server (works when the app is closed)** — subscriptions land at `POST /api/subscribe` and are stored in `push-subscriptions.json`. Send them by calling `POST /api/notify`.

To trigger real pushes when a new alert row is inserted, wire a **Supabase Database Webhook**:

- Table: `alerts`, event: `Insert`
- URL: `https://<your-deployment>/api/notify`
- HTTP method: `POST`
- Optional header `x-webhook-secret: <PUSH_WEBHOOK_SECRET>` (matches `.env.local`)

The webhook posts a `{ type, record }` payload that `/api/notify` maps into a push. You can also POST manually to test:

```bash
curl -X POST http://localhost:3000/api/notify \
  -H 'content-type: application/json' \
  -d '{"title":"Test","body":"Push works","url":"/alerts"}'
```

Or by inserting a row directly:

```sql
insert into alerts (device_id, alert_type, message)
values ('wearable_01', 'fall', 'Test fall alert');
```

If a browser tab is open, the foreground bridge fires immediately. For background delivery, the Supabase webhook must be configured.

## Pages

- `/` — live vitals dashboard (realtime subscription).
- `/map` — Leaflet map with a 30 km geofence around the configured home point.
- `/alerts` — alerts feed, colored badges, unresolved counter, resolve action.
- `/messages` — 110-char message sender to `messages` with delivery tracking.
- `/settings` — device info, home coordinates, push-permission status.

## Design

White surface, black ink, one accent color (`#dc2626`) for warnings and alerts. Flat, no gradients, subtle card elevation, mobile-first with a bottom tab bar under `sm:`.
