import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ok, Result } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';
import { Customer } from '../domain/customer';
import { DocumentType } from '../domain/document-type';
import { CUSTOMER_REPOSITORY } from '../domain/customer.repository';
import type { ICustomerRepository } from '../domain/customer.repository';

export interface CreateCustomerCommand {
  fullName: string;
  email: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
}

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(
    command: CreateCustomerCommand,
  ): Promise<Result<Customer, DomainError>> {
    const customer = Customer.create({ id: randomUUID(), ...command });
    await this.customerRepository.save(customer);
    return ok(customer);
  }
}
