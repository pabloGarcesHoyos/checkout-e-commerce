import { Body, Controller, HttpException, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { CreateDeliveryUseCase } from '../application/create-delivery.use-case';
import { CreateDeliveryDto } from './create-delivery.dto';
import { DeliveryResponseDto } from './delivery-response.dto';
import { httpStatusForDomainError } from '../../../shared/infrastructure/domain-error-http-mapper';

@ApiTags('deliveries')
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly createDelivery: CreateDeliveryUseCase) {}

  @Post()
  @ApiCreatedResponse({ type: DeliveryResponseDto })
  async create(@Body() dto: CreateDeliveryDto): Promise<DeliveryResponseDto> {
    const result = await this.createDelivery.execute(dto);
    if (result.isErr) {
      throw new HttpException(
        result.error.message,
        httpStatusForDomainError(result.error),
      );
    }
    return DeliveryResponseDto.fromDomain(result.value);
  }
}
