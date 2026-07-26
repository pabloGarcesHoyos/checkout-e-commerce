import { ApiProperty } from '@nestjs/swagger';
import { Delivery } from '../domain/delivery';

export class DeliveryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  region: string;

  @ApiProperty()
  deliveryFeeCents: number;

  static fromDomain(delivery: Delivery): DeliveryResponseDto {
    const dto = new DeliveryResponseDto();
    dto.id = delivery.id;
    dto.customerId = delivery.customerId;
    dto.address = delivery.address;
    dto.city = delivery.city;
    dto.region = delivery.region;
    dto.deliveryFeeCents = delivery.deliveryFeeCents;
    return dto;
  }
}
