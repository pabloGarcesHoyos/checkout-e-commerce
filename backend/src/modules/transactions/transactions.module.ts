import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionOrmEntity } from './infrastructure/transaction.orm-entity';
import { TypeOrmTransactionRepository } from './infrastructure/typeorm-transaction.repository';
import { TransactionsController } from './infrastructure/transactions.controller';
import { WebhooksController } from './infrastructure/webhooks.controller';
import { CreateTransactionUseCase } from './application/create-transaction.use-case';
import { ConfirmTransactionUseCase } from './application/confirm-transaction.use-case';
import { GetTransactionUseCase } from './application/get-transaction.use-case';
import { HandlePaymentWebhookUseCase } from './application/handle-payment-webhook.use-case';
import { ReconcileTransactionStatusUseCase } from './application/reconcile-transaction-status.use-case';
import { ApplyTransactionResolutionService } from './application/apply-transaction-resolution.service';
import { TRANSACTION_REPOSITORY } from './domain/transaction.repository';
import { ProductsModule } from '../products/products.module';
import { CustomersModule } from '../customers/customers.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionOrmEntity]),
    ProductsModule,
    CustomersModule,
    DeliveriesModule,
    PaymentsModule,
  ],
  controllers: [TransactionsController, WebhooksController],
  providers: [
    CreateTransactionUseCase,
    ConfirmTransactionUseCase,
    GetTransactionUseCase,
    HandlePaymentWebhookUseCase,
    ReconcileTransactionStatusUseCase,
    ApplyTransactionResolutionService,
    { provide: TRANSACTION_REPOSITORY, useClass: TypeOrmTransactionRepository },
  ],
})
export class TransactionsModule {}
