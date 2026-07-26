import { DocumentType } from './document-type';

export interface CustomerProps {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
  createdAt: Date;
}

export class Customer {
  private constructor(private props: CustomerProps) {}

  static reconstitute(props: CustomerProps): Customer {
    return new Customer(props);
  }

  static create(
    props: Omit<CustomerProps, 'id' | 'createdAt'> & { id: string },
  ): Customer {
    return new Customer({ ...props, createdAt: new Date() });
  }

  get id(): string {
    return this.props.id;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get email(): string {
    return this.props.email;
  }

  get phone(): string {
    return this.props.phone;
  }

  get documentType(): DocumentType {
    return this.props.documentType;
  }

  get documentNumber(): string {
    return this.props.documentNumber;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
