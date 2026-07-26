import { CustomerMapper } from './customer.mapper';
import { CustomerOrmEntity } from './customer.orm-entity';
import { DocumentType } from '../domain/document-type';

describe('CustomerMapper', () => {
  const buildOrmEntity = (): CustomerOrmEntity => {
    const entity = new CustomerOrmEntity();
    entity.id = 'customer-1';
    entity.fullName = 'Jane Doe';
    entity.email = 'jane@example.com';
    entity.phone = '+573001234567';
    entity.documentType = DocumentType.CC;
    entity.documentNumber = 'AB123456';
    entity.createdAt = new Date();
    return entity;
  };

  it('maps an ORM entity to a domain customer', () => {
    const customer = CustomerMapper.toDomain(buildOrmEntity());
    expect(customer.id).toBe('customer-1');
    expect(customer.email).toBe('jane@example.com');
  });

  it('maps a domain customer back to an ORM entity', () => {
    const customer = CustomerMapper.toDomain(buildOrmEntity());
    const entity = CustomerMapper.toOrm(customer);
    expect(entity.fullName).toBe('Jane Doe');
    expect(entity.documentNumber).toBe('AB123456');
  });
});
