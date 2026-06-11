# Trail of Bits Insecure Defaults — Piums Platform

**Date:** 2026-05-25
**Branch:** `dave`
**Scope:** `services/*/src/**/*.ts`, `apps/gateway/src/**/*.ts`
**Methodology:** grep-based pattern detection + production config verification against `infra/k8s/base/` and `infra/k8s/overlays/production/`
**Excluded:** Findings already covered by INF-C1 through INF-C4 in `docs/security-review-2026-05-25.md` (those credentials were rotated by the user).

---

## CRITICAL (fail-open in production)

---

### ID-C1: `services/auth-service/src/index.ts:34` — SESSION_SECRET falls back to predictable hardcoded string

**Pattern:**
```typescript
secret: process.env.SESSION_SECRET || 'piums-session-secret',
```

**Verification:** `SESSION_SECRET` does not appear in `infra/k8s/base/secrets.yaml` and is not added by the production overlay (`infra/k8s/overlays/production/kustomization.yaml`). It only exists in `infra/k8s/overlays/local/dev-secrets.yaml` (local dev only). In production, express-session signs all OAuth session cookies with the literal string `piums-session-secret`.

**Production impact:** Any attacker who knows this (publicly visible) default can forge or tamper with express-session cookies. Since Passport.js uses this session to store the OAuth state parameter and intermediate profile data during Google/Facebook/TikTok flows, a forged session can link an OAuth identity to an arbitrary account.

**Exploitation:** Attacker signs a crafted `connect.sid` cookie with `piums-session-secret`, injects a fraudulent OAuth user profile into session storage, and completes the OAuth flow to take over any account.

**Fix:** Add `SESSION_SECRET: "CHANGE_ME_STRONG_SESSION_SECRET_MIN_32_CHARS"` to `infra/k8s/base/secrets.yaml`. Add the startup guard:
```typescript
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL: SESSION_SECRET no definido en producción');
  process.exit(1);
}
```

---

### ID-C2: `services/payments-service/src/middleware/auth.middleware.ts:63` — INTERNAL_SERVICE_SECRET falls back to known default string

**Pattern:**
```typescript
const expectedSecret = process.env.INTERNAL_SERVICE_SECRET || 'dev_internal_secret_piums';
```

**Verification:** `INTERNAL_SERVICE_SECRET` is absent from `infra/k8s/base/secrets.yaml`. The default value `'dev_internal_secret_piums'` is the exact same value hardcoded in `infra/k8s/overlays/local/dev-secrets.yaml:44` and in `services/chat-service/.env:7`. Any attacker who has read access to this repository (or its git history) knows the production internal secret.

**Applied to:** `POST /api/coupons/redeem` (via `internalAuth` in `services/payments-service/src/routes/coupon.routes.ts:22`). This endpoint calls `couponService.redeemCoupon(couponId, userId, bookingId, discountApplied)` which increments `currentUses` and records the usage.

**Production impact (mitigation noted):** Payments-service pods are `ClusterIP` — not reachable from the public internet. The gateway routes `/api/coupons` with `authMiddleware` first. However, any compromised pod inside the `piums` namespace, or a developer with `kubectl port-forward` access, can bypass internalAuth with the known default and redeem arbitrary coupons for arbitrary users without a valid booking, or artificially exhaust coupon budgets.

**Exploitation:** From inside the cluster: `curl -X POST http://payments-service:4005/api/coupons/redeem -H "x-internal-secret: dev_internal_secret_piums" -d '{"couponId":"...","userId":"...","bookingId":"...","discountApplied":10000}'`

**Fix:** Add `INTERNAL_SERVICE_SECRET: "CHANGE_ME_INTERNAL_SECRET_MIN_32_CHARS"` to `infra/k8s/base/secrets.yaml`. Change the fallback to the fail-secure pattern used by all other services:
```typescript
const expectedSecret = process.env.INTERNAL_SERVICE_SECRET || '';
if (!expectedSecret || secret !== expectedSecret) { return next(new AppError(403, '...')); }
```
Add a startup guard identical to the JWT_SECRET guards already present in this file.

---

### ID-C3: `apps/gateway/src/middleware/auth.ts:5` — JWT_SECRET falls back to weak default with no startup guard

**Pattern:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_CHANGE_ME";
```

**Verification:** `JWT_SECRET` IS defined in `infra/k8s/base/secrets.yaml` (as `CHANGE_ME_STRONG_SECRET_MIN_32_CHARS`). However, unlike every other service (`artists-service`, `booking-service`, `catalog-service`, `payments-service`, `reviews-service`, `users-service`), the gateway has **no startup guard** — it silently falls back to `"dev_secret_CHANGE_ME"` if the secret is misconfigured or the Kubernetes Secret mount fails. The auth-service `token.service.ts` calls `process.exit(1)` on this condition; the gateway does not.

**Production impact:** If `JWT_SECRET` is missing from the K8s Secret (e.g., after a botched secret rotation, a missing `secretRef`, or a new deployment before secrets are applied), the gateway continues to serve traffic but verifies JWTs signed with `"dev_secret_CHANGE_ME"`. An attacker can forge arbitrary JWTs signed with this key and gain authenticated access to all protected API endpoints.

**Exploitation:** `jwt.sign({ id: '<victim_user_id>', role: 'admin' }, 'dev_secret_CHANGE_ME', { expiresIn: '1h' })` — gateway accepts this as a valid admin session.

**Fix:** Match the pattern used by all other services:
```typescript
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  logger.error('FATAL: JWT_SECRET no definido en produccion');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_CHANGE_ME';
```

---

### ID-C4: `services/chat-service/src/middleware/auth.middleware.ts:27,53` — JWT_SECRET inline fallback, no startup guard

**Pattern:**
```typescript
jwt.verify(token, process.env.JWT_SECRET || 'dev-only-secret-not-for-production')
```

**Verification:** Same as ID-C3 — `JWT_SECRET` should be set in production but chat-service has no guard. The default `'dev-only-secret-not-for-production'` is an obvious, publicly known string. The same fallback appears in both HTTP auth and WebSocket auth paths, meaning a silent misconfiguration opens both REST and WebSocket endpoints to JWT forgery.

**Production impact:** Forged JWT grants full access to real-time chat (read/write all messages). In combination with `getConversation()` membership checks, this is partially mitigated, but an attacker could still join any existing conversation they have a booking ID for.

**Fix:** Add startup guard identical to other services. The guard should be in `services/chat-service/src/index.ts` before the server starts, not inline in the auth middleware.

---

## MEDIUM (fail-open but mitigated by network boundary)

---

### ID-M1: `services/payments-service/src/providers/tilopay.provider.ts:13-16` — Tilopay credentials fall back to empty string

**Pattern:**
```typescript
const TILOPAY_WEBHOOK_SECRET = process.env.TILOPAY_WEBHOOK_SECRET || '';
const TILOPAY_API_KEY = process.env.TILOPAY_API_KEY || '';
const TILOPAY_API_SECRET = process.env.TILOPAY_API_SECRET || '';
const TILOPAY_API_USER = process.env.TILOPAY_API_USER || '';
```

**Verification:** None of `TILOPAY_WEBHOOK_SECRET`, `TILOPAY_API_KEY`, `TILOPAY_API_SECRET`, or `TILOPAY_API_USER` appear in `infra/k8s/base/secrets.yaml`. They are only in `infra/k8s/overlays/local/dev-secrets.yaml` (local env). These must be manually added to the production Secret before go-live.

**Production impact:** If any Tilopay credential is missing in production:
- Empty `TILOPAY_API_KEY`/`TILOPAY_API_SECRET`: `getTilopayToken()` will attempt to authenticate with empty credentials — Tilopay will reject the request, all payments fail.
- Empty `TILOPAY_WEBHOOK_SECRET`: `verifyWebhookSignature()` (V1 legacy path) returns `false` immediately (line 260: `if (!TILOPAY_WEBHOOK_SECRET) return false`) — fail-secure.
- Empty `TILOPAY_API_KEY` or `TILOPAY_API_SECRET` in `verifyOrderHashV2()`: returns `false` (line 222: `if (!TILOPAY_API_KEY || !TILOPAY_API_SECRET) return false`) — webhook verification disabled, all callbacks discarded silently.

**Mitigation:** The V2 orderHash verification already fails-secure when credentials are empty. The V1 legacy path also fails-secure. The risk is that missing credentials silently disable payment processing (outage) rather than a security bypass. However, if `TILOPAY_API_KEY` is present but `TILOPAY_API_SECRET` is not, `verifyOrderHashV2` would skip verification — an attacker could send a fake webhook and get a booking confirmed for free.

**Fix:** Add all four Tilopay variables to `infra/k8s/base/secrets.yaml`. Add a startup guard in `payments-service/src/index.ts`:
```typescript
const required = ['TILOPAY_API_KEY', 'TILOPAY_API_SECRET', 'TILOPAY_API_USER', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];
for (const key of required) {
  if (!process.env[key]) { console.error(`FATAL: ${key} not set`); process.exit(1); }
}
```

---

### ID-M2: `services/payments-service/src/providers/stripe.provider.ts:11-12` — Stripe credentials fall back to empty string

**Pattern:**
```typescript
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
```

**Verification:** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` ARE in `infra/k8s/base/secrets.yaml` (with `CHANGE_ME` placeholders). However, if the env var is an empty string rather than absent, the `||` won't fall back — Stripe SDK will be initialized with an empty key and all API calls will fail with authentication errors at runtime (not startup).

**Production impact:** If the secret rotation sets an empty string (e.g., a botched `kubectl apply`), Stripe SDK initializes silently and all payment operations throw `AuthenticationError` at runtime. Webhook verification will also throw, causing 500s instead of 400s. No silent bypass — fails loudly.

**Mitigation:** Stripe SDK throws on invalid/empty key — effectively fail-secure from a security perspective. The risk is purely operational (payments down, not insecure).

**Fix:** Add to the startup guard described in ID-M1. Use `if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_'))` for tighter validation.

---

### ID-M3: `services/payments-service/src/services/payment.service.ts:586` and `services/booking-service/src/services/booking.service.ts:1165` — PLATFORM_FEE_PERCENTAGE falls back to 18%

**Pattern:**
```typescript
const PLATFORM_FEE = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || "18");
```

**Verification:** `PLATFORM_FEE_PERCENTAGE` is not in `infra/k8s/base/configmap.yaml`. Not a security bypass, but a financial default that silently activates if the variable is missing.

**Production impact:** If the variable is missing, the platform takes 18% commission on every payout. This is the intended rate, so the default is correct — however it creates an invisible coupling between the code and the business rule. A future rate change that sets the env var to `0` would silently override to `0`.

**Note:** This was partially addressed in FIN-M1 of the prior security review (a startup warning was added, not a hard exit). The fail-open path still exists.

**Fix:** As recommended in FIN-M1 — if `PLATFORM_FEE_PERCENTAGE` is undefined at startup, call `process.exit(1)` rather than falling back silently.

---

### ID-M4: Multiple services — INTERNAL_SERVICE_SECRET falls back to empty string (mostly fail-secure, one gap)

**Files with `|| ''` pattern (fail-secure — empty string disables internal auth properly):**
- `services/artists-service/src/controller/artist-dashboard.controller.ts:14`
- `services/auth-service/src/clients/booking.client.ts:5`
- `services/auth-service/src/clients/notifications.client.ts:227`
- `services/booking-service/src/middleware/auth.middleware.ts:11` (guard: `if (!INTERNAL_SECRET || secret !== INTERNAL_SECRET)`)
- `services/booking-service/src/routes/booking.routes.ts:283,299,317,332` (guard: `if (INTERNAL_SECRET && secret === INTERNAL_SECRET)`)
- `services/chat-service/src/services/chat.service.ts:400`
- All other service clients

**Verification:** The guard patterns `if (!INTERNAL_SECRET || ...)` and `if (INTERNAL_SECRET && ...)` both fail-secure when `INTERNAL_SECRET = ''` — internal endpoints fall back to requiring JWT/admin auth. These are correctly implemented.

**One exception (already reported as ID-C2):** `payments-service/src/middleware/auth.middleware.ts:63` uses a non-empty default (`'dev_internal_secret_piums'`) instead of `''`.

**Action:** No further action needed for the `|| ''` instances beyond adding the variable to production secrets so the internal-service auth mechanism actually works.

---

## LOW (fail-open, benign or theoretical)

---

### ID-L1: `services/auth-service/src/services/token.service.ts:38-39` — JWT expiry falls back to permissive values

**Pattern:**
```typescript
private readonly JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
private readonly JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
```

**Assessment:** The defaults are reasonable and match the stated security model (15 min access / 7 day refresh). Not a fail-open vulnerability — if the variable is missing, behavior is correct. Low risk.

---

### ID-L2: `apps/gateway/src/middleware/rateLimiter.ts:7` — Global rate limit falls back to 2000 req/15min

**Pattern:**
```typescript
max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "2000"),
```

**Verification:** INF-M1 from the prior security review addressed this — `RATE_LIMIT_MAX_REQUESTS: "100"` was added to `infra/k8s/base/configmap.yaml`. Confirmed present. This fallback is no longer reachable in production.

**Status:** RESOLVED by prior audit (INF-M1).

---

### ID-L3: `services/auth-service/src/index.ts:30` — CORS falls back to localhost origins

**Pattern:**
```typescript
cors({ credentials: true, origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'] })
```

**Verification:** `ALLOWED_ORIGINS` is set in `infra/k8s/base/configmap.yaml:27` to the correct production origins. The localhost fallback is unreachable in production. INF-M4 from the prior audit confirmed `localhost` origins were removed from the production configmap.

**Status:** RESOLVED by prior audit (INF-M4). Localhost fallback is defense-in-depth only.

---

## Excluded (fail-secure or test-only)

| Pattern | File(s) | Reason excluded |
|---|---|---|
| `JWT_SECRET \|\| 'dev-only-secret-not-for-production'` with `process.exit(1)` guard | `artists-service`, `booking-service`, `catalog-service`, `payments-service`, `reviews-service`, `users-service` auth middlewares | Guard fires before the fallback is ever used in production — fail-secure |
| `STRIPE_WEBHOOK_SECRET \|\| ""` | `payments-service/src/providers/stripe.provider.ts:12` | Stripe SDK throws `AuthenticationError` on empty key — no silent bypass |
| `TILOPAY_WEBHOOK_SECRET \|\| ''` | `payments-service/src/providers/tilopay.provider.ts:13` | `verifyWebhookSignature` returns `false` when empty — fail-secure |
| `NODE_ENV \|\| 'development'` | Multiple health routes | Informational log only, not a security boundary |
| `ALLOWED_ORIGINS \|\| ['http://localhost:3000']` | All services | Production configmap supplies the value; localhost fallback unreachable |
| `RATE_LIMIT_MAX_REQUESTS \|\| "2000"` | `apps/gateway/src/middleware/rateLimiter.ts` | Production configmap supplies `"100"` — fallback unreachable |
| `REDIS_PORT \|\| '6379'` | `services/chat-service/src/websocket/chat.gateway.ts` | Default port is correct standard; no credential leak |
| `VIATICOS_*_CENTS \|\| number` | `catalog-service/src/services/pricing.service.ts:189-191` | Business logic defaults, not security boundaries |
| `MIN_RATING \|\| "1"`, `MAX_RATING \|\| "5"` | `reviews-service/src/schemas/review.schema.ts` | Input validation defaults — no security impact |
| Internal service URL fallbacks (`http://service-name:port`) | All `*/src/clients/*.ts` | Cluster-internal DNS fallbacks; not credentials; no bypass |

---

## Production secrets gap summary

The following secrets are **referenced in code** but **absent from `infra/k8s/base/secrets.yaml`**, meaning they must be added before the production Secret is applied, or they will be silently missing:

| Secret | Severity | Default if missing | Code location |
|---|---|---|---|
| `SESSION_SECRET` | **CRITICAL** | `'piums-session-secret'` | `auth-service/src/index.ts:34` |
| `INTERNAL_SERVICE_SECRET` | **CRITICAL** | `'dev_internal_secret_piums'` (payments-service) | `payments-service/src/middleware/auth.middleware.ts:63` |
| `TILOPAY_API_KEY` | HIGH | `''` (payments disabled) | `payments-service/src/providers/tilopay.provider.ts:14` |
| `TILOPAY_API_SECRET` | HIGH | `''` (webhook verification disabled) | `payments-service/src/providers/tilopay.provider.ts:15` |
| `TILOPAY_API_USER` | HIGH | `''` (payments disabled) | `payments-service/src/providers/tilopay.provider.ts:16` |
| `TILOPAY_WEBHOOK_SECRET` | MEDIUM | `''` (V1 verification skipped) | `payments-service/src/providers/tilopay.provider.ts:13` |
| `TILOPAY_API_URL` | LOW | `'https://app.tilopay.com/api/v1'` (correct prod URL) | `payments-service/src/providers/tilopay.provider.ts:12` |
| `CLIENT_APP_URL` | LOW | `'https://client.piums.io'` (correct) | `booking-service/src/utils/notifications.ts:6` |
| `ARTIST_APP_URL` | LOW | `'https://artist.piums.io'` (correct) | `booking-service/src/utils/notifications.ts:7` |
| `PLATFORM_FEE_PERCENTAGE` | MEDIUM | `18` (correct but silent) | `payments-service/src/services/payment.service.ts:586` |
