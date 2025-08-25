// src/customers/dto/create-customer.dto.ts
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
  @IsString() name: string;
  @IsOptional() @IsString() lasName?: string;
  @IsOptional() @IsEmail() email?: string; // Debe ser único en la base de datos
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() dni?: string;

  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsString() distrito?: string;
  @IsOptional() @IsString() provincia?: string;
  @IsOptional() @IsString() departamento?: string;
  @IsOptional() @IsString() referencia?: string;
}
