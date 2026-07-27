import { ReconcileTransactionStatusUseCase } from './reconcile-transaction-status.use-case';
import { ApplyTransactionResolutionService } from './apply-transaction-resolution.service';
import { Transaction } from '../domain/transaction';
import { TransactionStatus } from '../domain/transaction-status';
import { ITransactionRepository } from '../domain/transaction.repository';
import { Product } from '../../products/domain/product';
import { IProductRepository } from '../../products/domain/product.repository';
import { IPaymentGateway } from '../../payments/domain/payment-gateway.port';
import { GatewayTransactionStatus } from '../../payments/domain/gateway-transaction-status';
import { ok, err } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';

const buildTransaction = (
  status: TransactionStatus = TransactionStatus.PENDING,
  gatewayTransactionId: string | null = 'gw-1',
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
  if (gatewayTransactionId) {
    transaction.markSubmittedToGateway(gatewayTransactionId);
  }
  if (status !== TransactionStatus.PENDING) {
    transaction.applyGatewayStatus(status, gatewayTransactionId ?? 'gw-1');
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

const buildUseCase = (
  transaction: Transaction | null,
  product: Product | null,
) => {
  const transactionRepository: ITransactionRepository = {
    save: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn().mockResolvedValue(transaction),
    findByReference: jest.fn(),
    existsByReference: jest.fn(),
  };
  const productRepository: IProductRepository = {
    findAll: jest.fn(),
    findById: jest.fn().mockResolvedValue(product),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const paymentGateway: IPaymentGateway = {
    submitPayment: jest.fn(),
    getTransactionStatus: jest.fn(),
  };
  const applyTransactionResolution = new ApplyTransactionResolutionService(
    transactionRepository,
    productRepository,
  );

  const useCase = new ReconcileTransactionStatusUseCase(
    transactionRepository,
    paymentGateway,
    applyTransactionResolution,
  );

  return { useCase, transactionRepository, productRepository, paymentGateway };
};

describe('ReconcileTransactionStatusUseCase', () => {
  it('returns TRANSACTION_NOT_FOUND when the transaction does not exist', async () => {
    const { useCase } = buildUseCase(null, buildProduct());

    const result = await useCase.execute('missing');

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.code).toBe('TRANSACTION_NOT_FOUND');
    }
  });

  it('returns the transaction unchanged when it is not pending', async () => {
    const { useCase, paymentGateway } = buildUseCase(
      buildTransaction(TransactionStatus.APPROVED),
      buildProduct(),
    );

    const result = await useCase.execute('tx-1');

    expect(result.isOk).toBe(true);
    expect(paymentGateway.getTransactionStatus).not.toHaveBeenCalled();
  });

  it('returns the transaction unchanged when there is no gateway transaction id yet', async () => {
    const { useCase, paymentGateway } = buildUseCase(
      buildTransaction(TransactionStatus.PENDING, null),
      buildProduct(),
    );

    const result = await useCase.execute('tx-1');

    expect(result.isOk).toBe(true);
    expect(paymentGateway.getTransactionStatus).not.toHaveBeenCalled();
  });

  it('leaves the transaction pending when the gateway still reports PENDING', async () => {
    const { useCase, transactionRepository, paymentGateway } = buildUseCase(
      buildTransaction(),
      buildProduct(),
    );
    (paymentGateway.getTransactionStatus as jest.Mock).mockResolvedValue(
      ok({
        gatewayTransactionId: 'gw-1',
        status: GatewayTransactionStatus.PENDING,
      }),
    );

    const result = await useCase.execute('tx-1');

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.status).toBe('PENDING');
    }
    expect(transactionRepository.save).not.toHaveBeenCalled();
  });

  it('resolves an approved transaction and decrements stock, reusing the shared resolution logic', async () => {
    const {
      useCase,
      transactionRepository,
      productRepository,
      paymentGateway,
    } = buildUseCase(buildTransaction(), buildProduct(5));
    (paymentGateway.getTransactionStatus as jest.Mock).mockResolvedValue(
      ok({
        gatewayTransactionId: 'gw-1',
        status: GatewayTransactionStatus.APPROVED,
      }),
    );

    const result = await useCase.execute('tx-1');

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

  it('leaves the transaction pending when the gateway lookup fails', async () => {
    const { useCase, transactionRepository, paymentGateway } = buildUseCase(
      buildTransaction(),
      buildProduct(),
    );
    (paymentGateway.getTransactionStatus as jest.Mock).mockResolvedValue(
      err(DomainError.of('GATEWAY_ERROR', 'boom')),
    );

    const result = await useCase.execute('tx-1');

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.status).toBe('PENDING');
    }
    expect(transactionRepository.save).not.toHaveBeenCalled();
  });
});
