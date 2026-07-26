import { HttpException, HttpStatus } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { HandlePaymentWebhookUseCase } from '../application/handle-payment-webhook.use-case';
import { Transaction } from '../domain/transaction';
import { ok, err } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';
import { PaymentWebhookDto } from './payment-webhook.dto';
import { TransactionStatus } from '../domain/transaction-status';

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

const buildPayload = (): PaymentWebhookDto => {
  const dto = new PaymentWebhookDto();
  dto.data = {
    transaction: {
      id: 'gw-1',
      reference: 'TX-1',
      status: TransactionStatus.APPROVED,
    },
  };
  dto.signature = {
    properties: ['transaction.id', 'transaction.status'],
    checksum: 'abc',
  };
  dto.timestamp = 1700000000;
  return dto;
};

describe('WebhooksController', () => {
  it('acknowledges a valid webhook', async () => {
    const handlePaymentWebhook = {
      execute: jest.fn().mockResolvedValue(ok(buildTransaction())),
    } as unknown as HandlePaymentWebhookUseCase;
    const controller = new WebhooksController(handlePaymentWebhook);

    const result = await controller.handle(buildPayload());

    expect(result).toEqual({ received: true });
    expect(handlePaymentWebhook.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionData: { id: 'gw-1', reference: 'TX-1', status: 'APPROVED' },
      }),
    );
  });

  it('throws a 401 for an invalid signature', async () => {
    const handlePaymentWebhook = {
      execute: jest
        .fn()
        .mockResolvedValue(
          err(DomainError.of('INVALID_WEBHOOK_SIGNATURE', 'bad signature')),
        ),
    } as unknown as HandlePaymentWebhookUseCase;
    const controller = new WebhooksController(handlePaymentWebhook);

    await expect(controller.handle(buildPayload())).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
    });
  });

  it('throws an HttpException for other domain errors', async () => {
    const handlePaymentWebhook = {
      execute: jest
        .fn()
        .mockResolvedValue(
          err(DomainError.of('TRANSACTION_NOT_FOUND', 'not found')),
        ),
    } as unknown as HandlePaymentWebhookUseCase;
    const controller = new WebhooksController(handlePaymentWebhook);

    await expect(controller.handle(buildPayload())).rejects.toBeInstanceOf(
      HttpException,
    );
  });
});
