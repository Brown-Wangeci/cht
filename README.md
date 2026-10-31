# Kiriti Tea — online shop

Next.js 16 (App Router) storefront for Central Highlands Tea Company: catalogue, guest cart, checkout with
IntaSend (M-Pesa / card / bank), order emails via Resend, and a password-protected admin.

**Stack:** Next.js 16 · React 19 (React Compiler) · Drizzle ORM · PostgreSQL (Supabase) · Zustand · IntaSend · Resend

## Quick start

```bash
npm ci
cp .env.example .env        # fill in DATABASE_URL at minimum
npm run db:push             # create/upgrade tables
npm run db:seed             # load the product catalogue (safe to re-run)
npm run dev                 # http://localhost:3000
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev server / production build / production server |
| `npm run lint` / `typecheck` | ESLint / TypeScript checks |
| `npm run db:push` | Apply `src/db/schema.ts` to the database (additive changes apply without prompts) |
| `npm run db:seed` | Upsert the catalogue from `scripts/seed-new-products.ts` (never resets stock) |
| `npm run db:studio` | Browse the database with Drizzle Studio |

## Environment

All variables are documented in [`.env.example`](.env.example). Required in production:

- `DATABASE_URL` — needed **at build time too** (the home page and sitemap are pre-rendered and revalidated every 60 s / 1 h).
- `APP_URL` — public URL, no trailing slash (IntaSend redirect, SEO, sitemap).
- `INTASEND_PUBLISHABLE_KEY`, `INTASEND_TEST_ENVIRONMENT`, `INTASEND_WEBHOOK_CHALLENGE`.
- `NEXT_PUBLIC_DELIVERY_FEE_KES` (and optionally `NEXT_PUBLIC_FREE_DELIVERY_THRESHOLD_KES`, default 5000) — inlined at build time, so rebuild after changing.
- `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` — enable `/admin`.
- `RESEND_API_KEY`, `EMAIL_FROM`, `ORDER_NOTIFICATION_EMAIL` — optional; without them no emails are sent.

## Payments (IntaSend)

1. Checkout: `POST /api/checkout` recomputes the total server-side from the locked cart (+ delivery fee), snapshots the
   items onto the checkout session and redirects the customer to IntaSend's hosted page.
2. IntaSend redirects back to `/checkout/success?ref=<checkout id>`, which waits for the webhook.
3. Webhook: `POST /api/webhooks/intasend` checks the `challenge`, re-verifies the invoice with IntaSend's status API,
   checks the amount and currency, then — once, in a single transaction — creates the order, decrements stock, and
   sends the emails.

**Dashboard setup** (Settings → Webhooks → New): URL `https://<your-domain>/api/webhooks/intasend`, event
`collection_event`, and a long random **Challenge** that you also put in `INTASEND_WEBHOOK_CHALLENGE`.
Failed deliveries can be replayed from IntaSend's dashboard; replays are safe (idempotent).

Going live: switch to live keys, set `INTASEND_TEST_ENVIRONMENT=false`, and re-create the webhook on the live account.

## Admin

`/admin` (after setting `ADMIN_PASSWORD`): orders with status filters, order detail with fulfil / cancel / refund
actions and the webhook trail, stock levels and product visibility, newsletter subscribers.
Cancelling or refunding an order does not restock automatically, and refunds themselves are issued in IntaSend.

## Upgrading an existing database

`npm run db:push` only adds columns, a table and indexes. Before running it against production, check that no
checkout produced two orders (the new unique index would fail):

```sql
select checkout_session_id, count(*) from orders group by 1 having count(*) > 1;
```

## Product images

Images live in `public/images/products/` and are referenced by the seed. Missing files fall back to
`public/images/placeholder.svg`. See `AUDIT_REPORT.md` for the list of photos still to add.

## Deployment checklist

- [ ] Production env vars set (see above); `APP_URL` is the final https domain
- [ ] `npm run db:push` and `npm run db:seed` run against the production database
- [ ] IntaSend webhook registered with the same challenge as `INTASEND_WEBHOOK_CHALLENGE`
- [ ] Resend domain verified and `EMAIL_FROM` uses it
- [ ] Product photos uploaded; `NEXT_PUBLIC_DELIVERY_FEE_KES` set
- [ ] Legal pages (`/privacy`, `/terms`, `/delivery-returns`) reviewed — they are drafts
- [ ] Test purchase in sandbox end-to-end, then switch to live keys
