import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { err, ok, Result } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';
import { Delivery } from '../domain/delivery';
import { calculateDeliveryFeeCents } from '../domain/delivery-fee-calculator';
import { DELIVERY_REPOSITORY } from '../domain/delivery.repository';
import type { IDeliveryRepository } from '../domain/delivery.repository';
import { CUSTOMER_REPOSITORY } from '../../customers/domain/customer.repository';
import type { ICustomerRepository } from '../../customers/domain/customer.repository';

export interface CreateDeliveryCommand {
  customerId: string;
  address: string;
  city: string;
  region: string;
}

@Injectable()
export class CreateDeliveryUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: IDeliveryRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(
    command: CreateDeliveryCommand,
  ): Promise<Result<Delivery, DomainError>> {
    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      return err(
        DomainError.of(
          'CUSTOMER_NOT_FOUND',
          `Customer ${command.customerId} not found`,
        ),
      );
    }

    const delivery = Delivery.create({
      id: randomUUID(),
      customerId: command.customerId,
      address: command.address,
      city: command.city,
      region: command.region,
      deliveryFeeCents: calculateDeliveryFeeCents(command.region),
    });

    await this.deliveryRepository.save(delivery);
    return ok(delivery);
  }
}
