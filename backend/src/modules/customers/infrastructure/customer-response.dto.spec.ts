import { CustomerResponseDto } from './customer-response.dto';
import { Customer } from '../domain/customer';
import { DocumentType } from '../domain/document-type';

describe('CustomerResponseDto', () => {
  it('maps a domain customer to a response DTO', () => {
    const customer = Customer.reconstitute({
      id: 'customer-1',
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+573001234567',
      documentType: DocumentType.CC,
      documentNumber: 'AB123456',
      createdAt: new Date(),
    });

    const dto = CustomerResponseDto.fromDomain(customer);

    expect(dto).toEqual({
      id: 'customer-1',
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+573001234567',
      documentType: DocumentType.CC,
      documentNumber: 'AB123456',
    });
  });
});
