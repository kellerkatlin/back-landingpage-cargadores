import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerService } from './customer.service';

@Controller('customers')
export class CustomerController {
  constructor(private readonly svc: CustomerService) {}

  @Post() create(@Body() dto: CreateCustomerDto) {
    return this.svc.create(dto);
  }
  @Get() findAll() {
    return this.svc.findAll();
  }
  @Get(':id') findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }
  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.svc.update(id, dto);
  }
  @Delete(':id') remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
