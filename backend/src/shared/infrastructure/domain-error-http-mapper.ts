import { HttpStatus } from '@nestjs/common';
import { DomainError, DomainErrorCode } from '../domain/domain-error';

const STATUS_BY_CODE: Record<DomainErrorCode, HttpStatus> = {
  PRODUCT_NOT_FOUND: HttpStatus.NOT_FOUND,
  CUSTOMER_NOT_FOUND: HttpStatus.NOT_FOUND,
  DELIVERY_NOT_FOUND: HttpStatus.NOT_FOUND,
  TRANSACTION_NOT_FOUND: HttpStatus.NOT_FOUND,
  INSUFFICIENT_STOCK: HttpStatus.CONFLICT,
  INVALID_TRANSACTION_STATE: HttpStatus.CONFLICT,
  DUPLICATE_WEBHOOK_EVENT: HttpStatus.OK,
  INVALID_WEBHOOK_SIGNATURE: HttpStatus.UNAUTHORIZED,
  GATEWAY_ERROR: HttpStatus.BAD_GATEWAY,
  VALIDATION_ERROR: HttpStatus.BAD_REQUEST,
  UNEXPECTED_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
};

export const httpStatusForDomainError = (error: DomainError): HttpStatus =>
  STATUS_BY_CODE[error.code];
