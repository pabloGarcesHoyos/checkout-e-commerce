import { randomUUID } from 'crypto';

export const generateTransactionReference = (): string => `TX-${randomUUID()}`;
