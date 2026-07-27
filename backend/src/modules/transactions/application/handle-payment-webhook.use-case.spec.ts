import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { HandlePaymentWebhookUseCase } from './handle-payment-webhook.use-case';
import { Transaction } from '../domain/transaction';
import { TransactionStatus } from '../domain/transaction-status';
import { ITransactionRepository } from '../domain/transaction.repository';
import { Product } from '../../products/domain/product';
import { IProductRepository } from '../../products/domain/product.repository';
import { IntegritySignatureService } from '../../payments/domain/integrity-signature.service';
import { ApplyTransactionResolutionService } from './apply-transaction-resolution.service';

const SECRET = 'events-secret';

const buildTransaction = (
  status: TransactionStatus = TransactionStatus.PENDING,
): Transaction => {
  const transaction = Transaction.create({
    id: 'tx-1',
    productId: 'product-1',
    customerId: 'customer-1',
    deliveryId: 'delivery-1',
    reference: 'TX-1',
    productAmountCents: 9999,
    baseFeeCents: 500,
    deliveryFeeCents: 800,
  });
  if (status !== TransactionStatus.PENDING) {
    transaction.applyGatewayStatus(status, 'gw-existing');
  }
  return transaction;
};

const buildProduct = (stock = 5): Product =>
  Product.reconstitute({
    id: 'product-1',
    name: 'Keyboard',
    description: 'A keyboard',
    priceCents: 9999,
    stock,
    imageUrl: 'https://example.com/image.png',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

const buildSignedWebhook = (status: string) => {
  const data = { transaction: { id: 'gw-1', reference: 'TX-1', status } };
  const timestamp = 1700000000;
  const concatenated = `${data.transaction.id}${data.transaction.status}`;
  const checksum = createHash('sha256')
    .update(`${concatenated}${timestamp}${SECRET}`)
    .digest('hex');
  return {
    payload: {
      data,
      timestamp,
      signature: {
        properties: ['transaction.id', 'transaction.status'],
        checksum,
      },
    },
    transactionData: data.transaction,
  };
};

const buildUseCase = (
  transaction: Transaction | null,
  product: Product | null,
) => {
  const transactionRepository: ITransactionRepository = {
    save: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn(),
    findByReference: jest.fn().mockResolvedValue(transaction),
    existsByReference: jest.fn(),
  };
  const productRepository: IProductRepository = {
    findAll: jest.fn(),
    findById: jest.fn().mockResolvedValue(product),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const configService = {
    get: jest.fn().mockReturnValue(SECRET),
  } as unknown as ConfigService;

  const useCase = new HandlePaymentWebhookUseCase(
    transactionRepository,
    new ApplyTransactionResolutionService(
      transactionRepository,
      productRepository,
    ),
    new IntegritySignatureService(),
    configService,
  );

  return { useCase, transactionRepository, productRepository };
};

describe('HandlePaymentWebhookUseCase', () => {
  it('rejects an event with an invalid signature', async () => {
    const { useCase } = buildUseCase(buildTransaction(), buildProduct());
    const webhook = buildSignedWebhook('APPROVED');
    webhook.payload.signature.checksum = 'tampered';

    const result = await useCase.execute(webhook);

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.code).toBe('INVALID_WEBHOOK_SIGNATURE');
    }
  });

  it('approves a pending transaction and decrements stock', async () => {
    const { useCase, transactionRepository, productRepository } = buildUseCase(
      buildTransaction(),
      buildProduct(5),
    );
    const webhook = buildSignedWebhook('APPROVED');

    const result = await useCase.execute(webhook);

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.status).toBe('APPROVED');
    }
    expect(transactionRepository.save).toHaveBeenCalledTimes(1);
    expect(productRepository.save).toHaveBeenCalledTimes(1);
    const savedProduct = (productRepository.save as jest.Mock).mock
      .calls[0][0] as Product;
    expect(savedProduct.stock).toBe(4);
  });

  it('does not decrement stock for an approved webhook when the product is already out of stock', async () => {
    const { useCase, transactionRepository, productRepository } = buildUseCase(
      buildTransaction(),
      buildProduct(0),
    );
    const webhook = buildSignedWebhook('APPROVED');

    const result = await useCase.execute(webhook);

    expect(result.isOk).toBe(true);
    expect(transactionRepository.save).toHaveBeenCalledTimes(1);
    expect(productRepository.save).not.toHaveBeenCalled();
  });

  it('falls back to an empty events secret when none is configured', async () => {
    const transaction = buildTransaction();
    const transactionRepository: ITransactionRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByReference: jest.fn().mockResolvedValue(transaction),
      existsByReference: jest.fn(),
    };
    const productRepository: IProductRepository = {
      findAll: jest.fn(),
      findById: jest.fn().mockResolvedValue(buildProduct(5)),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const useCase = new HandlePaymentWebhookUseCase(
      transactionRepository,
      new ApplyTransactionResolutionService(
        transactionRepository,
        productRepository,
      ),
      new IntegritySignatureService(),
      configService,
    );

    const data = {
      transaction: { id: 'gw-1', reference: 'TX-1', status: 'APPROVED' },
    };
    const timestamp = 1700000000;
    const checksum = createHash('sha256')
      .update(`${data.transaction.id}${data.transaction.status}${timestamp}`)
      .digest('hex');

    const result = await useCase.execute({
      payload: {
        data,
        timestamp,
        signature: {
          properties: ['transaction.id', 'transaction.status'],
          checksum,
        },
      },
      transactionData: data.transaction,
    });

    expect(result.isOk).toBe(true);
  });

  it('does not decrement stock for a declined transaction', async () => {
    const { useCase, productRepository } = buildUseCase(
      buildTransaction(),
      buildProduct(5),
    );
    const webhook = buildSignedWebhook('DECLINED');

    const result = await useCase.execute(webhook);

    expect(result.isOk).toBe(true);
    expect(productRepository.save).not.toHaveBeenCalled();
  });

  it('is idempotent for a duplicate event on an already-processed transaction', async () => {
    const { useCase, transactionRepository, productRepository } = buildUseCase(
      buildTransaction(TransactionStatus.APPROVED),
      buildProduct(5),
    );
    const webhook = buildSignedWebhook('APPROVED');

    const result = await useCase.execute(webhook);

    expect(result.isOk).toBe(true);
    expect(transactionRepository.save).not.toHaveBeenCalled();
    expect(productRepository.save).not.toHaveBeenCalled();
  });

  it('returns TRANSACTION_NOT_FOUND when the reference is unknown', async () => {
    const { useCase } = buildUseCase(null, buildProduct());
    const webhook = buildSignedWebhook('APPROVED');

    const result = await useCase.execute(webhook);

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.code).toBe('TRANSACTION_NOT_FOUND');
    }
  });

  it('rejects an unknown gateway status', async () => {
    const { useCase } = buildUseCase(buildTransaction(), buildProduct());
    const webhook = buildSignedWebhook('WEIRD_STATUS');

    const result = await useCase.execute(webhook);

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });
});
