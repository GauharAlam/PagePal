# Production Deployment — Railway (proxy) + Vercel (landing)

This repo is now production-ready: Supabase Auth everywhere + Stripe Pro.

## 1) Supabase Setup
1. Create project at supabase.com → copy `SUPABASE_URL`, `anon key`, `service_role`
2. SQL Editor → run `supabase_schema.sql` (includes `increment_usage` RPC + indexes)
3. Auth → Providers → Enable Google OAuth (add origin `https://your-landing.vercel.app` + `chrome-extension://<extension-id>`)
4. Auth → URL Config → Site URL = `https://your-landing.vercel.app`, Redirect `/*`

## 2) Anthropic
- console.anthropic.com → create `ANTHROPIC_API_KEY` (claude-sonnet-4-6)

## 3) Stripe ($9/mo Pro)
1. dashboard.stripe.com → Products → Create `Pro` $9 recurring → copy `price_***`
2. Developers → API keys → `STRIPE_SECRET_KEY=sk_live_...`
3. Webhooks → Add endpoint `https://<railway-url>/api/webhooks/stripe` events: `checkout.session.completed`, `customer.subscription.*` → copy `whsec_...` → `STRIPE_WEBHOOK_SECRET`

## 4) Proxy — Railway
- Root dir: `proxy-server`
- Build: `npm ci && npm start`  Node 20
- Env vars (Railway → Variables):
```
PORT=3001
NODE_ENV=production
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=price_...
FRONTEND_URL=https://your-landing.vercel.app
ALLOWED_ORIGINS=https://your-landing.vercel.app
MAX_REQUESTS_PER_MINUTE=60
```
- Health: `GET /api/health`

## 5) Landing — Vercel
- Root dir: `landing`
- Build cmd: `npm run build`  Output: `dist`
- Env:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PROXY_URL=https://<railway-url>
```
- Redeploy, test Sign In.

## 6) Extension
- `extension/.env`:
```
VITE_PROXY_URL=https://<railway-url>
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=...
```
- `npm run build` → `dist/` → `chrome://extensions` → Load unpacked `dist`
- Publish: zip `dist`, upload to Chrome Web Store; set `host_permissions` if needed.

## 7) Post-deploy checks
- [ ] `curl https://<railway>/api/health` → ok
- [ ] Sign in on landing → Supabase dashboard → user appears
- [ ] Extension Sign In → summarize article → 5 points + readingTime
- [ ] Chat → uses real pageContent not empty
- [ ] Free limit 5 summaries → 429 + Upgrade CTA
- [ ] Checkout → Stripe hosted page → webhook flips `user_plans.plan=pro`
- [ ] `Manage Billing` → portal

## 8) Observability
- Railway logs: `req.method path → status (ms)` + `increment_usage` errors
- Add Sentry later: `SENTRY_DSN` in proxy.

## 9) Rollback
- Vercel auto-rollback, Railway redeploy previous.
- Supabase backups enabled.

Deprecated: `CLERK_UI_GUIDE.md` — Clerk removed. Supabase is single source.
