import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ConfirmTransactionDto {
  @ApiProperty({
    description:
      'Tokenized card reference obtained directly from the payment gateway',
  })
  @IsString()
  @Length(5, 200)
  cardToken: string;

  @ApiProperty({
    description:
      "Merchant's presigned acceptance token (terms & personal data policy), obtained directly from the payment gateway",
  })
  @IsString()
  @Length(5, 2000)
  acceptanceToken: string;
}
