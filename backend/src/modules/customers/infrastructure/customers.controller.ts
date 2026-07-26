import { Body, Controller, HttpException, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { CreateCustomerUseCase } from '../application/create-customer.use-case';
import { CreateCustomerDto } from './create-customer.dto';
import { CustomerResponseDto } from './customer-response.dto';
import { httpStatusForDomainError } from '../../../shared/infrastructure/domain-error-http-mapper';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly createCustomer: CreateCustomerUseCase) {}

  @Post()
  @ApiCreatedResponse({ type: CustomerResponseDto })
  async create(@Body() dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    const result = await this.createCustomer.execute(dto);
    if (result.isErr) {
      throw new HttpException(
        result.error.message,
        httpStatusForDomainError(result.error),
      );
    }
    return CustomerResponseDto.fromDomain(result.value);
  }
}
