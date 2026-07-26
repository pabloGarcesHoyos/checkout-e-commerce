import axios from 'axios';

const gatewayClient = axios.create({
  baseURL: import.meta.env.VITE_PAYMENT_GATEWAY_BASE_URL ?? 'https://sandbox.payment-gateway.example/v1',
});

const publicKey = import.meta.env.VITE_PAYMENT_GATEWAY_PUBLIC_KEY ?? '';

export interface TokenizeCardPayload {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}

export const fetchAcceptanceToken = async (): Promise<string> => {
  const response = await gatewayClient.get<{ data: { presigned_acceptance: { acceptance_token: string } } }>(
    `/merchants/${publicKey}`,
  );
  return response.data.data.presigned_acceptance.acceptance_token;
};

export const tokenizeCard = async (payload: TokenizeCardPayload): Promise<string> => {
  const response = await gatewayClient.post<{ data: { id: string } }>(
    '/tokens/cards',
    {
      number: payload.number,
      cvc: payload.cvc,
      exp_month: payload.expMonth,
      exp_year: payload.expYear,
      card_holder: payload.cardHolder,
    },
    { headers: { Authorization: `Bearer ${publicKey}` } },
  );
  return response.data.data.id;
};
