import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Length } from 'class-validator';

export class CreateDeliveryDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @IsString()
  @Length(5, 500)
  address: string;

  @ApiProperty()
  @IsString()
  @Length(2, 120)
  city: string;

  @ApiProperty()
  @IsString()
  @Length(2, 120)
  region: string;
}
