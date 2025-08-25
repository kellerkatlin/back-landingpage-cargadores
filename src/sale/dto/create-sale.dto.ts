import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateSaleDto {
  @IsUUID() customerId: string;
  @IsInt() @Min(1) quantity: number;
  @IsNumber() unitPrice: number;
  @IsOptional() @IsBoolean() applyTax?: boolean; // si quieres IGV=18% en el futuro
  @IsOptional() @IsString() notes?: string;
}
