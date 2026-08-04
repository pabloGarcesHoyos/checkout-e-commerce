import { createHash } from 'crypto';
import { Client } from 'pg';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PAYMENT_GATEWAY } from '../src/modules/payments/domain/payment-gateway.port';
import { GatewayTransactionStatus } from '../src/modules/payments/domain/gateway-transaction-status';
import { ok } from '../src/shared/domain/result';

process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.DB_NAME_TEST ?? 'checkout_test';
process.env.PAYMENT_GATEWAY_INTEGRITY_SECRET = 'e2e-integrity-secret';
process.env.PAYMENT_GATEWAY_EVENTS_SECRET = 'e2e-events-secret';

const resetDatabase = async () => {
  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME,
  });
  await client.connect();
  try {
    await client.query(
      'TRUNCATE TABLE transactions, deliveries, customers, products RESTART IDENTITY CASCADE;',
    );
  } catch {
    // Tables do not exist yet on a fresh database; TypeORM will create them on bootstrap.
  }
  await client.end();
};

const fakePaymentGateway = {
  submitPayment: jest.fn().mockResolvedValue(
    ok({
      gatewayTransactionId: 'gw-e2e-1',
      status: GatewayTransactionStatus.PENDING,
    }),
  ),
  getTransactionStatus: jest.fn().mockResolvedValue(
    ok({
      gatewayTransactionId: 'gw-e2e-1',
      status: GatewayTransactionStatus.PENDING,
    }),
  ),
};

const signWebhook = (data: Record<string, unknown>, timestamp: number) => {
  const transaction = data.transaction as { id: string; status: string };
  const concatenated = `${transaction.id}${transaction.status}`;
  const checksum = createHash('sha256')
    .update(
      `${concatenated}${timestamp}${process.env.PAYMENT_GATEWAY_EVENTS_SECRET}`,
    )
    .digest('hex');
  return {
    data,
    timestamp,
    signature: {
      properties: ['transaction.id', 'transaction.status'],
      checksum,
    },
  };
};

describe('Checkout transaction flow (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    await resetDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PAYMENT_GATEWAY)
      .useValue(fakePaymentGateway)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => jest.clearAllMocks());

  const createCustomer = () =>
    request(app.getHttpServer())
      .post('/customers')
      .send({
        fullName: 'Jane Doe',
        email: `jane-${Date.now()}@example.com`,
        phone: '+573001234567',
        documentType: 'CC',
        documentNumber: `DOC${Date.now()}`,
      });

  const createDelivery = (customerId: string) =>
    request(app.getHttpServer()).post('/deliveries').send({
      customerId,
      address: '123 Main St',
      city: 'Bogota',
      region: 'bogota',
    });

  it('lists the seeded products', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .expect(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(5);
  });

  it('rejects transaction creation for a non-existent product', async () => {
    const customerResponse = await createCustomer();
    const deliveryResponse = await createDelivery(customerResponse.body.id);

    await request(app.getHttpServer())
      .post('/transactions')
      .send({
        productId: '00000000-0000-0000-0000-000000000000',
        customerId: customerResponse.body.id,
        deliveryId: deliveryResponse.body.id,
      })
      .expect(404);
  });

  it('creates a transaction with a server-computed total and confirms it against the gateway', async () => {
    const productsResponse = await request(app.getHttpServer())
      .get('/products')
      .expect(200);
    const product = productsResponse.body[0];

    const customerResponse = await createCustomer().expect(201);
    const deliveryResponse = await createDelivery(
      customerResponse.body.id,
    ).expect(201);

    const createResponse = await request(app.getHttpServer())
      .post('/transactions')
      .send({
        productId: product.id,
        customerId: customerResponse.body.id,
        deliveryId: deliveryResponse.body.id,
      })
      .expect(201);

    expect(createResponse.body.status).toBe('PENDING');
    expect(createResponse.body.reference).toMatch(/^TX-/);
    expect(createResponse.body.totalCents).toBe(
      product.priceCents + 500 + deliveryResponse.body.deliveryFeeCents,
    );

    const confirmResponse = await request(app.getHttpServer())
      .post(`/transactions/${createResponse.body.id}/confirm`)
      .send({
        cardToken: 'tok_test_e2e_12345',
        acceptanceToken: 'accept_test_e2e_12345',
      })
      .expect(201);

    expect(confirmResponse.body.status).toBe('PENDING');
    expect(fakePaymentGateway.submitPayment).toHaveBeenCalledWith(
      expect.objectContaining({ reference: createResponse.body.reference }),
    );

    const fetchResponse = await request(app.getHttpServer())
      .get(`/transactions/${createResponse.body.id}`)
      .expect(200);
    expect(fetchResponse.body.id).toBe(createResponse.body.id);
  });

  it('applies an approved webhook, decrements stock, and is idempotent on replay', async () => {
    const productsResponse = await request(app.getHttpServer())
      .get('/products')
      .expect(200);
    const product = productsResponse.body[1];

    const customerResponse = await createCustomer().expect(201);
    const deliveryResponse = await createDelivery(
      customerResponse.body.id,
    ).expect(201);

    const createResponse = await request(app.getHttpServer())
      .post('/transactions')
      .send({
        productId: product.id,
        customerId: customerResponse.body.id,
        deliveryId: deliveryResponse.body.id,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/transactions/${createResponse.body.id}/confirm`)
      .send({
        cardToken: 'tok_test_e2e_67890',
        acceptanceToken: 'accept_test_e2e_67890',
      })
      .expect(201);

    const webhookPayload = signWebhook(
      {
        transaction: {
          id: 'gw-e2e-1',
          reference: createResponse.body.reference,
          status: 'APPROVED',
        },
      },
      Date.now(),
    );

    await request(app.getHttpServer())
      .post('/webhooks/payment-gateway')
      .send(webhookPayload)
      .expect(201);

    const productAfterFirstWebhook = await request(app.getHttpServer())
      .get(`/products/${product.id}`)
      .expect(200);
    expect(productAfterFirstWebhook.body.stock).toBe(product.stock - 1);

    await request(app.getHttpServer())
      .post('/webhooks/payment-gateway')
      .send(webhookPayload)
      .expect(201);

    const productAfterSecondWebhook = await request(app.getHttpServer())
      .get(`/products/${product.id}`)
      .expect(200);
    expect(productAfterSecondWebhook.body.stock).toBe(product.stock - 1);

    const transactionResponse = await request(app.getHttpServer())
      .get(`/transactions/${createResponse.body.id}`)
      .expect(200);
    expect(transactionResponse.body.status).toBe('APPROVED');
  });

  /**
   * Every other test in this suite - and every controller unit spec - uses a
   * well-formed UUID, so a malformed one reached TypeORM untouched, Postgres
   * rejected the uuid literal, and AllExceptionsFilter turned the driver's
   * throw into an opaque 500. Statements/functions/lines were all at 100% the
   * whole time: line coverage cannot see an input class no test supplies.
   * These lock in the 400 that ParseUUIDPipe now produces.
   *
   * Only e2e can cover this: a controller unit spec calls findOne(id) directly
   * and never runs the parameter pipe at all.
   */
  describe('malformed UUID path params return 400, not 500', () => {
    const MALFORMED_IDS = [
      'not-a-uuid',
      '123',
      'undefined',
      '../../etc/passwd',
    ];

    it.each(MALFORMED_IDS)('GET /products/%s -> 400', async (badId) => {
      await request(app.getHttpServer())
        .get(`/products/${encodeURIComponent(badId)}`)
        .expect(400);
    });

    it.each(MALFORMED_IDS)('GET /transactions/%s -> 400', async (badId) => {
      await request(app.getHttpServer())
        .get(`/transactions/${encodeURIComponent(badId)}`)
        .expect(400);
    });

    /* Deliberately a single request, not an it.each: /confirm is throttled to
     * 5/min per IP and the suite above already spends 2 of that budget. One
     * request is enough to prove the pipe is wired on this route, and it also
     * asserts the id is rejected before the gateway is ever contacted. */
    it('POST /transactions/:id/confirm -> 400, before reaching the payment gateway', async () => {
      await request(app.getHttpServer())
        .post('/transactions/not-a-uuid/confirm')
        .send({
          cardToken: 'tok_test_e2e_12345',
          acceptanceToken: 'accept_test_e2e_12345',
        })
        .expect(400);

      expect(fakePaymentGateway.submitPayment).not.toHaveBeenCalled();
    });

    it('still returns 404 - not 400 - for a well-formed UUID that does not exist', async () => {
      await request(app.getHttpServer())
        .get('/products/00000000-0000-0000-0000-000000000000')
        .expect(404);

      await request(app.getHttpServer())
        .get('/transactions/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  it('rejects a webhook with an invalid signature', async () => {
    const tampered = signWebhook(
      {
        transaction: {
          id: 'gw-e2e-x',
          reference: 'TX-does-not-exist',
          status: 'APPROVED',
        },
      },
      Date.now(),
    );
    tampered.signature.checksum = 'tampered-checksum';

    await request(app.getHttpServer())
      .post('/webhooks/payment-gateway')
      .send(tampered)
      .expect(401);
  });
});
