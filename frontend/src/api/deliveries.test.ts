import { httpClient } from './httpClient';
import { createDelivery } from './deliveries';

jest.mock('./httpClient', () => ({
  httpClient: { get: jest.fn(), post: jest.fn() },
}));

const mockedPost = httpClient.post as jest.Mock;

describe('deliveries api', () => {
  afterEach(() => jest.clearAllMocks());

  it('createDelivery posts the payload and returns the created delivery', async () => {
    const payload = { customerId: 'customer-1', address: '123 Main St', city: 'Bogota', region: 'bogota' };
    const created = { id: 'delivery-1', ...payload, deliveryFeeCents: 800 };
    mockedPost.mockResolvedValue({ data: created });

    const result = await createDelivery(payload);

    expect(mockedPost).toHaveBeenCalledWith('/deliveries', payload);
    expect(result).toEqual(created);
  });
});
