import { createHash } from 'crypto';
import { IntegritySignatureService } from './integrity-signature.service';

describe('IntegritySignatureService', () => {
  const service = new IntegritySignatureService();

  describe('signTransaction', () => {
    it('produces a deterministic sha256 hex digest of the concatenated fields', () => {
      const signature = service.signTransaction('TX-1', 10000, 'COP', 'secret');
      const expected = createHash('sha256')
        .update('TX-110000COPsecret')
        .digest('hex');
      expect(signature).toBe(expected);
    });

    it('produces different signatures for different inputs', () => {
      const a = service.signTransaction('TX-1', 10000, 'COP', 'secret');
      const b = service.signTransaction('TX-2', 10000, 'COP', 'secret');
      expect(a).not.toBe(b);
    });
  });

  describe('verifyWebhookSignature', () => {
    const secret = 'events-secret';

    const buildValidPayload = () => {
      const data = {
        transaction: { id: 'gw-1', reference: 'TX-1', status: 'APPROVED' },
      };
      const timestamp = 1700000000;
      const concatenated = `${data.transaction.id}${data.transaction.status}`;
      const checksum = createHash('sha256')
        .update(`${concatenated}${timestamp}${secret}`)
        .digest('hex');
      return {
        data,
        timestamp,
        signature: {
          properties: ['transaction.id', 'transaction.status'],
          checksum,
        },
      };
    };

    it('returns true for a correctly signed payload', () => {
      expect(service.verifyWebhookSignature(buildValidPayload(), secret)).toBe(
        true,
      );
    });

    it('returns false when the checksum does not match', () => {
      const payload = buildValidPayload();
      payload.signature.checksum = 'tampered';
      expect(service.verifyWebhookSignature(payload, secret)).toBe(false);
    });

    it('returns false when the secret differs', () => {
      const payload = buildValidPayload();
      expect(service.verifyWebhookSignature(payload, 'wrong-secret')).toBe(
        false,
      );
    });

    it('returns false when a signed property is missing from the payload', () => {
      const payload = buildValidPayload();
      payload.signature.properties = ['transaction.id', 'transaction.missing'];
      expect(service.verifyWebhookSignature(payload, secret)).toBe(false);
    });

    it('stops descending once it reaches a non-object value and treats deeper segments as empty', () => {
      const payload = buildValidPayload();
      // 'transaction.id' resolves to the string 'gw-1'; trying to go one level
      // deeper than that must not throw, and must be treated as an empty value.
      payload.signature.properties = [
        'transaction.id.deeper',
        'transaction.status',
      ];
      const concatenated = `${payload.data.transaction.status}`;
      payload.signature.checksum = createHash('sha256')
        .update(`${concatenated}${payload.timestamp}${secret}`)
        .digest('hex');

      expect(service.verifyWebhookSignature(payload, secret)).toBe(true);
    });

    it('stringifies a numeric signed property instead of dropping it', () => {
      const data = {
        transaction: { id: 'gw-1', reference: 'TX-1', status: 'APPROVED' },
        amountCents: 11299,
      };
      const timestamp = 1700000000;
      const concatenated = `${data.transaction.id}${data.amountCents}`;
      const checksum = createHash('sha256')
        .update(`${concatenated}${timestamp}${secret}`)
        .digest('hex');
      const payload = {
        data,
        timestamp,
        signature: { properties: ['transaction.id', 'amountCents'], checksum },
      };

      expect(service.verifyWebhookSignature(payload, secret)).toBe(true);
    });
  });
});
