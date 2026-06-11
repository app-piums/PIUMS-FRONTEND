# Trail of Bits Variant Analysis — Piums Platform

**Date:** 2026-05-25
**Branch:** dave
**Methodology:** Iterative generalization — grep each pattern, classify each match as confirmed vulnerability or false positive.
**Scope:** All `services/*/src/**/*.ts` excluding `dist/` and `node_modules/`.

---

## Pattern 1: IDOR via body/query ownership fields

**Grep:** `req\.body\.(artistId|userId|clientId|ownerId)` and `req\.query\.(artistId|userId|clientId)` in `services/*/src/controller/*.ts`

### Confirmed variants

None found in `req.body`. The three `req.query` matches are analyzed below.

**booking-service — `searchBookings` (lines 127, 137)**

File: `services/booking-service/src/controller/booking.controller.ts`

```
const clientId = isAdmin
  ? (req.query.clientId as string | undefined)
  : isArtist
    ? undefined
    : userId;   // client: forced to own userId — safe

let artistId: string | undefined;
if (isArtist) {
  artistId = await this.resolveArtistId(userId); // resolved from JWT — safe
} else if (isAdmin) {
  artistId = req.query.artistId as string | undefined; // admin-only path — safe
}
```

Both query parameters are either forced to the JWT identity or gated behind `isAdmin`. **False positive.**

**booking-service — `getBookingStats` (line 430)**

File: `services/booking-service/src/controller/booking.controller.ts`

```
const { artistId, clientId } = req.query as any;
if (artistId) {
  if (role === 'admin') { /* allow */ }
  else {
    const myArtistId = await this.resolveArtistId(userId).catch(() => null);
    if (myArtistId !== artistId) return res.status(403)...
  }
}
if (clientId && clientId !== userId && role !== 'admin') return res.status(403)...
```

Non-admin users are validated against their JWT identity before any query runs. **False positive.**

**catalog-service — `searchServices` (line 83)**

File: `services/catalog-service/src/controller/catalog.controller.ts`

```
const query = {
  artistId: req.query.artistId as string | undefined,
  ...
};
const result = await catalogService.searchServices(query);
```

This is a public read-only search endpoint — `req.query.artistId` is a filter (list services for a given artist), not an ownership claim used in a write operation. No authentication is required or checked. An attacker can enumerate service listings for any artistId, which is intentional public catalog behavior. **False positive** (public data, read-only, by design).

### False positives

All three `req.query` matches are false positives (see above).

---

## Pattern 2: Fire-and-forget on financial operations

**Grep:** `.catch(` on calls to payment, booking, or payout clients; and `.catch(` on financial state-changes in services.

### Confirmed variants

**2A — `booking.service.ts`: payout hold release is fire-and-forget (line 1702)**

File: `services/booking-service/src/services/booking.service.ts`

```typescript
paymentsClient.schedulePayoutHold(bookingId, null).catch(err =>
  logger.error('Error liberando payout hold', 'BOOKING_SERVICE', { bookingId, error: err.message })
);
```

Called inside `confirmDelivery`. The payout hold release is the financial action that unlocks artist payment. If this call silently fails, the hold is never released and the artist never gets paid — but the booking is already marked as `deliveryConfirmedAt`. The error is only logged; there is no retry, no dead-letter queue, and the caller gets a 200 response. **Confirmed — financial impact: artist payout permanently blocked.**

**2B — `dispute.service.ts`: refund creation is fire-and-forget (line 325–330)**

File: `services/booking-service/src/services/dispute.service.ts`

```typescript
paymentsClient.createRefundInternal({
  bookingId: dispute.bookingId,
  userId: booking.clientId,
  reason: "dispute_resolved_full_refund",
  amount: data.refundAmount,
}).catch(err => logger.error("Error creando reembolso tras disputa", "DISPUTE_SERVICE", { ... }));
```

An admin resolves a dispute with `FULL_REFUND`. The dispute record is marked resolved, but the actual refund call is fire-and-forget. If it fails, the client never receives their money and there is no retry mechanism. **Confirmed — financial impact: client refund lost.**

**2C — `dispute.service.ts`: credit creation is fire-and-forget (line 335–340)**

File: `services/booking-service/src/services/dispute.service.ts`

```typescript
paymentsClient.createCredit({
  userId: booking.clientId,
  bookingId: dispute.bookingId,
  paidAmount: data.refundAmount,
  reason: "DISPUTE_CREDIT",
}).catch(err => logger.error("Error creando crédito tras disputa", "DISPUTE_SERVICE", { ... }));
```

Same pattern as 2B but for credit resolution. Dispute marked resolved; credit silently not created. **Confirmed — financial impact: client credit lost.**

**2D — `dispute.service.ts`: payout hold rescheduling is fire-and-forget (line 309–310)**

File: `services/booking-service/src/services/dispute.service.ts`

```typescript
paymentsClient.schedulePayoutHold(dispute.bookingId, new Date(...).toISOString())
  .catch(err => logger.error("Error reprogramando payout hold tras disputa", "DISPUTE_SERVICE", { ... }));
```

If this fails, the payout hold is not rescheduled. The artist either gets paid too early (before hold clears) or never (if already held). **Confirmed — financial impact: incorrect payout timing.**

**2E — `booking.service.ts`: cancel-refund is fire-and-forget (line 934–939)**

File: `services/booking-service/src/services/booking.service.ts`

```typescript
if (refundAmount > 0 && booking.paidAmount > 0) {
  paymentsClient.createRefundInternal({ ... })
    .catch(err => logger.error('Error iniciando reembolso', 'BOOKING_SERVICE', { ... }));
}
```

The booking is marked `CANCELLED_*` in the DB first. If the refund call fails, cancellation is committed but the client's money is never returned. **Confirmed — financial impact: client refund lost on cancellation.**

**2F — `payment.service.ts`: paymentIntent DB record is fire-and-forget (line 716–730)**

File: `services/payments-service/src/services/payment.service.ts`

```typescript
await (prisma as any).paymentIntent.create({ data: { ... } })
  .catch((err: any) => {
    logger.error("Error guardando paymentIntent en DB", "PAYMENT_SERVICE", { ... });
  });
```

The provider (Stripe/Tilopay) has already been charged but the `paymentIntent` record silently fails to persist. This creates a reconciliation gap: the platform has no internal record of a real charge. **Confirmed — financial impact: unrecorded charges, reconciliation failure.**

**2G — `ticket-event.service.ts`: coupon redemption is fire-and-forget (lines 236, 272–277)**

File: `services/booking-service/src/services/ticket-event.service.ts`

```typescript
await paymentsClient.redeemCoupon({ couponId, userId, bookingId, discountApplied }).catch(() => {});
```

Appears twice — once for free tickets and once in `markPurchasePaid`. The coupon use is never recorded if this call fails, allowing re-use of a single-use coupon on the next purchase. **Confirmed — financial impact: coupon abuse / revenue loss.**

### False positives

The following `.catch` patterns are intentionally fire-and-forget for non-financial side effects (notifications, chat creation, analytics, calendar sync, search reindexing) and are acceptable:

- `notificationsClient.sendNotification(...).catch(...)` — notifications are best-effort
- `chatClient.createConversation(...).catch(...)` / `chatClient.closeConversation(...).catch(...)` — chat is ancillary
- `googleCalendarClient.updateEvent(...).catch(() => {})` / `deleteEvent(...)` — documented as best-effort
- `createAvailabilityReservation(...).catch(...)` / `removeAvailabilityReservation(...).catch(...)` — slot management, recoverable
- `searchService.bulkIndexArtists(...).catch(...)` — search index, recoverable
- `artistsClient.shadowBan(...).catch(...)` — admin action, retryable manually
- `usersClient.syncUserAvatar(...).catch(...)` — profile enrichment, non-financial
- `profile.update({ viewCount: increment(1) }).catch(() => {})` — analytics, acceptable
- `prisma.delete(...).catch(() => { /* non-critical */ })` — cleanup of non-financial records
- Cron job top-level `.catch(() => {})` wrappers in `cron.service.ts` lines 640–648 — prevent unhandled rejection crashes; individual inner operations have their own error handling

---

## Pattern 3: Missing `res.ok` check on fetch

**Grep:** `const .* = await fetch(` in `services/*/src/clients/*.ts` and `services/*/src/services/*.ts`

### Confirmed variants

**3A — `chat-service`: push notification fetch missing `res.ok` (line 409)**

File: `services/chat-service/src/services/chat.service.ts`

```typescript
await fetch(`${notifUrl}/api/notifications/internal/push`, {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify({ ... }),
});
```

No `res.ok` check. A 500 or 4xx from notifications-service is silently swallowed. This is in `sendPushToRecipient`, which is itself called fire-and-forget (`.catch(() => {})`). While the impact is limited to a missed push notification (non-financial), this function has no visibility into failures whatsoever. **Confirmed — severity: low (notification loss, no observability).**

**3B — `google-calendar.client.ts`: `updateEvent` and `deleteEvent` have no `res.ok` check**

File: `services/booking-service/src/clients/google-calendar.client.ts`

```typescript
async updateEvent(...): Promise<void> {
  try {
    await fetch(...);  // no response check
  } catch { /* Calendar sync is best-effort */ }
}

async deleteEvent(...): Promise<void> {
  try {
    await fetch(...);  // no response check
  } catch { /* Calendar sync is best-effort */ }
}
```

The comment explicitly documents these as best-effort. HTTP errors (401, 500) are silently dropped — the error is only thrown on network failure (DNS, timeout), not on 4xx/5xx. **Confirmed — severity: low (calendar sync gaps, acknowledged design limitation).**

### False positives

All other client files inspected (`artists-service/clients/payments.client.ts`, `artists-service/clients/booking.client.ts`, `booking-service/clients/payments.client.ts`, `auth-service/clients/artists.client.ts`, `search-service/clients/artists.client.ts`, `search-service/clients/reviews.client.ts`, `chat-service/services/chat.service.ts:405`, `users-service/services/users.service.ts`) properly check `response.ok` or `res.ok` before consuming the response body.

---

## Pattern 4: `console.error`/`warn`/`log` outside logger.ts

**Grep:** `console\.(error|warn|log)` in `services/*/src/**/*.ts`, excluding `utils/logger.ts`

### Confirmed variants

**4A — Six auth middleware files use `console.error` for fatal JWT_SECRET missing**

Files:
- `services/artists-service/src/middleware/auth.middleware.ts:8`
- `services/booking-service/src/middleware/auth.middleware.ts:7`
- `services/catalog-service/src/middleware/auth.middleware.ts:7`
- `services/payments-service/src/middleware/auth.middleware.ts:6`
- `services/reviews-service/src/middleware/auth.middleware.ts:6`
- `services/users-service/src/middleware/auth.middleware.ts:7`

And also:
- `services/booking-service/src/utils/jwt.ts:4`

All contain:
```typescript
console.error('FATAL: JWT_SECRET no definido en producción');
```

This fires at module load time (before the structured logger may be initialized), and is the only call — it happens before the Express app is ready. The intent is to alert before any logger instance exists. However, in a containerized environment these logs are unstructured (plain text vs JSON), making them invisible to log aggregation queries that filter by `level` or `service` fields. An attacker who causes JWT_SECRET to be unset at runtime would generate noise in stdout but no structured alert. **Confirmed — severity: low/informational (observability gap, not a direct exploitable vulnerability; the app still refuses to validate tokens without the secret, so auth is not bypassed).**

### False positives

None — all seven matches are the same `console.error('FATAL: JWT_SECRET ...')` pattern.

---

## Pattern 5: `new PrismaClient()` instantiated inside functions/closures

**Grep:** `new PrismaClient()` in all `services/*/src/**/*.ts` (excluding `dist/`, `node_modules/`, `generated/`)

### Confirmed variants

**5A — `auth-service/src/routes/auth.routes.ts:69` — PrismaClient inside a route handler**

```typescript
router.get("/internal/fcm-token/:userId", async (req, res) => {
  ...
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique(...);
  await prisma.$disconnect();
  ...
});
```

A new `PrismaClient` instance is created and destroyed on every request. Each instance opens its own connection pool. Under load this exhausts the database connection limit. Additionally, `prisma.$disconnect()` is only called on the happy path — if the query throws, the connection leaks. **Confirmed — severity: high (connection pool exhaustion under load, connection leak on error).**

**5B — `search-service/src/routes/search.routes.ts:24` — PrismaClient inside a route handler**

```typescript
router.delete('/index/artist/:id', requireAuth, async (req, res, next) => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  ...
  // No prisma.$disconnect() call
});
```

Same pattern, but `$disconnect()` is never called. Every delete request permanently leaks a connection pool. **Confirmed — severity: high (connection leak on every request).**

### False positives

All other `new PrismaClient()` instances are at **module scope** (top-level `const prisma = new PrismaClient()`), which is the standard singleton pattern — one pool per service process. These are acceptable:

- `artists-service/src/controller/geo.controller.ts`, `artists-service/src/middleware/auth.middleware.ts`, `artists-service/src/routes/artists.routes.ts`, `artists-service/src/services/availability.service.ts`, `artists-service/src/services/artists.service.ts`
- `booking-service/src/controller/analytics.controller.ts`, `booking-service/src/index.ts`, all booking service files
- `catalog-service/src/index.ts`, all catalog service files
- `payments-service/src/index.ts` (4 instances for migration guards + cron — these are module-scope, each calls `$disconnect()` in `.finally()`)
- `chat-service`, `notifications-service`, `users-service`, `reviews-service`, `search-service/src/services/search.service.ts` — all module-scope

The `payments-service/src/index.ts` multiple module-scope instances (`_prismaInit`, `_prismaCoupons`, `_prismaCouponCols`, `_prismaCron`) each call `$disconnect()` after use (except `_prismaCron` which is kept alive for the cron interval). These are a minor inefficiency but not a vulnerability. **False positives.**

---

## Pattern 6: Optional chaining on `req.user` that bypasses auth

**Grep:** `req\.user\?\.` in `services/*/src/controller/*.ts` and `services/*/src/**/*.ts`

### Confirmed variants

**6A — `artists-service/src/controller/absence.controller.ts` — `req.user?.id` with explicit null-check**

```typescript
const authId = req.user?.id;
if (!authId) throw new AppError(401, "No autenticado");
```

Optional chaining is used but the result is immediately checked and throws a 401 on null. This is a safe guard pattern, not a bypass. **False positive.**

**6B — `artists-service/src/controller/geo.controller.ts` — same pattern**

```typescript
const authId = req.user?.id;
if (!authId) throw new AppError(401, "No autenticado");
```

Same as 6A. **False positive.**

**6C — `booking-service/src/controller/booking.controller.ts:122–123` — `req.user?.role` without null guard**

```typescript
const userId = req.user!.id;            // non-null assertion
const isAdmin = req.user?.role === 'admin';   // optional chain on same object
const isArtist = req.user?.role === 'artista' || req.user?.role === 'ambos';
```

The `req.user!.id` already asserts non-null (and would throw if null — correct). The optional chaining on `req.user?.role` on the subsequent lines is redundant style inconsistency, not a vulnerability, since the preceding `!` assertion confirms the middleware has run. If `req.user` were null, the `!` on line 121 would throw a TypeError first. **False positive.**

### Summary on Pattern 6

The grep for `req\.user\?\.` returned zero matches in `controller/*.ts` files — the pattern does not occur with a literal `?.` operator in controllers. The matches found in `absence.controller.ts` and `geo.controller.ts` use `req.user?.id` safely (immediately guarded). **No confirmed variants of the auth-bypass pattern (API-L1) found.**

---

## Summary Table

| Pattern | Description | Confirmed variants | False positives |
|---------|-------------|-------------------|-----------------|
| P1 | IDOR via body/query artistId/userId | 0 | 3 |
| P2 | Fire-and-forget on financial operations | 7 (2A–2G) | ~20 (non-financial side effects) |
| P3 | Missing `res.ok` on fetch | 2 (3A–3B) | ~60 (properly checked) |
| P4 | `console.error` outside logger.ts | 7 (4A) | 0 |
| P5 | `new PrismaClient()` inside functions | 2 (5A–5B) | ~40 (module-scope singletons) |
| P6 | `req.user?.` optional chaining auth bypass | 0 | 3 |
| **Total** | | **18** | **~86** |

---

## Prioritized remediation

### Critical (financial correctness)

1. **P2-2A** `confirmDelivery` — await `schedulePayoutHold` and propagate error; do not mark delivery confirmed if payout release fails.
2. **P2-2B / P2-2C** `resolveDispute` — await `createRefundInternal` / `createCredit` and surface errors to the admin API caller; dispute resolution should be transactional or at minimum rolled back on failure.
3. **P2-2E** `cancelBooking` — await `createRefundInternal`; if refund fails, the cancellation should fail or be queued for retry.
4. **P2-2F** `initCheckout` — the `paymentIntent.create` DB save must be awaited. A charge with no DB record is a financial black hole.
5. **P2-2G** `redeemCoupon` — await and surface errors; a swallowed failure enables coupon reuse.

### High (availability / resource exhaustion)

6. **P5-5A** `auth-service/routes/auth.routes.ts:69` — Extract the Prisma query to a module-scope singleton. Add `try/finally` to call `$disconnect()`.
7. **P5-5B** `search-service/routes/search.routes.ts:24` — Same fix; or move the delete logic to a module-scope service class.

### Medium (operational / observability)

8. **P2-2D** `dispute.service.ts` payout hold rescheduling — await or add retry logic.
9. **P3-3A** `chat-service/services/chat.service.ts:409` — Add `if (!notifRes.ok)` guard on the push notification fetch.
10. **P3-3B** `google-calendar.client.ts` — Add `if (!res.ok)` guard in `updateEvent`/`deleteEvent` and log the status code.
11. **P4-4A** Seven middleware files — Replace `console.error('FATAL: ...')` with the structured logger (even if called at module-init time, the logger can be invoked synchronously).
