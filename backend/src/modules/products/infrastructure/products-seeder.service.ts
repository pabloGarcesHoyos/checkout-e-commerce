import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductOrmEntity } from './product.orm-entity';

export const SEED_PRODUCTS: Array<
  Pick<
    ProductOrmEntity,
    'name' | 'description' | 'priceCents' | 'stock' | 'imageUrl'
  >
> = [
  {
    name: 'Wireless Mechanical Keyboard',
    description:
      'Compact 75% mechanical keyboard with hot-swappable switches and Bluetooth 5.0.',
    priceCents: 20_000_000,
    stock: 15,
    imageUrl:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',
  },
  {
    name: 'Noise-Cancelling Headphones',
    description:
      'Over-ear wireless headphones with active noise cancellation and 30-hour battery life.',
    priceCents: 50_000_000,
    stock: 20,
    imageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
  },
  {
    name: '4K Ultrawide Monitor',
    description:
      '34-inch curved ultrawide monitor with 4K resolution and 144Hz refresh rate.',
    priceCents: 150_000_000,
    stock: 8,
    imageUrl:
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800',
  },
  {
    name: 'Ergonomic Office Chair',
    description:
      'Adjustable lumbar support office chair with breathable mesh back.',
    priceCents: 90_000_000,
    stock: 12,
    imageUrl:
      'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800',
  },
  {
    name: 'Portable SSD 1TB',
    description:
      'USB-C portable solid state drive with read speeds up to 1050MB/s.',
    priceCents: 40_000_000,
    stock: 30,
    imageUrl:
      'https://images.unsplash.com/photo-1779896412225-e2f374234cd1?w=800',
  },
];

@Injectable()
export class ProductsSeederService implements OnModuleInit {
  private readonly logger = new Logger(ProductsSeederService.name);

  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repository: Repository<ProductOrmEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.repository.count();
    if (count > 0) {
      return;
    }
    await this.repository.save(
      SEED_PRODUCTS.map((product) => this.repository.create(product)),
    );
    this.logger.log(`Seeded ${SEED_PRODUCTS.length} products`);
  }
}
