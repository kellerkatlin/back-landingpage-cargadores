import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleService } from './sale.service';
import {
  SetFulfillmentStatusDto,
  SetPaymentStatusDto,
} from './dto/set-status.dto';

@Controller('sales')
export class SaleController {
  constructor(private readonly svc: SaleService) {}

  @Post() create(@Body() dto: CreateSaleDto) {
    return this.svc.create(dto);
  }
  @Get() findAll() {
    return this.svc.findAll();
  }
  @Get(':id') findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id/payment') setPayment(
    @Param('id') id: string,
    @Body() dto: SetPaymentStatusDto,
  ) {
    return this.svc.setPaymentStatus(id, dto.status);
  }

  @Patch(':id/fulfillment') setFulfillment(
    @Param('id') id: string,
    @Body() dto: SetFulfillmentStatusDto,
  ) {
    return this.svc.setFulfillmentStatus(id, dto.status);
  }

  @Patch(':id/cancel') cancel(@Param('id') id: string) {
    return this.svc.cancel(id);
  }
}
