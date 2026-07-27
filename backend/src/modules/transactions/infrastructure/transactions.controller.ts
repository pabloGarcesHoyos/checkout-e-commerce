import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CreateTransactionUseCase } from '../application/create-transaction.use-case';
import { ConfirmTransactionUseCase } from '../application/confirm-transaction.use-case';
import { GetTransactionUseCase } from '../application/get-transaction.use-case';
import { ReconcileTransactionStatusUseCase } from '../application/reconcile-transaction-status.use-case';
import { CreateTransactionDto } from './create-transaction.dto';
import { ConfirmTransactionDto } from './confirm-transaction.dto';
import { TransactionResponseDto } from './transaction-response.dto';
import { httpStatusForDomainError } from '../../../shared/infrastructure/domain-error-http-mapper';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createTransaction: CreateTransactionUseCase,
    private readonly confirmTransaction: ConfirmTransactionUseCase,
    private readonly getTransaction: GetTransactionUseCase,
    private readonly reconcileTransactionStatus: ReconcileTransactionStatusUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: TransactionResponseDto })
  async create(
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const result = await this.createTransaction.execute(dto);
    if (result.isErr) {
      throw new HttpException(
        result.error.message,
        httpStatusForDomainError(result.error),
      );
    }
    return TransactionResponseDto.fromDomain(result.value);
  }

  @Post(':id/confirm')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOkResponse({ type: TransactionResponseDto })
  async confirm(
    @Param('id') id: string,
    @Body() dto: ConfirmTransactionDto,
  ): Promise<TransactionResponseDto> {
    const result = await this.confirmTransaction.execute({
      transactionId: id,
      cardToken: dto.cardToken,
      acceptanceToken: dto.acceptanceToken,
    });
    if (result.isErr) {
      throw new HttpException(
        result.error.message,
        httpStatusForDomainError(result.error),
      );
    }
    return TransactionResponseDto.fromDomain(result.value);
  }

  @Get(':id')
  @ApiOkResponse({ type: TransactionResponseDto })
  async findOne(@Param('id') id: string): Promise<TransactionResponseDto> {
    await this.reconcileTransactionStatus.execute(id);
    const result = await this.getTransaction.execute(id);
    if (result.isErr) {
      throw new HttpException(
        result.error.message,
        httpStatusForDomainError(result.error),
      );
    }
    return TransactionResponseDto.fromDomain(result.value);
  }
}
