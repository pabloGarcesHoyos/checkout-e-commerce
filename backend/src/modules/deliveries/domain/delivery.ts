export interface DeliveryProps {
  id: string;
  customerId: string;
  address: string;
  city: string;
  region: string;
  deliveryFeeCents: number;
  createdAt: Date;
}

export class Delivery {
  private constructor(private props: DeliveryProps) {}

  static reconstitute(props: DeliveryProps): Delivery {
    return new Delivery(props);
  }

  static create(props: Omit<DeliveryProps, 'createdAt'>): Delivery {
    return new Delivery({ ...props, createdAt: new Date() });
  }

  get id(): string {
    return this.props.id;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get address(): string {
    return this.props.address;
  }

  get city(): string {
    return this.props.city;
  }

  get region(): string {
    return this.props.region;
  }

  get deliveryFeeCents(): number {
    return this.props.deliveryFeeCents;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
