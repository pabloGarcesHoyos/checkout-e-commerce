export type DomainErrorCode =
  | 'PRODUCT_NOT_FOUND'
  | 'INSUFFICIENT_STOCK'
  | 'CUSTOMER_NOT_FOUND'
  | 'DELIVERY_NOT_FOUND'
  | 'TRANSACTION_NOT_FOUND'
  | 'INVALID_TRANSACTION_STATE'
  | 'DUPLICATE_WEBHOOK_EVENT'
  | 'INVALID_WEBHOOK_SIGNATURE'
  | 'GATEWAY_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNEXPECTED_ERROR';

export class DomainError {
  private constructor(
    readonly code: DomainErrorCode,
    readonly message: string,
  ) {}

  static of(code: DomainErrorCode, message: string): DomainError {
    return new DomainError(code, message);
  }
}
