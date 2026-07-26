import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { SandboxPaymentGatewayAdapter } from './sandbox-payment-gateway.adapter';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SandboxPaymentGatewayAdapter', () => {
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'PAYMENT_GATEWAY_BASE_URL')
        return 'https://sandbox.example/v1';
      if (key === 'PAYMENT_GATEWAY_PRIVATE_KEY') return 'prv_test';
      return undefined;
    }),
  } as unknown as ConfigService;

  const command = {
    reference: 'TX-1',
    amountCents: 10000,
    currency: 'COP',
    cardToken: 'tok_test',
    customerEmail: 'jane@example.com',
    signature: 'signature-hash',
  };

  afterEach(() => jest.clearAllMocks());

  it('maps a successful gateway response to a submission result', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { data: { id: 'gw-1', status: 'PENDING' } },
    });
    const adapter = new SandboxPaymentGatewayAdapter(configService);

    const result = await adapter.submitPayment(command);

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value).toEqual({
        gatewayTransactionId: 'gw-1',
        status: 'PENDING',
      });
    }
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://sandbox.example/v1/transactions',
      expect.objectContaining({ reference: 'TX-1', amount_in_cents: 10000 }),
      expect.objectContaining({
        headers: { Authorization: 'Bearer prv_test' },
      }),
    );
  });

  it('falls back to ERROR status for an unrecognized gateway status', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { data: { id: 'gw-1', status: 'UNKNOWN' } },
    });
    const adapter = new SandboxPaymentGatewayAdapter(configService);

    const result = await adapter.submitPayment(command);

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.status).toBe('ERROR');
    }
  });

  it('returns a GATEWAY_ERROR result when the request fails', async () => {
    mockedAxios.post.mockRejectedValue(new Error('network error'));
    const adapter = new SandboxPaymentGatewayAdapter(configService);

    const result = await adapter.submitPayment(command);

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.code).toBe('GATEWAY_ERROR');
    }
  });
});
