import { Module } from '@nestjs/common';
import { MpService } from './mp.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  providers: [MpService, PaymentsService],
  controllers: [PaymentsController],
  exports: [MpService],
})
export class PaymentsModule {}
