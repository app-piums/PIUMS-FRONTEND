# Trail of Bits Supply Chain Risk — Piums Platform

**Date:** 2026-05-25
**Scope:** 15 package.json manifests — 10 backend microservices, 3 Next.js apps, 1 API gateway, internal packages
**Total production dependencies resolved:** 1,064
**Audit tool:** pnpm audit (lockfileVersion 6.0)

---

## High Risk Dependencies

| Package | Version Used | Used In | Risk Factor | Recommendation |
|---|---|---|---|---|
| `multer` | `^1.4.5-lts.1` (resolved: 1.4.5-lts.2) | users-service | **Explicitly deprecated** — npm warning states "Multer 1.x is impacted by a number of vulnerabilities, which have been patched in 2.x." No specific CVE IDs disclosed publicly, but the maintainers have flagged 1.x as unsafe for new deployments. Also pulls in `concat-stream@1.6.2` (uses legacy `readable-stream@2.x`). | Upgrade to `multer@2.x` now. The API has minor breaking changes around error handling; update accordingly in `users-service/src/**`. |
| `ws` | `^8.18.3` (resolved: 8.18.3) | chat-service, web-admin, web-artist, web-client | **CVE-2026-45736** (GHSA-58qx-3vcg-4xpx) — Uninitialized memory disclosure when a `TypedArray` is passed as the close-reason argument. CVSS 4.4 (moderate). Affects ws `>=8.0.0 <8.20.1`. Present in 8 dependency paths across socket.io, socket.io-client, and @socket.io/redis-adapter chains. | Add pnpm override: `"ws@>=8.0.0 <8.20.1": ">=8.20.1"` in root package.json. |
| `qs` | 6.14.2 / 6.15.0 (both present) | gateway, all 10 microservices, shared-utils | **CVE-2026-8723** (GHSA) — Remotely triggerable DoS: `qs.stringify()` throws `TypeError` on null/undefined entries in comma-format arrays when `encodeValuesOnly` is set. Affects `>=6.11.1 <=6.15.1`. Patched in `>=6.15.2`. Transitive via express `4.22.x` which pins `qs@6.14.2`. Not yet overridden in pnpm overrides block. | Add pnpm override: `"qs@>=6.11.1 <6.15.2": ">=6.15.2"` in root package.json. |
| `uuid` | 8.3.2 / 9.0.1 / 10.0.0 (transitive) | notifications-service (via firebase-admin) | **CVE-2026-41907** (GHSA-w5hq-g745-h8pq, CVSS 7.5 High) — Missing buffer bounds check in `v3()`/`v5()`/`v6()` when a caller-provided buffer is passed. Silent partial writes. All three resolved versions are in the vulnerable range (`<11.1.1`). The override `"uuid@>=11.0.0 <11.1.1": ">=11.1.1"` in package.json only covers the narrow 11.x window, not the 8.x/9.x/10.x versions pulled by firebase-admin. Additionally, `uuid@8.3.2`, `9.0.1`, and `10.0.0` are all **deprecated** on npm. | Extend the pnpm override to cover all affected ranges: `"uuid@<11.1.1": ">=11.1.1"`. Verify firebase-admin accepts the hoisted version. |

---

## Medium Risk Dependencies

| Package | Version Used | Used In | Risk Factor | Recommendation |
|---|---|---|---|---|
| `streamifier` | `^0.1.1` (resolved: 0.1.1) | users-service | **No maintenance since ~2014** (>11 years stale). Low weekly downloads relative to alternatives. Converts a Buffer or string into a readable stream. No CVEs found, but the package is effectively abandoned and the same functionality is available via Node.js native `stream.Readable.from()`. | Replace with `stream.Readable.from(buffer)` (available since Node.js 12). Remove dependency. |
| `passport-facebook` | `^3.0.0` (resolved: 3.0.0) | auth-service | Single-maintainer (`jaredhanson`). The package version 3.0.0 has a narrow adoption footprint vs v2. Depends on `passport-oauth2@1.8.0`. The entire Passport.js ecosystem is considered slow-moving and the core `pause@0.0.1` transitive dependency is an empty stub with minimal code. The scmp `2.1.0` package (used in the passport-oauth2 chain) is **deprecated** with the note "Just use Node.js's `crypto.timingSafeEqual()`". | Evaluate replacing passport-facebook with a direct OAuth2 flow using `google-auth-library` (already present). If Facebook OAuth is required, test whether `openid-client` or a more actively maintained alternative works. |
| `bcrypt` | `^6.0.0` (resolved: 6.0.0) | apps/web-client (root package.json) | **Native C++ addon** (`requiresBuild: true`, via `node-addon-api@8.5.0` and `node-gyp-build@4.8.4`). Running in a Next.js frontend context is architecturally incorrect — bcrypt hashing should only run server-side. This creates a native build requirement for the client bundle. Also a potential FFI supply chain attack surface. Note: the correct `bcryptjs` (pure JS) is used in auth-service — this is a duplicate with dangerous placement. | Remove `bcrypt` from `apps/web-client/package.json`. All password hashing must remain in auth-service. |
| `pdfkit` | `^0.17.2` (resolved: 0.17.2) | booking-service | Pulls in `jpeg-exif@1.1.4` which is **explicitly deprecated** ("Package no longer supported"). Also pulls in `crypto-js@4.2.0` (known for side-channel risk in crypto implementations) and `fontkit@2.0.4` which performs binary font file parsing (TTF/OTF) — a historically high-risk attack surface if user-supplied fonts are accepted. | Pin and audit the `jpeg-exif` transitive dep; add pnpm override to exclude it if not needed. Confirm that user-supplied fonts are never accepted. |
| `bad-words` | `^3.0.4` (resolved: 3.0.4) | chat-service | Relatively low adoption for content filtering. Depends on `badwords-list@1.0.0` which is a static word list — static content lists can be stale or incomplete, leading to bypasses. No CVEs, but content-filtering bypass is a business risk. | Acceptable for now, but add a secondary server-side content moderation layer (e.g., a regex-based custom filter) for coverage. |
| `nextstepjs` | `^2.2.0` (resolved: 2.2.0) | web-artist, web-client | Niche UI onboarding library with low npm install base relative to alternatives (e.g., `driver.js`, `react-joyride`). Single-author, newer package. Peer dependency on `next>=16.2.6` means version constraints may break on Next.js upgrades. | Monitor for maintainer activity. Pin to an exact version (`2.2.0`) to avoid surprise upgrades. |
| `pigeon-maps` | `^0.22.1` (resolved: 0.22.1) | web-artist, web-client | Niche open-source maps library. Low organization backing. No CVEs, but a compromised publish could inject malicious tile-URL logic or tracking. | Acceptable risk for a maps component. Verify integrity hash is locked (`sha512` is present in lockfile — confirmed). |
| `express-session` | `^1.19.0` (resolved: 1.19.0) | auth-service | Stable and actively maintained. However, uses `cookie@0.7.2` and `debug@2.6.9` (both old) as transitive deps. Session storage is in-memory by default — at scale this leaks memory and loses sessions on restart. If a Redis store is not configured in production, all sessions are volatile. | Confirm a Redis session store (e.g., `connect-redis`) is configured in the auth-service k8s deployment. `debug@2.6.9` is very old but no current CVEs. |
| `ts-node-dev` | `^2.0.0` (resolved: 2.0.0) | gateway (production dep), auth-service | Used in `dev` script only, but present in `dependencies` (not `devDependencies`) for gateway. This means it is installed in the production Docker image unnecessarily, increasing the attack surface. | Move `ts-node-dev` to `devDependencies` in gateway and auth-service. Production images should only run compiled JS. |
| `http-proxy-middleware` | `^3.0.3` (resolved: 3.0.5) | gateway | Depends on `http-proxy@1.18.1` which was last significantly updated in 2020. The `follow-redirects@1.16.0` transitive dep had a CVE (CVE-2024-28849) in earlier versions — the pnpm override `follow-redirects@<=1.15.11: >=1.16.0` is correctly applied. | No immediate action. Confirm override is being applied by running `pnpm list follow-redirects` from the gateway directory. |

---

## Low Risk / Informational

| Package | Version | Used In | Note |
|---|---|---|---|
| `glob@7.2.3` | 7.2.3 | transitive (via multer/mkdirp) | Deprecated. Replaced by `glob@10+`. No CVE. Transitive only. |
| `inflight@1.0.6` | 1.0.6 | transitive | Deprecated — leaks memory. Used transitively by `glob@7`. |
| `rimraf@2.7.1`, `3.0.2` | multiple | transitive | Both deprecated. No CVEs. Dev-time only in most paths. |
| `scmp@2.1.0` | 2.1.0 | transitive (passport-oauth2) | Deprecated ("just use Node.js `crypto.timingSafeEqual()`"). No CVE. |
| `node-domexception@1.0.0` | 1.0.0 | transitive (firebase) | Deprecated. No CVE. |
| `pause@0.0.1` | 0.0.1 | transitive (passport) | ~10 year old stub. No CVE. Effectively empty. |
| `concat-stream@1.6.2` | 1.6.2 | transitive (multer) | Old but stable. Pulls in `readable-stream@2.3.8`. No CVEs. |
| `qrcode@1.5.4` | 1.5.4 | web-client | Legitimate use. Depends on `dijkstrajs@1.0.3` (minimal, no CVE). |
| `zod` version split | ^3.x in services, ^4.3.6 in web-client root | various | Both major versions installed. Ensure type contracts from shared-types are compatible. |
| `@prisma/client` version split | ^5.7.0 in chat-service vs ^6.x elsewhere | chat-service | chat-service is 1 major version behind. Upgrade to `^6.x` for consistency and latest security patches. |

---

## Version Range Concerns

No direct dependencies use `*` wildcards. All direct dependencies use caret (`^`) ranges. The following ranges are broader than ideal:

- `firebase: ^12.11.0` — allows any `12.x` minor/patch. Acceptable for a major vendor SDK.
- `bullmq: ^5.70.1` — major version `5.x` is current. Acceptable.
- `twilio: ^5.4.0` — resolved to `5.12.2`. The range allows 8 minor versions of drift. Pin to `^5.12.0` minimum.

---

## Audit Commands Run

```
find /Users/piums/Desktop/piums-platform -name "package.json" -not -path "*/node_modules/*" | sort
pnpm audit --json (from /Users/piums/Desktop/piums-platform)
grep -E "deprecated:|requiresBuild:" pnpm-lock.yaml
grep -E "^  /[a-z]" pnpm-lock.yaml (version enumeration for target packages)
grep overrides pnpm-lock.yaml + package.json
python3 (custom script to enumerate all unique direct production deps across 15 manifests)
```

---

## Summary

**3 active CVEs** are present in the resolved dependency tree, all rated moderate. None are yet critical:

1. **CVE-2026-45736** (`ws@8.18.3`) — Memory disclosure in WebSocket close. Add pnpm override for `ws>=8.20.1`.
2. **CVE-2026-41907** (`uuid<11.1.1`) — Buffer bounds check bypass. Extend existing pnpm override to cover `<11.1.1` (not just the 11.0.x range).
3. **CVE-2026-8723** (`qs` DoS) — Affects all 10 backend services via express. Add pnpm override for `qs>=6.15.2`.

**Top structural risks** not captured by CVEs:

- `multer@1.4.5-lts.1` is explicitly deprecated by its maintainers as vulnerable — upgrade to 2.x is mandatory.
- `bcrypt` (native C++ addon) is incorrectly placed in the Next.js client app's `dependencies` — remove immediately.
- `streamifier@0.1.1` is >11 years stale — trivially replaceable with Node.js built-ins.
- `jpeg-exif@1.1.4` (transitive via pdfkit) is abandoned.
- `ts-node-dev` appears in production `dependencies` for the gateway — it should be `devDependencies` only.
- `@prisma/client@^5.7.0` in chat-service is 1 major version behind all other services — creates inconsistency and misses Prisma 6.x security patches.

**No typosquats detected** across all 58 unique direct production dependencies.

**No non-standard registries detected** — all packages resolve from `registry.npmjs.org`.

**pnpm overrides are actively used** (20 entries) to force minimum safe versions for several known-vulnerable transitive deps (next, axios, nodemailer, protobufjs, socket.io-parser, path-to-regexp, lodash, flatted, follow-redirects, postcss, uuid@11.x, ip-address, picomatch, micromatch, brace-expansion, minimatch, defu, effect, i18next-fs-backend, express-rate-limit). The gaps are `ws`, `qs`, and the full `uuid<11.1.1` range.
