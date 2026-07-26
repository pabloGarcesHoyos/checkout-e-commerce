# Checkout

A single-product checkout application: browse a product, pay by card through a sandbox
payment gateway, and track the resulting transaction to a final status.

**Stack** — Backend: NestJS + TypeScript, hexagonal architecture, PostgreSQL + TypeORM. Frontend: React 18
+ TypeScript, Redux Toolkit, redux-persist, Tailwind CSS. Testing: Jest (backend unit + e2e with supertest),
Jest + React Testing Library (frontend).

## Architecture

### Backend: hexagonal (ports & adapters)

Each bounded context (`products`, `customers`, `deliveries`, `transactions`, `payments`) is split into:

- `domain/` — entities, value objects, and repository/gateway interfaces (ports). No framework imports.
- `application/` — one use case per business operation, single `execute` method. Use cases depend only on
  the ports defined in `domain/`, never on TypeORM or NestJS HTTP concerns directly.
- `infrastructure/` — controllers, DTOs, TypeORM entities/repositories (adapters implementing the domain
  ports), and the sandbox payment gateway HTTP client.

This keeps business rules (stock checks, fee calculation, transaction state transitions) testable in
isolation and swappable at the edges — a new payment method is a new adapter behind `IPaymentGateway`,
not a change to any use case. It's the right amount of structure for five bounded contexts that all follow
the same shape (validate → apply a business rule → persist through a port); a simpler layered/MVC split
would have blurred where the payment-gateway integration ends and the transaction lifecycle begins.

### Railway Oriented Programming

A shared `Result<T, E>` (`Ok` / `Err`) type in `shared/domain` lets use cases return expected failures
(`PRODUCT_NOT_FOUND`, `INSUFFICIENT_STOCK`, `INVALID_WEBHOOK_SIGNATURE`, …) as values instead of throwing.
Controllers map `Result` to HTTP responses; a global exception filter only catches genuinely unexpected
failures (e.g. a dropped DB connection). This was chosen over exceptions-for-everything because most
failure paths here are *expected business outcomes* (a webhook for an unknown reference, a transaction
that's already been confirmed) rather than bugs — modeling them as values makes every use case's possible
outcomes visible in its return type instead of hidden in a `try/catch` a caller has to know to write.

### Data model

| Entity | Fields |
|---|---|
| `Product` | `id, name, description, price_cents, stock, image_url, created_at, updated_at` |
| `Customer` | `id, full_name, email, phone, document_type, document_number, created_at` |
| `Delivery` | `id, customer_id → Customer, address, city, region, delivery_fee_cents, created_at` |
| `Transaction` | `id, product_id → Product, customer_id → Customer, delivery_id → Delivery, reference (unique), gateway_transaction_id, status (PENDING\|APPROVED\|DECLINED\|ERROR\|VOIDED), product_amount_cents, base_fee_cents, delivery_fee_cents, total_cents, created_at, updated_at` |

`Transaction.total_cents` is always recomputed server-side from the current product price, a fixed base
fee, and the delivery fee stored on the `Delivery` row — the frontend never supplies an amount that gets
trusted directly. Card numbers, CVVs, and expiration dates are never sent to or stored by the backend; the
frontend tokenizes the card directly against the payment gateway and only a token ever reaches the API.

### Payment gateway integration

The flow talks to a sandbox card-payment gateway (configured entirely through environment variables, see
`.env.example` in each project — no credentials are committed):

1. Frontend requests an acceptance token and tokenizes the card directly against the gateway.
2. Backend creates a local `Transaction` in `PENDING` and returns a unique `reference`.
3. Backend signs the transaction (`sha256(reference + amount + currency + secret)`) and submits it to the
   gateway with the card token.
4. The gateway confirms asynchronously via `POST /webhooks/payment-gateway`. The webhook signature is
   verified before anything is trusted; a transaction already out of `PENDING` is treated as an idempotent
   no-op so a duplicated event can't double-decrement stock.
5. On an `APPROVED` result the transaction is updated and product stock is decremented.

### Frontend flow

A `checkout` Redux slice drives a 5-step flow via a `step` field (not routing), persisted to
`localStorage` with `redux-persist` so a refresh resumes progress:

1. **Product page** — description, price, stock.
2. **Card + delivery modal** — Luhn-validated card number, expiration/CVV checks, Visa/Mastercard brand
   detection from the number prefix, plus delivery details.
3. **Summary backdrop** — product amount, base fee, delivery fee, total, and the pay action.
4. **Final status** — polls `GET /transactions/:id` until the gateway webhook resolves the transaction.
5. **Redirect** — back to the product page with refreshed stock.

Raw card number, expiration, and CVV are kept out of `redux-persist`'s storage via a transform, so a page
refresh never leaves card details sitting in `localStorage`.

## Setup

**Prerequisites:** Node.js 20+, npm, a local PostgreSQL 16 instance (or `docker compose up -d` using the
`docker-compose.yml` at the repo root).

### Backend

```bash
cd backend
cp .env.example .env   # fill in local DB + sandbox gateway values — see that file for every var needed
npm install
npm run start:dev
```

Requires a PostgreSQL instance matching the `.env` values; the app seeds 5 dummy products on first boot.

```bash
npm run test:cov   # unit tests with coverage
npm run test:e2e   # supertest e2e flow (needs a running Postgres test database)
```

### Frontend

```bash
cd frontend
cp .env.example .env   # see that file for every var needed (API base URL, gateway public key)
npm install
npm run dev
```

```bash
npm run test:coverage
```

## API documentation

Interactive documentation: `GET /docs` (Swagger UI, once the backend is running) —
locally `http://localhost:3000/docs`; deployed URL: _pending, see Deployment below_.

The raw OpenAPI spec is committed at [`docs/openapi.json`](docs/openapi.json) (regenerate with
`npm run docs:export` inside `backend/`), and a ready-to-import Postman collection generated from that
spec is committed at [`postman/checkout-api.postman_collection.json`](postman/checkout-api.postman_collection.json)
— in Postman, File → Import → select the file. The OpenAPI JSON can also be imported directly into Postman
or any other OpenAPI-compatible client.

```
GET  /products
GET  /products/:id
POST /customers
POST /deliveries
POST /transactions              -> creates a transaction in PENDING, returns a reference
POST /transactions/:id/confirm  -> submits payment to the gateway with a card token
GET  /transactions/:id          -> polled by the frontend for the final status
POST /webhooks/payment-gateway  -> gateway callback; validates signature, updates status, decrements stock
```

## Test coverage

Reproduce with `npm run test:cov` (backend), `npm run test:e2e` (backend, needs a running Postgres), and
`npm run test:coverage` (frontend).

### Backend — 109 unit tests across 37 suites, plus 5 e2e tests

```
-------------------------------------|---------|----------|---------|---------|
File                                  | % Stmts | % Branch | % Funcs | % Lines |
-------------------------------------|---------|----------|---------|---------|
All files                             |     100 |    85.04 |     100 |     100 |
 modules/customers/application        |     100 |      100 |     100 |     100 |
 modules/customers/domain             |     100 |      100 |     100 |     100 |
 modules/customers/infrastructure     |     100 |    78.57 |     100 |     100 |
 modules/deliveries/application       |     100 |      100 |     100 |     100 |
 modules/deliveries/domain            |     100 |      100 |     100 |     100 |
 modules/deliveries/infrastructure    |     100 |       80 |     100 |     100 |
 modules/payments/domain              |     100 |      100 |     100 |     100 |
 modules/payments/infrastructure      |     100 |     87.5 |     100 |     100 |
 modules/products/application         |     100 |      100 |     100 |     100 |
 modules/products/domain              |     100 |      100 |     100 |     100 |
 modules/products/infrastructure      |     100 |    80.76 |     100 |     100 |
 modules/transactions/application     |     100 |     92.3 |     100 |     100 |
 modules/transactions/domain          |     100 |      100 |     100 |     100 |
 modules/transactions/infrastructure  |     100 |    78.57 |     100 |     100 |
 shared/domain                        |     100 |      100 |     100 |     100 |
 shared/infrastructure                |     100 |      100 |     100 |     100 |
-------------------------------------|---------|----------|---------|---------|
Test Suites: 37 passed, 37 total
Tests:       109 passed, 109 total
```

Statements, functions, and lines are all **100%**. Every remaining branch gap left in the infrastructure
layer is the same known, verified cause: `emitDecoratorMetadata` (needed for NestJS DI and Swagger) emits
a `typeof X === "function"` reflection check for every constructor parameter and DTO property typed as a
concrete class or enum. That check is structurally one-sided — always true for a real class, always false
for a string enum — so one branch of the pair can never execute under any test. This was confirmed branch
by branch against the raw `coverage-final.json` output (not assumed), and is documented inline at each
occurrence. No test can close these; they are not untested business logic.

e2e (`npm run test:e2e`, requires a running Postgres): 5/5 passing — covers listing seeded products,
rejecting a transaction for a non-existent product, the full create → confirm → gateway round trip with a
server-recomputed total, an approved webhook decrementing stock exactly once even when replayed
(idempotency), and rejecting a webhook with a tampered signature.

### Frontend — 93 tests across 21 suites

```
------------------------------|---------|----------|---------|---------|
File                          | % Stmts | % Branch | % Funcs | % Lines |
------------------------------|---------|----------|---------|---------|
All files                     |   99.26 |     97.7 |   97.36 |   99.23 |
 src                          |     100 |      100 |     100 |     100 |
 src/api                      |     100 |      100 |     100 |     100 |
 src/app                      |     100 |      100 |     100 |     100 |
 src/components               |   97.64 |       95 |    93.1 |    97.4 |
 src/features/checkout        |     100 |      100 |     100 |     100 |
 src/features/product         |     100 |      100 |     100 |     100 |
 src/features/transaction     |     100 |      100 |     100 |     100 |
 src/test-utils               |     100 |      100 |     100 |     100 |
 src/types                    |     100 |      100 |     100 |     100 |
 src/utils                    |     100 |      100 |     100 |     100 |
------------------------------|---------|----------|---------|---------|
Test Suites: 21 passed, 21 total
Tests:       93 passed, 93 total
```

`src/api/*.ts` is verified at 100% on every metric with dedicated tests that exercise the real functions
against a mocked `httpClient`/`axios`, rather than `jest.mock()`-ing the module away entirely (an earlier
pass had every function in this layer at 0 real invocations — mocking the whole module had silently
replaced every function body, including in "passing" tests — this was caught and fixed, not assumed away).

Both projects pass `tsc`/`tsc -b` with zero errors and `eslint` with zero warnings.

## Deployment

- **Frontend:** S3 + CloudFront, HTTPS via ACM (or CloudFront's default certificate if no custom domain).
- **Backend:** ECS Fargate — the API needs a long-lived DB connection pool and a background seeder on
  boot, which fits a small always-on container better than a cold-starting Lambda given the request volume
  expected here.
- **Database:** RDS PostgreSQL (free tier, `db.t3.micro`).

**Deployed URLs:** _not yet deployed._

> This build was assembled without access to an AWS account in the working environment. The application
> is deploy-ready (see the ECS/S3/RDS plan above); wiring it to a live AWS account is the next step once
> credentials are available.

## Security

Verified directly against a running instance (not assumed from config alone) — `curl -I` against a local
server confirms every header below is actually sent:

```
Content-Security-Policy: default-src 'self'; ...; script-src 'self'; ...
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Access-Control-Allow-Origin: http://localhost:5173   (not *)
X-RateLimit-Limit: 60 / X-RateLimit-Remaining: ...
```

`helmet()` runs with its full default policy (not disabled or weakened), CORS reflects a single configured
origin from `FRONTEND_ORIGIN` (never a wildcard), and Swagger's own UI at `/docs` still loads correctly
under that CSP because its scripts are served same-origin. Sending a malformed body to
`POST /webhooks/payment-gateway` returns `400` with the DTO's validation errors, confirming
`whitelist`/`forbidNonWhitelisted` are active end-to-end, not just declared.

**OWASP Top 10 (2021), mapped to what's actually in this codebase:**

| Risk | Mitigation |
|---|---|
| A01 Broken Access Control | No user accounts/roles are in scope for this checkout; the webhook is the only endpoint meant to be called by a third party, and it's gated by signature verification (below), not by auth, by design. |
| A02 Cryptographic Failures | Card number/CVV/expiry never reach the backend — the frontend tokenizes directly against the payment gateway. Webhook signatures are compared with `crypto.timingSafeEqual` (constant-time), not `===`, to avoid timing side-channels. |
| A03 Injection | All DB access goes through TypeORM's parameterized query builder/repository API — no raw string-concatenated SQL anywhere in the codebase. Every endpoint validates its DTO with `class-validator`, and `forbidNonWhitelisted: true` rejects any unexpected body property outright. |
| A04 Insecure Design | The transaction total is always recomputed server-side from the product price + fixed base fee + delivery fee — the client-submitted amount is never trusted. A webhook is idempotent by construction (a transaction already out of `PENDING` is a no-op), so a duplicated gateway event can't double-decrement stock. |
| A05 Security Misconfiguration | `helmet()` defaults are active (see headers above); CORS is pinned to one origin; DTOs whitelist and reject unknown fields; `.env` is git-ignored in both projects and only `.env.example` (placeholder values) is committed. |
| A06 Vulnerable/Outdated Components | `npm audit` was run for real (not assumed clean): frontend reports 0 vulnerabilities. Backend reports 6 high-severity advisories, all transitive — `glob`/`minimatch` pulled in by TypeORM's CLI tooling, and `js-yaml` pulled in by `@nestjs/swagger`. Both are already at their latest stable major version; no non-breaking upstream fix exists yet. Neither vulnerable path is reachable through this app's actual HTTP surface (we don't run TypeORM's CLI glob-based migration discovery at runtime, and no endpoint parses attacker-supplied YAML) — documented here rather than silently ignored, and revisit when upstream ships a patched release. |
| A07 Identification/Auth Failures | No authentication is in scope for this deliverable; nothing here is protected by (or falsely implies) a login. |
| A08 Software/Data Integrity Failures | The webhook payload's signature is verified before any of its contents are trusted; a tampered checksum is rejected with `401` (covered by an e2e test), so a forged "payment approved" event can't move a transaction forward or decrement stock. |
| A09 Logging/Monitoring Failures | A global exception filter catches unexpected errors, logs the real stack trace server-side, and returns only a generic `500` body to the client — internal details never leak in the response. |
| A10 SSRF | The only outbound HTTP call the backend makes (to the payment gateway) targets a fixed, operator-configured `PAYMENT_GATEWAY_BASE_URL` from the environment — never a URL derived from user input. |

## Known limitations

- **Cloud deployment is not live.** This was built without AWS credentials available in the working
  environment; see [Deployment](#deployment) above for the plan and what's blocking it.
- **Cross-browser testing was done at the code level, not visually.** No browser-automation tool was
  available in this environment to render and screenshot the app. The CSS was audited for viewport
  overflow, hardcoded pixel widths, and non-standard properties (none found), and `vite build`'s output
  already includes vendor-prefixed rules for older engines, but this has not been visually confirmed in a
  real Safari or Firefox window.
- **Backend `npm audit` reports 6 high-severity transitive advisories** (TypeORM's CLI globbing deps,
  `@nestjs/swagger`'s bundled `js-yaml`) with no non-breaking fix upstream yet — see the OWASP table above
  for why they aren't reachable through this app's actual surface.
- **Card tokenization targets the payment gateway's sandbox only** — no real charges are possible, and the
  gateway base URL/keys are placeholders in `.env.example` pending real sandbox credentials.
- **Delivery fee is a small fixed lookup table keyed by region name** (`bogota`/`antioquia`/`valle`, with a
  flat default otherwise), not a real shipping-rate integration — intentional for this deliverable's scope.
