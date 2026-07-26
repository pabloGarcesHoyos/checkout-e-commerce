import { Repository } from 'typeorm';
import { TypeOrmCustomerRepository } from './typeorm-customer.repository';
import { CustomerOrmEntity } from './customer.orm-entity';
import { Customer } from '../domain/customer';
import { DocumentType } from '../domain/document-type';

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

describe('TypeOrmCustomerRepository', () => {
  const buildRepository = () => {
    const ormRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<CustomerOrmEntity>>;
    return {
      repository: new TypeOrmCustomerRepository(ormRepository),
      ormRepository,
    };
  };

  it('persists a domain customer', async () => {
    const { repository, ormRepository } = buildRepository();
    const customer = Customer.reconstitute({
      id: 'customer-1',
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+573001234567',
      documentType: DocumentType.CC,
      documentNumber: 'AB123456',
      createdAt: new Date(),
    });

    await repository.save(customer);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'customer-1' }),
    );
  });

  it('returns a domain customer when found', async () => {
    const { repository, ormRepository } = buildRepository();
    (ormRepository.findOne as jest.Mock).mockResolvedValue(buildOrmEntity());

    const customer = await repository.findById('customer-1');

    expect(customer?.email).toBe('jane@example.com');
  });

  it('returns null when not found', async () => {
    const { repository, ormRepository } = buildRepository();
    (ormRepository.findOne as jest.Mock).mockResolvedValue(null);

    const customer = await repository.findById('missing');

    expect(customer).toBeNull();
  });
});
