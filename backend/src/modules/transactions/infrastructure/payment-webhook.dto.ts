import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TransactionStatus } from '../domain/transaction-status';

export class WebhookTransactionDataDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  reference: string;

  @ApiProperty({ enum: TransactionStatus })
  @IsIn(Object.values(TransactionStatus))
  status: TransactionStatus;
}

export class WebhookDataDto {
  @ApiProperty({ type: WebhookTransactionDataDto })
  @ValidateNested()
  @Type(() => WebhookTransactionDataDto)
  transaction: WebhookTransactionDataDto;
}

export class WebhookSignatureDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  properties: string[];

  @ApiProperty()
  @IsString()
  checksum: string;
}

export class PaymentWebhookDto {
  @ApiProperty({ type: WebhookDataDto })
  @IsObject()
  @ValidateNested()
  @Type(() => WebhookDataDto)
  data: WebhookDataDto;

  @ApiProperty({ type: WebhookSignatureDto })
  @ValidateNested()
  @Type(() => WebhookSignatureDto)
  signature: WebhookSignatureDto;

  @ApiProperty()
  @IsNumber()
  timestamp: number;
}
