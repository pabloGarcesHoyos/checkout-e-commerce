import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerOrmEntity } from './infrastructure/customer.orm-entity';
import { TypeOrmCustomerRepository } from './infrastructure/typeorm-customer.repository';
import { CustomersController } from './infrastructure/customers.controller';
import { CreateCustomerUseCase } from './application/create-customer.use-case';
import { CUSTOMER_REPOSITORY } from './domain/customer.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerOrmEntity])],
  controllers: [CustomersController],
  providers: [
    CreateCustomerUseCase,
    { provide: CUSTOMER_REPOSITORY, useClass: TypeOrmCustomerRepository },
  ],
  exports: [CUSTOMER_REPOSITORY],
})
export class CustomersModule {}
