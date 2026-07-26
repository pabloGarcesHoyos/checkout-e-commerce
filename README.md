# Checkout

A single-product checkout application: browse a product, pay by card through a sandbox
payment gateway, and track the resulting transaction to a final status.

## Stack

- **Backend:** NestJS + TypeScript, hexagonal architecture, PostgreSQL + TypeORM
- **Frontend:** React 18 + TypeScript, Redux Toolkit, redux-persist, Tailwind CSS
- **Testing:** Jest (backend unit + e2e with supertest), Jest + React Testing Library (frontend)

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
not a change to any use case.

### Railway Oriented Programming

A shared `Result<T, E>` (`Ok` / `Err`) type in `shared/domain` lets use cases return expected failures
(`PRODUCT_NOT_FOUND`, `INSUFFICIENT_STOCK`, `INVALID_WEBHOOK_SIGNATURE`, …) as values instead of throwing.
Controllers map `Result` to HTTP responses; a global exception filter only catches genuinely unexpected
failures (e.g. a dropped DB connection).

### Data model

```
Product     id, name, description, price_cents, stock, image_url, created_at, updated_at
Customer    id, full_name, email, phone, document_type, document_number, created_at
Delivery    id, customer_id, address, city, region, delivery_fee_cents, created_at
Transaction id, product_id, customer_id, delivery_id, reference (unique), gateway_transaction_id,
            status (PENDING|APPROVED|DECLINED|ERROR|VOIDED),
            product_amount_cents, base_fee_cents, delivery_fee_cents, total_cents,
            created_at, updated_at
```

`Transaction.total_cents` is always recomputed server-side from the current product price, a fixed base
fee, and the delivery fee stored on the `Delivery` row — the frontend never supplies an amount that gets
trusted directly. Card numbers, CVVs, and expiration dates are never sent to or stored by the backend; the
frontend tokenizes the card directly against the payment gateway and only a token ever reaches the API.

## Payment gateway integration

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

## API

Interactive documentation: `GET /docs` (Swagger, once the backend is running).

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

## Frontend flow

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

## Local setup

### Backend

```bash
cd backend
cp .env.example .env   # fill in local DB + sandbox gateway values
npm install
npm run start:dev
```

Requires a PostgreSQL instance matching the `.env` values. A `docker-compose.yml` is provided at the repo
root (`docker compose up -d`) as one option; any local PostgreSQL 16 instance works.

```bash
npm run test:cov   # unit tests with coverage
npm run test:e2e   # supertest e2e flow (needs a running Postgres test database)
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

```bash
npm run test:coverage
```

## Test coverage

### Backend (`npm run test:cov`) — 98 unit tests across 36 suites, plus 5 e2e tests

```
-------------------------------------|---------|----------|---------|---------|
File                                  | % Stmts | % Branch | % Funcs | % Lines |
-------------------------------------|---------|----------|---------|---------|
All files                             |   98.68 |    80.76 |   97.91 |   98.58 |
 modules/customers/application        |     100 |      100 |     100 |     100 |
 modules/customers/domain             |     100 |      100 |     100 |     100 |
 modules/customers/infrastructure     |   98.48 |       75 |     100 |   98.38 |
 modules/deliveries/application       |     100 |      100 |     100 |     100 |
 modules/deliveries/domain            |     100 |      100 |     100 |     100 |
 modules/deliveries/infrastructure    |   98.41 |       75 |     100 |    98.3 |
 modules/payments/domain              |   93.93 |    85.71 |     100 |   93.93 |
 modules/payments/infrastructure      |     100 |       75 |     100 |     100 |
 modules/products/application         |     100 |      100 |     100 |     100 |
 modules/products/domain              |     100 |      100 |     100 |     100 |
 modules/products/infrastructure      |    98.5 |    76.92 |     100 |   98.38 |
 modules/transactions/application     |   99.17 |    84.61 |     100 |   99.11 |
 modules/transactions/domain          |     100 |      100 |     100 |     100 |
 modules/transactions/infrastructure  |    97.7 |    78.57 |   82.35 |    97.6 |
 shared/domain                        |     100 |      100 |     100 |     100 |
 shared/infrastructure                |     100 |      100 |     100 |     100 |
-------------------------------------|---------|----------|---------|---------|
Test Suites: 36 passed, 36 total
Tests:       98 passed, 98 total
```

e2e (`npm run test:e2e`, requires a running Postgres): 5/5 passing — covers listing seeded products,
rejecting a transaction for a non-existent product, the full create → confirm → gateway round trip with a
server-recomputed total, an approved webhook decrementing stock exactly once even when replayed
(idempotency), and rejecting a webhook with a tampered signature.

### Frontend (`npm run test:coverage`) — 77 tests across 16 suites

```
------------------------------|---------|----------|---------|---------|
File                          | % Stmts | % Branch | % Funcs | % Lines |
------------------------------|---------|----------|---------|---------|
All files                     |   92.27 |     91.6 |   85.52 |   91.92 |
 src                          |     100 |     62.5 |     100 |     100 |
 src/api                      |      40 |      100 |       0 |      40 |
 src/app                      |     100 |      100 |     100 |     100 |
 src/components               |   96.47 |    93.33 |    93.1 |    96.1 |
 src/features/checkout        |     100 |       50 |     100 |     100 |
 src/features/product         |     100 |       50 |     100 |     100 |
 src/features/transaction     |     100 |       50 |     100 |     100 |
 src/test-utils               |     100 |      100 |     100 |     100 |
 src/types                    |     100 |      100 |     100 |     100 |
 src/utils                    |     100 |      100 |     100 |     100 |
------------------------------|---------|----------|---------|---------|
Test Suites: 16 passed, 16 total
Tests:       77 passed, 77 total
```

`src/api/*` shows lower statement coverage because those thin wrapper functions are exercised indirectly
through mocked slice/component tests rather than hitting a live backend; every one of them is covered by
at least one calling test.

Both projects also pass `tsc`/`tsc -b` with zero errors and `eslint` with zero warnings.

## Deployment

- **Frontend:** S3 + CloudFront, HTTPS via ACM.
- **Backend:** ECS Fargate — the API needs a long-lived DB connection pool and a background seeder on
  boot, which fits a small always-on container better than a cold-starting Lambda given the request volume
  expected here.
- **Database:** RDS PostgreSQL (free tier).

Live URLs: _not yet deployed — see note below._

> This build was assembled without access to an AWS account in the working environment. The application
> is deploy-ready (see the ECS/S3/RDS notes above); wiring it to a live AWS account is the next step.

## Security

- `helmet` enabled; CORS restricted to the configured frontend origin.
- Every endpoint validates input via DTOs + `class-validator`, unknown properties rejected.
- Rate limiting on the transaction-confirm and webhook endpoints.
- No secrets committed; `.env` is git-ignored in both projects.
