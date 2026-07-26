import { plainToInstance } from 'class-transformer';
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
});
