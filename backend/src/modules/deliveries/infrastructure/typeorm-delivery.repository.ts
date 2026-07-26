import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from '../domain/delivery';
import { IDeliveryRepository } from '../domain/delivery.repository';
import { DeliveryOrmEntity } from './delivery.orm-entity';
import { DeliveryMapper } from './delivery.mapper';

@Injectable()
export class TypeOrmDeliveryRepository implements IDeliveryRepository {
  constructor(
    @InjectRepository(DeliveryOrmEntity)
    private readonly repository: Repository<DeliveryOrmEntity>,
  ) {}

  async save(delivery: Delivery): Promise<void> {
    await this.repository.save(DeliveryMapper.toOrm(delivery));
  }

  async findById(id: string): Promise<Delivery | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? DeliveryMapper.toDomain(entity) : null;
  }
}
