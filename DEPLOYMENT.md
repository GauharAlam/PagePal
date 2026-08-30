# Production Deployment — Railway (proxy) + Vercel (landing)

This repo is production-ready: Supabase Auth everywhere + Stripe Pro + AES-256 encrypted BYOK.

## 1) Supabase Setup
1. Create project at supabase.com → copy `SUPABASE_URL`, `anon key`, `service_role`
2. SQL Editor → run `supabase_schema.sql` (includes `increment_usage` RPC + indexes + idempotency tables)
3. Auth → Providers → Enable Google OAuth (add origin `https://your-landing.vercel.app` + `chrome-extension://<extension-id>`)
4. Auth → URL Config → Site URL = `https://your-landing.vercel.app`, Redirect `/*`

## 2) AI Providers (Anthropic or OpenRouter)
- Anthropic: console.anthropic.com → create `ANTHROPIC_API_KEY` (claude-sonnet-4-6)
- OpenRouter: openrouter.ai/keys → create `OPENROUTER_API_KEY`

## 3) Stripe ($9/mo Pro)
1. dashboard.stripe.com → Products → Create `Pro` $9 recurring → copy `price_***`
2. Developers → API keys → `STRIPE_SECRET_KEY=sk_live_...`
3. Webhooks → Add endpoint `https://<railway-url>/api/webhooks/stripe` events: `checkout.session.completed`, `customer.subscription.*` → copy `whsec_...` → `STRIPE_WEBHOOK_SECRET`

## 4) Proxy — Railway / Render / Fly.io / Docker
- Root dir: `proxy-server` (or deploy via `proxy-server/Dockerfile`)
- Build: `npm ci && npm start` (Node 20+)
- Env vars:
```env
PORT=3001
NODE_ENV=production
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
ANTHROPIC_API_KEY=sk-ant-...
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=z-ai/glm-4.5
ENCRYPTION_SECRET=your_64_char_hex_secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
FRONTEND_URL=https://your-landing.vercel.app
ALLOWED_ORIGINS=https://your-landing.vercel.app
MAX_REQUESTS_PER_MINUTE=60
```
- Health check: `GET /api/health`

## 5) Landing — Vercel
- Root dir: `landing`
- Build cmd: `npm run build`  Output: `dist`
- Env vars:
```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_PROXY_URL=https://<your-proxy-url>
```
- Redeploy, test Sign In & AuthSync.

## 6) Extension
- `extension/.env`:
```env
VITE_PROXY_URL=https://<your-proxy-url>
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```
- `npm run build` → `dist/` → `chrome://extensions` → Load unpacked `dist`
- Publish: zip contents of `dist/`, upload to Chrome Web Store.

## 7) Post-Deploy Verification
- [ ] `curl https://<proxy-url>/api/health` → `status: "ok"`
- [ ] Sign in on landing → user appears in Supabase dashboard
- [ ] Extension side panel opens on any web page
- [ ] Summarize article → 5 bullet takeaways + sentiment
- [ ] Grounded chat with markdown rendering
- [ ] Free limit enforcement (5 summaries/day) → 429 + Upgrade CTA
- [ ] Checkout flow flips `user_plans.plan = 'pro'` via idempotent webhook
