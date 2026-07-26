import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryOrmEntity } from './infrastructure/delivery.orm-entity';
import { TypeOrmDeliveryRepository } from './infrastructure/typeorm-delivery.repository';
import { DeliveriesController } from './infrastructure/deliveries.controller';
import { CreateDeliveryUseCase } from './application/create-delivery.use-case';
import { DELIVERY_REPOSITORY } from './domain/delivery.repository';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryOrmEntity]), CustomersModule],
  controllers: [DeliveriesController],
  providers: [
    CreateDeliveryUseCase,
    { provide: DELIVERY_REPOSITORY, useClass: TypeOrmDeliveryRepository },
  ],
  exports: [DELIVERY_REPOSITORY],
})
export class DeliveriesModule {}
