import { createHash, timingSafeEqual } from 'crypto';

const sha256Hex = (raw: string): string =>
  createHash('sha256').update(raw).digest('hex');

const getNestedValue = (source: object, path: string): unknown =>
  path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);

const toComparableString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
};

const safeEquals = (a: string, b: string): boolean => {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
};

export interface WebhookSignature {
  properties: string[];
  checksum: string;
}

export interface WebhookEventPayload {
  data: object;
  signature: WebhookSignature;
  timestamp: number;
}

export class IntegritySignatureService {
  signTransaction(
    reference: string,
    amountCents: number,
    currency: string,
    secret: string,
  ): string {
    return sha256Hex(`${reference}${amountCents}${currency}${secret}`);
  }

  verifyWebhookSignature(
    payload: WebhookEventPayload,
    secret: string,
  ): boolean {
    const concatenated = payload.signature.properties
      .map((path) => toComparableString(getNestedValue(payload.data, path)))
      .join('');
    const expected = sha256Hex(`${concatenated}${payload.timestamp}${secret}`);
    return safeEquals(expected, payload.signature.checksum.toLowerCase());
  }
}
