import { HttpException } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CreateCustomerUseCase } from '../application/create-customer.use-case';
import { Customer } from '../domain/customer';
import { DocumentType } from '../domain/document-type';
import { ok, err } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';

describe('CustomersController', () => {
  it('returns the mapped created customer', async () => {
    const customer = Customer.reconstitute({
      id: 'customer-1',
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+573001234567',
      documentType: DocumentType.CC,
      documentNumber: 'AB123456',
      createdAt: new Date(),
    });
    const createCustomer = {
      execute: jest.fn().mockResolvedValue(ok(customer)),
    } as unknown as CreateCustomerUseCase;
    const controller = new CustomersController(createCustomer);

    const result = await controller.create({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+573001234567',
      documentType: DocumentType.CC,
      documentNumber: 'AB123456',
    });

    expect(result.id).toBe('customer-1');
  });

  it('throws an HttpException when customer creation fails', async () => {
    const createCustomer = {
      execute: jest
        .fn()
        .mockResolvedValue(err(DomainError.of('VALIDATION_ERROR', 'boom'))),
    } as unknown as CreateCustomerUseCase;
    const controller = new CustomersController(createCustomer);

    await expect(
      controller.create({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+573001234567',
        documentType: DocumentType.CC,
        documentNumber: 'AB123456',
      }),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
