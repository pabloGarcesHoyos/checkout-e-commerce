import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { HandlePaymentWebhookUseCase } from '../application/handle-payment-webhook.use-case';
import { PaymentWebhookDto } from './payment-webhook.dto';
import { httpStatusForDomainError } from '../../../shared/infrastructure/domain-error-http-mapper';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly handlePaymentWebhook: HandlePaymentWebhookUseCase,
  ) {}

  @Post('payment-gateway')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOkResponse({ description: 'Webhook acknowledged' })
  async handle(@Body() dto: PaymentWebhookDto): Promise<{ received: boolean }> {
    const result = await this.handlePaymentWebhook.execute({
      payload: dto,
      transactionData: dto.data.transaction,
    });

    if (result.isErr) {
      const status =
        result.error.code === 'INVALID_WEBHOOK_SIGNATURE'
          ? HttpStatus.UNAUTHORIZED
          : httpStatusForDomainError(result.error);
      throw new HttpException(result.error.message, status);
    }

    return { received: true };
  }
}
