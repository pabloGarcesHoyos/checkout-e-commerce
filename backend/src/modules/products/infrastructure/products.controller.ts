import {
  Controller,
  Get,
  HttpException,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ListProductsUseCase } from '../application/list-products.use-case';
import { GetProductByIdUseCase } from '../application/get-product-by-id.use-case';
import { ProductResponseDto } from './product-response.dto';
import { httpStatusForDomainError } from '../../../shared/infrastructure/domain-error-http-mapper';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly getProductById: GetProductByIdUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  async findAll(): Promise<ProductResponseDto[]> {
    const result = await this.listProducts.execute();
    if (result.isErr) {
      throw new HttpException(
        result.error.message,
        httpStatusForDomainError(result.error),
      );
    }
    return result.value.map((product) =>
      ProductResponseDto.fromDomain(product),
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: ProductResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductResponseDto> {
    const result = await this.getProductById.execute(id);
    if (result.isErr) {
      throw new HttpException(
        result.error.message,
        httpStatusForDomainError(result.error),
      );
    }
    return ProductResponseDto.fromDomain(result.value);
  }
}
