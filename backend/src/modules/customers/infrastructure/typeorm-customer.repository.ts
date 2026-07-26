import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../domain/customer';
import { ICustomerRepository } from '../domain/customer.repository';
import { CustomerOrmEntity } from './customer.orm-entity';
import { CustomerMapper } from './customer.mapper';

@Injectable()
export class TypeOrmCustomerRepository implements ICustomerRepository {
  /* NOTE: emitDecoratorMetadata reflects the injected
   * Repository class as a typeof check that is always true for a real class,
   * so one branch side is structurally unreachable regardless of test input. */
  constructor(
    @InjectRepository(CustomerOrmEntity)
    private readonly repository: Repository<CustomerOrmEntity>,
  ) {}

  async save(customer: Customer): Promise<void> {
    await this.repository.save(CustomerMapper.toOrm(customer));
  }

  async findById(id: string): Promise<Customer | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? CustomerMapper.toDomain(entity) : null;
  }
}
