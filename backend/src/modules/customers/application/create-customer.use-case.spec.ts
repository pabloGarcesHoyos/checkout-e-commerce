import { CreateCustomerUseCase } from './create-customer.use-case';
import { ICustomerRepository } from '../domain/customer.repository';
import { DocumentType } from '../domain/document-type';

describe('CreateCustomerUseCase', () => {
  it('creates and persists a customer', async () => {
    const repository: ICustomerRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
    };
    const useCase = new CreateCustomerUseCase(repository);

    const result = await useCase.execute({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+573001234567',
      documentType: DocumentType.CC,
      documentNumber: 'AB123456',
    });

    expect(result.isOk).toBe(true);
    expect(repository.save).toHaveBeenCalledTimes(1);
    if (result.isOk) {
      expect(result.value.fullName).toBe('Jane Doe');
      expect(result.value.id).toBeDefined();
    }
  });
});
