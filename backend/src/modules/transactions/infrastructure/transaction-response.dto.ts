import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from '../domain/transaction';
import { TransactionStatus } from '../domain/transaction-status';

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reference: string;

  @ApiProperty({ enum: TransactionStatus })
  /* NOTE: see create-customer.dto.ts: enum reflection metadata
   * produces a structurally one-sided branch that no test can flip. */
  status: TransactionStatus;

  @ApiProperty()
  productAmountCents: number;

  @ApiProperty()
  baseFeeCents: number;

  @ApiProperty()
  deliveryFeeCents: number;

  @ApiProperty()
  totalCents: number;

  static fromDomain(transaction: Transaction): TransactionResponseDto {
    const dto = new TransactionResponseDto();
    dto.id = transaction.id;
    dto.reference = transaction.reference;
    dto.status = transaction.status;
    dto.productAmountCents = transaction.productAmountCents;
    dto.baseFeeCents = transaction.baseFeeCents;
    dto.deliveryFeeCents = transaction.deliveryFeeCents;
    dto.totalCents = transaction.totalCents;
    return dto;
  }
}
