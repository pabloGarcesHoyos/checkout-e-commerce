import { httpClient } from './httpClient';
import { createCustomer } from './customers';
import { DocumentType } from '../types';

jest.mock('./httpClient', () => ({
  httpClient: { get: jest.fn(), post: jest.fn() },
}));

const mockedPost = httpClient.post as jest.Mock;

describe('customers api', () => {
  afterEach(() => jest.clearAllMocks());

  it('createCustomer posts the payload and returns the created customer', async () => {
    const payload = {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+573001234567',
      documentType: DocumentType.CC,
      documentNumber: 'AB123456',
    };
    const created = { id: 'customer-1', ...payload };
    mockedPost.mockResolvedValue({ data: created });

    const result = await createCustomer(payload);

    expect(mockedPost).toHaveBeenCalledWith('/customers', payload);
    expect(result).toEqual(created);
  });
});
