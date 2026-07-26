import { Customer } from '../domain/customer';
import { CustomerOrmEntity } from './customer.orm-entity';

export class CustomerMapper {
  static toDomain(entity: CustomerOrmEntity): Customer {
    return Customer.reconstitute({
      id: entity.id,
      fullName: entity.fullName,
      email: entity.email,
      phone: entity.phone,
      documentType: entity.documentType,
      documentNumber: entity.documentNumber,
      createdAt: entity.createdAt,
    });
  }

  static toOrm(customer: Customer): CustomerOrmEntity {
    const entity = new CustomerOrmEntity();
    entity.id = customer.id;
    entity.fullName = customer.fullName;
    entity.email = customer.email;
    entity.phone = customer.phone;
    entity.documentType = customer.documentType;
    entity.documentNumber = customer.documentNumber;
    entity.createdAt = customer.createdAt;
    return entity;
  }
}
