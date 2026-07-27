jest.mock('axios', () => {
  const mockedClient = { get: jest.fn(), post: jest.fn() };
  return { __esModule: true, default: { create: jest.fn(() => mockedClient) } };
});

import axios from 'axios';
import { fetchAcceptanceToken, tokenizeCard } from './paymentGateway';

const mockedClient = (axios.create as jest.Mock).mock.results[0].value as {
  get: jest.Mock;
  post: jest.Mock;
};

describe('paymentGateway api', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetchAcceptanceToken requests and extracts the acceptance token', async () => {
    mockedClient.get.mockResolvedValue({
      data: { data: { presigned_acceptance: { acceptance_token: 'accept-token-123' } } },
    });

    const token = await fetchAcceptanceToken();

    expect(mockedClient.get).toHaveBeenCalledWith(expect.stringMatching(/^\/merchants\//));
    expect(token).toBe('accept-token-123');
  });

  it('tokenizeCard posts card details and returns the token id', async () => {
    mockedClient.post.mockResolvedValue({ data: { data: { id: 'card-token-456' } } });

    const token = await tokenizeCard({
      number: '4111111111111111',
      cvc: '123',
      expMonth: '12',
      expYear: '2099',
      cardHolder: 'Jane Doe',
    });

    expect(mockedClient.post).toHaveBeenCalledWith(
      '/tokens/cards',
      expect.objectContaining({
        number: '4111111111111111',
        cvc: '123',
        exp_month: '12',
        exp_year: '99',
        card_holder: 'Jane Doe',
      }),
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(token).toBe('card-token-456');
  });

  it('strips whitespace from the card number as typed in the UI before sending it to the gateway', async () => {
    mockedClient.post.mockResolvedValue({ data: { data: { id: 'card-token-456' } } });

    await tokenizeCard({
      number: '4242 4242 4242 4242',
      cvc: '123',
      expMonth: '12',
      expYear: '2030',
      cardHolder: 'Jane Doe',
    });

    expect(mockedClient.post).toHaveBeenCalledWith(
      '/tokens/cards',
      expect.objectContaining({ number: '4242424242424242' }),
      expect.any(Object),
    );
  });

  it('truncates a 4-digit expiration year to the 2-digit format the gateway requires', async () => {
    mockedClient.post.mockResolvedValue({ data: { data: { id: 'card-token-456' } } });

    await tokenizeCard({
      number: '4242424242424242',
      cvc: '123',
      expMonth: '12',
      expYear: '2030',
      cardHolder: 'Jane Doe',
    });

    expect(mockedClient.post).toHaveBeenCalledWith(
      '/tokens/cards',
      expect.objectContaining({ exp_year: '30' }),
      expect.any(Object),
    );
  });

  it('leaves an already 2-digit expiration year untouched', async () => {
    mockedClient.post.mockResolvedValue({ data: { data: { id: 'card-token-456' } } });

    await tokenizeCard({
      number: '4242424242424242',
      cvc: '123',
      expMonth: '12',
      expYear: '30',
      cardHolder: 'Jane Doe',
    });

    expect(mockedClient.post).toHaveBeenCalledWith(
      '/tokens/cards',
      expect.objectContaining({ exp_year: '30' }),
      expect.any(Object),
    );
  });

  it('never sends a card number containing non-digit characters or a 4-digit year to the gateway', async () => {
    mockedClient.post.mockResolvedValue({ data: { data: { id: 'card-token-456' } } });

    await tokenizeCard({
      number: '4242 4242 4242 4242',
      cvc: '123',
      expMonth: '12',
      expYear: '2030',
      cardHolder: 'Jane Doe',
    });

    const [, body] = mockedClient.post.mock.calls[0] as [string, { number: string; exp_year: string }];
    expect(body.number).toMatch(/^\d{12,19}$/);
    expect(body.exp_year).toMatch(/^\d{2}$/);
  });
});
