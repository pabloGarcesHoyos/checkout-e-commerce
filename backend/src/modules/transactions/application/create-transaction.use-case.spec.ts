import { CreateTransactionUseCase } from './create-transaction.use-case';
import { ITransactionRepository } from '../domain/transaction.repository';
import { Product } from '../../products/domain/product';
import { IProductRepository } from '../../products/domain/product.repository';
import { Customer } from '../../customers/domain/customer';
import { ICustomerRepository } from '../../customers/domain/customer.repository';
import { DocumentType } from '../../customers/domain/document-type';
import { Delivery } from '../../deliveries/domain/delivery';
import { IDeliveryRepository } from '../../deliveries/domain/delivery.repository';

const buildProduct = (stock: number): Product =>
  Product.reconstitute({
    id: 'product-1',
    name: 'Keyboard',
    description: 'A keyboard',
    priceCents: 9999,
    stock,
    imageUrl: 'https://example.com/image.png',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

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

const buildDelivery = (): Delivery =>
  Delivery.reconstitute({
    id: 'delivery-1',
    customerId: 'customer-1',
    address: '123 Main St',
    city: 'Bogota',
    region: 'bogota',
    deliveryFeeCents: 800,
    createdAt: new Date(),
  });

const buildUseCase = (overrides?: { stock?: number }) => {
  const transactionRepository: ITransactionRepository = {
    save: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn(),
    findByReference: jest.fn(),
    existsByReference: jest.fn().mockResolvedValue(false),
  };
  const productRepository: IProductRepository = {
    findAll: jest.fn(),
    findById: jest.fn().mockResolvedValue(buildProduct(overrides?.stock ?? 5)),
    save: jest.fn(),
  };
  const customerRepository: ICustomerRepository = {
    save: jest.fn(),
    findById: jest.fn().mockResolvedValue(buildCustomer()),
  };
  const deliveryRepository: IDeliveryRepository = {
    save: jest.fn(),
    findById: jest.fn().mockResolvedValue(buildDelivery()),
  };

  const useCase = new CreateTransactionUseCase(
    transactionRepository,
    productRepository,
    customerRepository,
    deliveryRepository,
  );

  return {
    useCase,
    transactionRepository,
    productRepository,
    customerRepository,
    deliveryRepository,
  };
};

describe('CreateTransactionUseCase', () => {
  const command = {
    productId: 'product-1',
    customerId: 'customer-1',
    deliveryId: 'delivery-1',
  };

  it('creates a PENDING transaction with a server-computed total', async () => {
    const { useCase, transactionRepository } = buildUseCase();

    const result = await useCase.execute(command);

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.totalCents).toBe(9999 + 500 + 800);
      expect(result.value.status).toBe('PENDING');
    }
    expect(transactionRepository.save).toHaveBeenCalledTimes(1);
  });

  it('rejects when the product has no stock', async () => {
    const { useCase, transactionRepository } = buildUseCase({ stock: 0 });

    const result = await useCase.execute(command);

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.code).toBe('INSUFFICIENT_STOCK');
    }
    expect(transactionRepository.save).not.toHaveBeenCalled();
  });

  it('rejects when the product does not exist', async () => {
    const { useCase, productRepository } = buildUseCase();
    (productRepository.findById as jest.Mock).mockResolvedValue(null);

    const result = await useCase.execute(command);

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.code).toBe('PRODUCT_NOT_FOUND');
    }
  });

  it('rejects when the customer does not exist', async () => {
    const { useCase, customerRepository } = buildUseCase();
    (customerRepository.findById as jest.Mock).mockResolvedValue(null);

    const result = await useCase.execute(command);

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.code).toBe('CUSTOMER_NOT_FOUND');
    }
  });

  it('rejects when the delivery does not exist', async () => {
    const { useCase, deliveryRepository } = buildUseCase();
    (deliveryRepository.findById as jest.Mock).mockResolvedValue(null);

    const result = await useCase.execute(command);

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.code).toBe('DELIVERY_NOT_FOUND');
    }
  });

  it('regenerates the reference on a collision to guarantee uniqueness', async () => {
    const { useCase, transactionRepository } = buildUseCase();
    (transactionRepository.existsByReference as jest.Mock)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const result = await useCase.execute(command);

    expect(result.isOk).toBe(true);
    expect(transactionRepository.existsByReference).toHaveBeenCalledTimes(2);
  });
});
