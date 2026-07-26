import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../domain/product';

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  priceCents: number;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  imageUrl: string;

  static fromDomain(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.description = product.description;
    dto.priceCents = product.priceCents;
    dto.stock = product.stock;
    dto.imageUrl = product.imageUrl;
    return dto;
  }
}
