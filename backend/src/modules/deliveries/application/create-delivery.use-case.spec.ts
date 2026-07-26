import { CreateDeliveryUseCase } from './create-delivery.use-case';
import { IDeliveryRepository } from '../domain/delivery.repository';
import { Customer } from '../../customers/domain/customer';
import { ICustomerRepository } from '../../customers/domain/customer.repository';
import { DocumentType } from '../../customers/domain/document-type';

const buildCustomer = (): Customer =>
  Customer.reconstitute({
    id: 'customer-1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+573001234567',
    documentType: DocumentType.CC,
    documentNumber: 'AB123456',
    createdAt: new Date(),
  });

describe('CreateDeliveryUseCase', () => {
  it('creates a delivery with a server-calculated fee when the customer exists', async () => {
    const deliveryRepository: IDeliveryRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
    };
    const customerRepository: ICustomerRepository = {
      save: jest.fn(),
      findById: jest.fn().mockResolvedValue(buildCustomer()),
    };
    const useCase = new CreateDeliveryUseCase(
      deliveryRepository,
      customerRepository,
    );

    const result = await useCase.execute({
      customerId: 'customer-1',
      address: '123 Main St',
      city: 'Bogota',
      region: 'bogota',
    });

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.deliveryFeeCents).toBe(800);
    }
    expect(deliveryRepository.save).toHaveBeenCalledTimes(1);
  });

  it('returns CUSTOMER_NOT_FOUND when the customer does not exist', async () => {
    const deliveryRepository: IDeliveryRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    };
    const customerRepository: ICustomerRepository = {
      save: jest.fn(),
      findById: jest.fn().mockResolvedValue(null),
    };
    const useCase = new CreateDeliveryUseCase(
      deliveryRepository,
      customerRepository,
    );

    const result = await useCase.execute({
      customerId: 'missing',
      address: '123 Main St',
      city: 'Bogota',
      region: 'bogota',
    });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.code).toBe('CUSTOMER_NOT_FOUND');
    }
    expect(deliveryRepository.save).not.toHaveBeenCalled();
  });
});
