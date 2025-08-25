import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';

import { SimpleAuthGuard } from '../auth/simple-auth.guard';
import { PaymentStatus, FulfillmentStatus } from '@prisma/client';
import { SaleService } from 'src/sale/sale.service';

@UseGuards(SimpleAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly sales: SaleService) {}

  @Get('sales')
  async list(
    @Query('payment') payment?: PaymentStatus,
    @Query('fulfillment') fulfillment?: FulfillmentStatus,
  ) {
    // ejemplo simple (podrías mover a service si quieres filtros más complejos)
    const all = await this.sales.findAll();
    return all.filter(
      (s) =>
        (!payment || s.paymentStatus === payment) &&
        (!fulfillment || s.fulfillmentStatus === fulfillment),
    );
  }

  @Get('sales/:id')
  detail(@Param('id') id: string) {
    return this.sales.findOne(id);
  }

  @Patch('sales/:id/payment')
  setPayment(@Param('id') id: string, @Body('status') status: PaymentStatus) {
    return this.sales.setPaymentStatus(id, status);
  }

  @Patch('sales/:id/fulfillment')
  setFulfillment(
    @Param('id') id: string,
    @Body('status') status: FulfillmentStatus,
  ) {
    return this.sales.setFulfillmentStatus(id, status);
  }
}
