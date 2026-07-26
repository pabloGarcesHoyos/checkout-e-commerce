import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, Length, Matches } from 'class-validator';
import { DocumentType } from '../domain/document-type';

export class CreateCustomerDto {
  @ApiProperty()
  @IsString()
  @Length(3, 255)
  fullName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'phone must be a valid phone number',
  })
  phone: string;

  /* NOTE: emitDecoratorMetadata reflects string enums as a
   * typeof check that is always false for a real TS enum; one branch side is
   * structurally unreachable regardless of test input. */
  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty()
  @Matches(/^[a-zA-Z0-9]{5,20}$/, {
    message: 'documentNumber must be alphanumeric, 5-20 characters',
  })
  documentNumber: string;
}
