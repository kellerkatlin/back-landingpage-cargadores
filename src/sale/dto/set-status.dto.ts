import { IsEnum } from 'class-validator';
import { PaymentStatus, FulfillmentStatus } from '@prisma/client';

export class SetPaymentStatusDto {
  @IsEnum(PaymentStatus) status: PaymentStatus;
}
export class SetFulfillmentStatusDto {
  @IsEnum(FulfillmentStatus) status: FulfillmentStatus;
}
