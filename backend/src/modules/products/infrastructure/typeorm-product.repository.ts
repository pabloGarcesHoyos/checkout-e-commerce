import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../domain/product';
import { IProductRepository } from '../domain/product.repository';
import { ProductOrmEntity } from './product.orm-entity';
import { ProductMapper } from './product.mapper';

@Injectable()
export class TypeOrmProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repository: Repository<ProductOrmEntity>,
  ) {}

  async findAll(): Promise<Product[]> {
    const entities = await this.repository.find({
      order: { createdAt: 'ASC' },
    });
    return entities.map((entity) => ProductMapper.toDomain(entity));
  }

  async findById(id: string): Promise<Product | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? ProductMapper.toDomain(entity) : null;
  }

  async save(product: Product): Promise<void> {
    await this.repository.save(ProductMapper.toOrm(product));
  }
}
