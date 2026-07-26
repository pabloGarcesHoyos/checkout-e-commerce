export interface ProductProps {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Product {
  private constructor(private props: ProductProps) {}

  static reconstitute(props: ProductProps): Product {
    return new Product(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get priceCents(): number {
    return this.props.priceCents;
  }

  get stock(): number {
    return this.props.stock;
  }

  get imageUrl(): string {
    return this.props.imageUrl;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  hasStockAvailable(): boolean {
    return this.props.stock > 0;
  }

  decrementStock(): void {
    if (this.props.stock <= 0) {
      throw new Error('Cannot decrement stock below zero');
    }
    this.props.stock -= 1;
    this.props.updatedAt = new Date();
  }
}
