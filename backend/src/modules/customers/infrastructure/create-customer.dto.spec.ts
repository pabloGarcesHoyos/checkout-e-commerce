import { CreateCustomerDto } from './create-customer.dto';
import { DocumentType } from '../domain/document-type';

describe('CreateCustomerDto', () => {
  it('accepts assignment of all expected fields', () => {
    const dto = new CreateCustomerDto();
    dto.fullName = 'Jane Doe';
    dto.email = 'jane@example.com';
    dto.phone = '+573001234567';
    dto.documentType = DocumentType.CC;
    dto.documentNumber = 'AB123456';

    expect(dto.fullName).toBe('Jane Doe');
  });
});
