import { Module } from '@nestjs/common';
import { SandboxPaymentGatewayAdapter } from './infrastructure/sandbox-payment-gateway.adapter';
import { PAYMENT_GATEWAY } from './domain/payment-gateway.port';
import { IntegritySignatureService } from './domain/integrity-signature.service';

@Module({
  providers: [
    IntegritySignatureService,
    { provide: PAYMENT_GATEWAY, useClass: SandboxPaymentGatewayAdapter },
  ],
  exports: [PAYMENT_GATEWAY, IntegritySignatureService],
})
export class PaymentsModule {}
