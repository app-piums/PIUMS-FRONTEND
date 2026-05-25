# Trail of Bits Differential Review — dave vs main

**Date:** 2026-05-25  
**Branch:** dave vs main  
**Scope:** 505 changed files — backend services (auth, payments, booking, catalog, artists, users, chat, notifications, reviews, search), gateway, web apps  
**Methodology:** Surgical — critical paths only (financial flows, auth, access control, new external calls)

---

## Escalation Triggers Found

1. **Security-related code removed:** Stripe Connect transfer logic removed from `payout.service.ts` — replaced with manual admin-controlled payouts. New `completePayout` and `processPayout` flows introduced.
2. **New external calls without safeguards:** `confirmTilopayRedirect` in `payment.service.ts` calls `bookingClient.markPayment` on booking service without first verifying that the requesting user owns that booking. (See FIN-NEW-C1.)
3. **Access control modifier change:** `/api/auth/firebase` rate-limiter changed from `loginLimiter` (10/15 min) to `refreshTokenLimiter` (30/5 min) at the auth-service level, reducing brute-force resistance on the Firebase/Google SSO path. (See AUTH-NEW-M1.)
4. **Previously tracked but still open:** FIN-H1 (Tilopay double-payment via dual callback paths) remains unresolved — the new code creates an additional payment-confirmation path (`confirmTilopayRedirect`) that uses a different idempotency key than the server-to-server webhook (`callback.routes.ts`). (See FIN-H1-UPDATE.)

---

## New Security Findings

### [CRITICAL] FIN-NEW-C1: `confirmTilopayRedirect` marks any booking as paid without ownership check

**File:** `services/payments-service/src/services/payment.service.ts:843–878`  
**Route:** `POST /api/payments/tilopay/confirm` (authenticated, any logged-in user)  
**Blast radius:** All bookings in PENDING or CONFIRMED payment state across all users

**Finding:**  
`confirmTilopayRedirect` fetches the booking from `bookingClient.getBooking(data.bookingId)` but never verifies that `booking.clientId === data.userId`. Any authenticated user can supply an arbitrary `bookingId` in the request body, set `responseCode: '1'` (the Tilopay redirect approval code), and provide a fresh `orderNumber` that does not yet exist in the `paymentIntent` table. The idempotency guard only protects against duplicate processing of the same `orderNumber` — supplying a fresh value bypasses it entirely.

```typescript
// payment.service.ts:843–878
if (!existing) {
  const booking = await bookingClient.getBooking(data.bookingId);
  // *** NO booking.clientId === data.userId check ***
  ...
  await bookingClient.markPayment(data.bookingId, amountCents, "TILOPAY", data.orderNumber);
}
```

The `markPayment` call goes to the internal booking-service endpoint (`/bookings/internal/:id/mark-payment` protected by `internalAuth`), but `payments-service` is already trusted internally and calls it with the attacker-supplied `bookingId`. This triggers the full payout chain: `paidAmount` is incremented on the booking, `paymentStatus` flips to `ANTICIPO_PAID` or `FULLY_PAID`, and `paymentsClient.createPayoutInternal` fires, creating a payout record for the artist.

**Adversarial scenario:**  
1. Attacker registers an account. They know their own `bookingId` (or discover any valid booking ID via `/api/bookings/:id` if the ID format is predictable).  
2. POST `/api/payments/tilopay/confirm` with `{ bookingId: <victim_booking_id>, responseCode: '1', orderNumber: 'any-fresh-uuid', amount: '0' }`.  
3. Server fetches the booking, derives authoritative `amountCents` from `booking.anticipoAmount` or `booking.totalPrice`, records a payment of that amount as SUCCEEDED, and calls `markPayment`.  
4. Victim's booking status flips to paid; artist receives a PENDING payout record; victim gets the service for free.

**Fix:**  
Add `if (booking.clientId !== data.userId) throw new AppError(403, ...)` immediately after the booking is fetched at line 845. The same check already exists correctly in `initCheckout` (line 677).

---

### [HIGH] FIN-H1-UPDATE: FIN-H1 (Tilopay double-payment) remains open after the new code

**File:** `services/payments-service/src/routes/callback.routes.ts:93–134` and `services/payments-service/src/services/payment.service.ts:838–878`  
**Blast radius:** Any Tilopay payment where both the server-to-server webhook and the browser redirect fire simultaneously

**Finding:**  
The prior review flagged FIN-H1 as pending. The new `callback.routes.ts` (server webhook) and `confirmTilopayRedirect` (redirect from browser) use **different idempotency keys**:

- Server webhook (`callback.routes.ts:93`): `providerRef = orderId || ourOrderNumber` where `orderId` is Tilopay's internal ID.
- Browser redirect confirm (`payment.service.ts:839`): `stripePaymentIntentId = data.orderNumber` which is our own reference (`piums_${bookingId}_${ts}`).

These are always distinct values. The `paymentIntent.findFirst({ stripePaymentIntentId })` guard in each path will not detect a duplicate created by the other path. Both paths will create separate `paymentIntent` records and call `bookingClient.markPayment`, doubling the `paidAmount` increment and creating two payout records for the artist.

**Adversarial scenario:**  
Network latency causes both the Tilopay server callback and the client browser redirect to arrive within milliseconds. Each path passes its own idempotency check independently, `paidAmount` doubles, and the artist receives two payouts for one payment.

**Fix:**  
Unify the idempotency key. When creating the Tilopay order, store the `orderNumber` we generate (e.g. `piums_${bookingId}_${ts}`) in the `paymentIntent` table immediately. Both paths should look up by that same `orderNumber` before processing. Alternatively, use the booking ID itself plus a `PROCESSING` lock as the idempotency key and reject the second markPayment call.

---

### [HIGH] AUTH-NEW-H1: Any client can auto-upgrade to dual-role `artista` without admin approval

**File:** `services/auth-service/src/controller/auth.controller.ts:315–318` (email login) and `:949–951` (Firebase login)  
**Blast radius:** All existing `cliente` accounts

**Finding:**  
When any user with `role: 'cliente'` sends `role: 'artista'` in the login request body (`POST /api/auth/login` or `POST /api/auth/firebase`), the auth controller:

1. Calls the artist bootstrap endpoint to create an artist profile.
2. Updates the user's role in the DB from `'cliente'` to `'ambos'`.
3. Issues a JWT with `role: 'ambos'`.

No admin approval, document verification, or any gating condition is required. The artist profile is created with `verificationStatus: 'PENDING'` but the JWT immediately contains `role: 'ambos'`, giving the bearer access to all artist-role-gated endpoints including `changeStatus` (can mark bookings IN_PROGRESS/COMPLETED/NO_SHOW), reschedule respond, and catalog management.

While an unverified artist profile should not surface in public search or be bookable, the JWT role `ambos` grants API-level access that was not intended for unverified artists.

**Adversarial scenario:**  
1. Attacker registers as a client.  
2. Logs in sending `{ email, password, role: 'artista' }`.  
3. Receives a JWT with `role: 'ambos'`, their DB role is permanently changed to `'ambos'`, and an artist profile is created without any document verification.  
4. They can now call `PATCH /api/bookings/:id/status` with artist-only status transitions on any booking where their artist profile ID matches `booking.artistId` (unlikely for a fresh profile, but the role upgrade itself is permanently irreversible).

**Fix:**  
Do not auto-upgrade `cliente` → `ambos` on login. Instead, require an explicit registration flow for artist accounts. The bootstrap call and role upgrade should be gated behind document submission and admin/automatic verification approval. At minimum, require `documentType + documentNumber + documentFrontUrl + documentSelfieUrl` before changing the DB role.

---

### [MEDIUM] FIN-NEW-M1: `initTicketCheckout` caps amount but does not verify purchase ownership

**File:** `services/payments-service/src/services/payment.service.ts:742–784`  
**Blast radius:** All ticket purchases in PENDING payment state

**Finding:**  
`initTicketCheckout` fetches the purchase record to cap the amount server-side (line 754–756), but does not verify that `purchase.clientId === data.userId` (or `purchase.buyerId === data.userId`). Any authenticated user can initiate a checkout for any other user's ticket purchase.

```typescript
// payment.service.ts:754–756
const purchase = await bookingClient.getBooking(data.purchaseId).catch(() => null);
const serverAmount = purchase?.totalPrice != null
  ? Math.min(data.amount, purchase.totalPrice)
  : data.amount;
// *** No purchase.clientId/buyerId === data.userId check ***
```

Unlike `initCheckout` for regular bookings (which has the ownership check at line 677), `initTicketCheckout` skips this validation entirely.

**Adversarial scenario:**  
User B initiates checkout on User A's ticket purchase. The checkout flow is triggered under B's identity but against A's purchase record. If the payment succeeds (unlikely without completing the actual payment), B's payment details are linked to A's purchase.

The practical impact is lower than FIN-NEW-C1 because merely initiating a checkout doesn't mark a purchase as paid — the actual payment must complete through Tilopay/Stripe. However, this creates a confused deputy situation and wastes payment provider API calls.

**Fix:**  
After fetching `purchase` (line 754), add: `if (purchase?.clientId !== data.userId && purchase?.buyerId !== data.userId) throw new AppError(403, ...)`.

---

### [MEDIUM] AUTH-NEW-M1: Firebase login rate limit downgraded at auth-service level

**File:** `services/auth-service/src/routes/auth.routes.ts:40`  
**Blast radius:** Firebase/Google SSO login endpoint

**Finding:**  
`POST /auth/firebase` was previously protected by `loginLimiter` (10 attempts per 15-minute window per `IP+email`). In this diff it was changed to `refreshTokenLimiter` (30 attempts per 5-minute window per IP, with `skipSuccessfulRequests: true`).

```typescript
// Before:
router.post("/firebase", loginLimiter, firebaseLogin);
// After:
router.post("/firebase", refreshTokenLimiter, firebaseLogin);
```

This is a 9x effective increase (from ~40/hour to ~360/hour) in the number of Firebase ID token validation attempts allowed per IP at the service level. While the gateway applies `authRateLimiter` (5/15min) in front of the entire `/api/auth` namespace, if the auth-service is reached directly (e.g., during K8s network policy misconfiguration or load-balancer bypass) the rate limit is much more permissive.

**Fix:**  
Restore `loginLimiter` for `/auth/firebase` or create a dedicated `firebaseLoginLimiter` with similar parameters to `loginLimiter`. Alternatively, accept the current gateway-layer protection as sufficient and document this as a conscious defense-in-depth tradeoff.

---

### [LOW] FIN-NEW-L1: `completedByAdmin` audit field is caller-supplied, not derived from auth context

**File:** `services/payments-service/src/routes/payout.routes.ts:180–182`  
**Blast radius:** Payout audit trail integrity

**Finding:**  
`PATCH /api/payouts/:id/complete-manual` is protected by `x-internal-secret` (only services can call it). However, the `completedByAdmin` field that gets recorded in the database is taken directly from `req.body.completedByAdmin` rather than derived from an authenticated admin identity. Any caller with the internal secret can supply an arbitrary string as the admin ID, making the audit trail unreliable.

**Fix:**  
For manual admin actions triggered via the web-admin UI, thread the real admin's JWT user ID through to the internal call rather than relying on a caller-supplied field. Alternatively, require a JWT admin token in addition to the internal secret for this specific endpoint.

---

### [LOW] API-NEW-L1: `/api/bookings/users/:userId/stats` is unauthenticated

**File:** `services/booking-service/src/routes/booking.routes.ts:274–277`  
**Blast radius:** Booking count disclosure for any user ID

**Finding:**  
`GET /api/bookings/users/:userId/stats` has no authentication middleware. Any unauthenticated request can query the booking count for any user ID. The response only contains `{ total: <number> }`, which is low-sensitivity, but disclosing booking activity counts for arbitrary users is an information leak.

**Fix:**  
Add `authenticateToken` middleware and restrict to the requesting user's own stats (or admin).

---

## Previously Pending Findings — Status Assessment

The following high-priority findings from the prior audit remain unresolved after this diff:

| ID | Status | Notes |
|----|--------|-------|
| FIN-H1 | Still open | New code adds a second payment confirmation path that shares the same root cause; see FIN-H1-UPDATE above |
| INF-H2 | Still open | Containers still run as root (no changes to Dockerfiles on this vector) |
| OPS-H1 | Still open | No correlation ID added |
| OPS-H2 | Still open | No timeout configuration on inter-service HTTP calls |
| OPS-H3 | Still open | No outbox/saga pattern for markPayment reliability |
| PII-H5 | Still open | Admin delete still does not remove Cloudinary documents |
| PII-M1 | Still open | `cardHash` from Tilopay stored in plaintext (`saveProviderToken`) |
| PII-M4 | Still open | KYC document URLs still signed with public Cloudinary URLs |

---

## Positive Security Changes in This Diff

- **FIN-C1 fully fixed:** `initCheckout` now computes `serverAmount` server-side from `booking.anticipoAmount`/`booking.totalPrice` and ignores the client-supplied `amount` entirely (lines 681–689).
- **FIN-M2 partially fixed:** `confirmTilopayRedirect` no longer uses the URL-provided amount — it derives the authoritative amount from the booking record (lines 844–855). However, the ownership check remains absent (see FIN-NEW-C1).
- **Tilopay webhook HMAC verification added:** `callback.routes.ts` now verifies OrderHash V2 before processing any webhook event, with proper `timingSafeEqual` comparison and fail-closed behavior when credentials are not configured.
- **Refund ownership check added:** `getRefundById` and the refund creation path now verify `payment.userId === userId` before allowing access (payment.service.ts:367–370, 481–484).
- **File upload magic-bytes check added:** `verifyMagicBytes` middleware now validates actual file content against declared MIME type using `file-type`, preventing content-type spoofing for document uploads.
- **Coupon optimistic-lock added:** `redeemCoupon` uses a `WHERE currentUses = <read_value>` optimistic lock to prevent race condition on max-use limits.
- **bcrypt work factor increased:** Password hashing upgraded from cost 10 to cost 12.
- **Document deletion ownership check:** `deleteDocument` verifies the URL belongs to the authenticated user by cross-referencing with auth-service before allowing deletion.
- **Booking creation requires KYC:** `createBooking` now calls `usersClient.checkClientIdentity` and rejects users without submitted identity documents.
- **Admin-only stats endpoints properly gated:** `/bookings/stats/admin`, `/bookings/admin/search`, `/bookings/admin/:id` now accept either `x-internal-secret` or a JWT with `admin` role.
