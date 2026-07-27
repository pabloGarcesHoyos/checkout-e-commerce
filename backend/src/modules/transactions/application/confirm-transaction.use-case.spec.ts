import { ConfigService } from '@nestjs/config';
import { ConfirmTransactionUseCase } from './confirm-transaction.use-case';
import { Transaction } from '../domain/transaction';
import { TransactionStatus } from '../domain/transaction-status';
import { ITransactionRepository } from '../domain/transaction.repository';
import { Customer } from '../../customers/domain/customer';
import { ICustomerRepository } from '../../customers/domain/customer.repository';
import { DocumentType } from '../../customers/domain/document-type';
import { IPaymentGateway } from '../../payments/domain/payment-gateway.port';
import { GatewayTransactionStatus } from '../../payments/domain/gateway-transaction-status';
import { IntegritySignatureService } from '../../payments/domain/integrity-signature.service';
import { ok, err } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';

const buildTransaction = (): Transaction =>
  Transaction.create({
    id: 'tx-1',
    productId: 'product-1',
    customerId: 'customer-1',
    deliveryId: 'delivery-1',
    reference: 'TX-1',
    productAmountCents: 9999,
    baseFeeCents: 500,
    deliveryFeeCents: 800,
  });

const buildCustomer = (): Customer =>
  Customer.reconstitute({
    id: 'customer-1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+573001234567',
    documentType: DocumentType.CC,
    documentNumber: 'AB123456',
    createdAt: new Date(),
  });

const buildUseCase = () => {
  const transactionRepository: ITransactionRepository = {
    save: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn().mockResolvedValue(buildTransaction()),
    findByReference: jest.fn(),
    existsByReference: jest.fn(),
  };
  const customerRepository: ICustomerRepository = {
    save: jest.fn(),
    findById: jest.fn().mockResolvedValue(buildCustomer()),
  };
  const paymentGateway: IPaymentGateway = {
    submitPayment: jest.fn().mockResolvedValue(
      ok({
        gatewayTransactionId: 'gw-1',
        status: GatewayTransactionStatus.PENDING,
      }),
    ),
  };
  const configService = {
    get: jest.fn().mockReturnValue('integrity-secret'),
  } as unknown as ConfigService;

  const useCase = new ConfirmTransactionUseCase(
    transactionRepository,
    customerRepository,
    paymentGateway,
    new IntegritySignatureService(),
    configService,
  );

  return { useCase, transactionRepository, customerRepository, paymentGateway };
};

describe('ConfirmTransactionUseCase', () => {
  it('submits the payment and stores the gateway result', async () => {
    const { useCase, transactionRepository, paymentGateway } = buildUseCase();

    const result = await useCase.execute({
      transactionId: 'tx-1',
      cardToken: 'tok_test',
      acceptanceToken: 'accept_test',
    });

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.gatewayTransactionId).toBe('gw-1');
      expect(result.value.status).toBe('PENDING');
    }
    expect(paymentGateway.submitPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: 'TX-1',
        amountCents: 11299,
        cardToken: 'tok_test',
      }),
    );
    expect(transactionRepository.save).toHaveBeenCalledTimes(1);
  });

  it('returns TRANSACTION_NOT_FOUND when the transaction does not exist', async () => {
    const { useCase, transactionRepository } = buildUseCase();
    (transactionRepository.findById as jest.Mock).mockResolvedValue(null);

    const result = await useCase.execute({
      transactionId: 'missing',
      cardToken: 'tok_test',
      acceptanceToken: 'accept_test',
    });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.code).toBe('TRANSACTION_NOT_FOUND');
    }
  });

  it('returns INVALID_TRANSACTION_STATE when the transaction is not pending', async () => {
    const { useCase, transactionRepository } = buildUseCase();
    const transaction = buildTransaction();
    transaction.applyGatewayStatus(TransactionStatus.APPROVED, 'gw-0');
    (transactionRepository.findById as jest.Mock).mockResolvedValue(
      transaction,
    );

    const result = await useCase.execute({
      transactionId: 'tx-1',
      cardToken: 'tok_test',
      acceptanceToken: 'accept_test',
    });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.code).toBe('INVALID_TRANSACTION_STATE');
    }
  });

  it('returns CUSTOMER_NOT_FOUND when the transaction customer is missing', async () => {
    const { useCase, customerRepository } = buildUseCase();
    (customerRepository.findById as jest.Mock).mockResolvedValue(null);

    const result = await useCase.execute({
      transactionId: 'tx-1',
      cardToken: 'tok_test',
      acceptanceToken: 'accept_test',
    });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.code).toBe('CUSTOMER_NOT_FOUND');
    }
  });

  it('falls back to an empty integrity secret when none is configured', async () => {
    const { paymentGateway } = buildUseCase();
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const useCaseWithoutSecret = new ConfirmTransactionUseCase(
      {
        findById: jest.fn().mockResolvedValue(buildTransaction()),
        save: jest.fn(),
        findByReference: jest.fn(),
        existsByReference: jest.fn(),
      },
      {
        findById: jest.fn().mockResolvedValue(buildCustomer()),
        save: jest.fn(),
      },
      paymentGateway,
      new IntegritySignatureService(),
      configService,
    );

    const result = await useCaseWithoutSecret.execute({
      transactionId: 'tx-1',
      cardToken: 'tok_test',
      acceptanceToken: 'accept_test',
    });

    expect(result.isOk).toBe(true);
    expect(paymentGateway.submitPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        signature: new IntegritySignatureService().signTransaction(
          'TX-1',
          11299,
          'COP',
          '',
        ),
      }),
    );
  });

  it('propagates a gateway error without mutating the transaction', async () => {
    const { useCase, paymentGateway, transactionRepository } = buildUseCase();
    (paymentGateway.submitPayment as jest.Mock).mockResolvedValue(
      err(DomainError.of('GATEWAY_ERROR', 'boom')),
    );

    const result = await useCase.execute({
      transactionId: 'tx-1',
      cardToken: 'tok_test',
      acceptanceToken: 'accept_test',
    });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.code).toBe('GATEWAY_ERROR');
    }
    expect(transactionRepository.save).not.toHaveBeenCalled();
  });
});
