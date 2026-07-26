import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../domain/customer';
import { DocumentType } from '../domain/document-type';

export class CustomerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ enum: DocumentType })
  documentType: DocumentType;

  @ApiProperty()
  documentNumber: string;

  static fromDomain(customer: Customer): CustomerResponseDto {
    const dto = new CustomerResponseDto();
    dto.id = customer.id;
    dto.fullName = customer.fullName;
    dto.email = customer.email;
    dto.phone = customer.phone;
    dto.documentType = customer.documentType;
    dto.documentNumber = customer.documentNumber;
    return dto;
  }
}
