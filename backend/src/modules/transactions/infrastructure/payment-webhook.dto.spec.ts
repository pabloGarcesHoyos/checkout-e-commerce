import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  PaymentWebhookDto,
  WebhookDataDto,
  WebhookTransactionDataDto,
} from './payment-webhook.dto';

describe('PaymentWebhookDto', () => {
  it('transforms a raw payload into nested DTO instances', () => {
    const raw = {
      data: {
        transaction: { id: 'gw-1', reference: 'TX-1', status: 'APPROVED' },
      },
      signature: {
        properties: ['transaction.id', 'transaction.status'],
        checksum: 'abc',
      },
      timestamp: 1700000000,
    };

    const dto = plainToInstance(PaymentWebhookDto, raw);

    expect(dto).toBeInstanceOf(PaymentWebhookDto);
    expect(dto.data).toBeInstanceOf(WebhookDataDto);
    expect(dto.data.transaction).toBeInstanceOf(WebhookTransactionDataDto);
    expect(dto.data.transaction.status).toBe('APPROVED');
  });

  it('rejects a payload with a missing signature instead of passing it through', async () => {
    const raw = {
      data: {
        transaction: { id: 'gw-1', reference: 'TX-1', status: 'APPROVED' },
      },
      timestamp: 1700000000,
    };

    const dto = plainToInstance(PaymentWebhookDto, raw);
    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'signature')).toBe(true);
  });

  it('rejects a payload with a missing data.transaction instead of passing it through', async () => {
    const raw = {
      data: {},
      signature: { properties: ['transaction.id'], checksum: 'abc' },
      timestamp: 1700000000,
    };

    const dto = plainToInstance(PaymentWebhookDto, raw);
    const errors = await validate(dto);
    const dataError = errors.find((e) => e.property === 'data');

    expect(dataError?.children?.some((c) => c.property === 'transaction')).toBe(
      true,
    );
  });
});
