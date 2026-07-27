import { HttpException } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { CreateTransactionUseCase } from '../application/create-transaction.use-case';
import { ConfirmTransactionUseCase } from '../application/confirm-transaction.use-case';
import { GetTransactionUseCase } from '../application/get-transaction.use-case';
import { ReconcileTransactionStatusUseCase } from '../application/reconcile-transaction-status.use-case';
import { Transaction } from '../domain/transaction';
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

describe('TransactionsController', () => {
  const buildController = () => {
    const createTransaction = {
      execute: jest.fn(),
    } as unknown as CreateTransactionUseCase;
    const confirmTransaction = {
      execute: jest.fn(),
    } as unknown as ConfirmTransactionUseCase;
    const getTransaction = {
      execute: jest.fn(),
    } as unknown as GetTransactionUseCase;
    const reconcileTransactionStatus = {
      execute: jest.fn(),
    } as unknown as ReconcileTransactionStatusUseCase;
    const controller = new TransactionsController(
      createTransaction,
      confirmTransaction,
      getTransaction,
      reconcileTransactionStatus,
    );
    return {
      controller,
      createTransaction,
      confirmTransaction,
      getTransaction,
      reconcileTransactionStatus,
    };
  };

  it('creates a transaction and returns the mapped DTO', async () => {
    const { controller, createTransaction } = buildController();
    (createTransaction.execute as jest.Mock).mockResolvedValue(
      ok(buildTransaction()),
    );

    const result = await controller.create({
      productId: 'product-1',
      customerId: 'customer-1',
      deliveryId: 'delivery-1',
    });

    expect(result.reference).toBe('TX-1');
  });

  it('throws an HttpException when creation fails', async () => {
    const { controller, createTransaction } = buildController();
    (createTransaction.execute as jest.Mock).mockResolvedValue(
      err(DomainError.of('PRODUCT_NOT_FOUND', 'not found')),
    );

    await expect(
      controller.create({
        productId: 'missing',
        customerId: 'customer-1',
        deliveryId: 'delivery-1',
      }),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('confirms a transaction and returns the mapped DTO', async () => {
    const { controller, confirmTransaction } = buildController();
    (confirmTransaction.execute as jest.Mock).mockResolvedValue(
      ok(buildTransaction()),
    );

    const result = await controller.confirm('tx-1', {
      cardToken: 'tok_test',
      acceptanceToken: 'accept_test',
    });

    expect(result.id).toBe('tx-1');
    expect(confirmTransaction.execute).toHaveBeenCalledWith({
      transactionId: 'tx-1',
      cardToken: 'tok_test',
      acceptanceToken: 'accept_test',
    });
  });

  it('throws an HttpException when confirmation fails', async () => {
    const { controller, confirmTransaction } = buildController();
    (confirmTransaction.execute as jest.Mock).mockResolvedValue(
      err(DomainError.of('INVALID_TRANSACTION_STATE', 'bad state')),
    );

    await expect(
      controller.confirm('tx-1', {
        cardToken: 'tok_test',
        acceptanceToken: 'accept_test',
      }),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('returns a transaction by id', async () => {
    const { controller, getTransaction } = buildController();
    (getTransaction.execute as jest.Mock).mockResolvedValue(
      ok(buildTransaction()),
    );

    const result = await controller.findOne('tx-1');

    expect(result.id).toBe('tx-1');
  });

  it('attempts reconciliation before reading the transaction', async () => {
    const { controller, getTransaction, reconcileTransactionStatus } =
      buildController();
    (getTransaction.execute as jest.Mock).mockResolvedValue(
      ok(buildTransaction()),
    );

    await controller.findOne('tx-1');

    expect(reconcileTransactionStatus.execute).toHaveBeenCalledWith('tx-1');
  });

  it('throws an HttpException when the transaction is not found', async () => {
    const { controller, getTransaction } = buildController();
    (getTransaction.execute as jest.Mock).mockResolvedValue(
      err(DomainError.of('TRANSACTION_NOT_FOUND', 'not found')),
    );

    await expect(controller.findOne('missing')).rejects.toBeInstanceOf(
      HttpException,
    );
  });
});
