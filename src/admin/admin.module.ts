import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SaleModule } from 'src/sale/sale.module';

@Module({
  imports: [SaleModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
