// src/payments/payments.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { PaymentsService } from './payments.service';
import { MpService } from './mp.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';
import { SimpleAuthGuard } from '../auth/simple-auth.guard';

@Controller()
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly prisma: PrismaService,
    private readonly mp: MpService,
  ) {}

  // ========== ADMIN ==========

  @UseGuards(SimpleAuthGuard)
  @Get('payments')
  listPayments(
    @Query('saleId') saleId?: string,
    @Query('provider') provider?: string,
    @Query('status') status?: PaymentStatus,
  ) {
    return this.payments.findAll({ saleId, provider, status });
  }

  @UseGuards(SimpleAuthGuard)
  @Get('payments/:id')
  getPayment(@Param('id') id: string) {
    return this.payments.findOne(id);
  }

  @UseGuards(SimpleAuthGuard)
  @Patch('payments/:id/status')
  setPaymentStatus(
    @Param('id') id: string,
    @Body('status') status: PaymentStatus,
  ) {
    return this.payments.updateStatus(id, status);
  }

  // ========== MERCADO PAGO ==========

  @Post('payments/mercadopago/create-preference/:saleId')
  async createPreference(
    @Param('saleId') saleId: string,
    @Res() res: Response,
  ) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { customer: true },
    });
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    if (sale.paymentStatus === PaymentStatus.PAID) {
      return res.status(400).json({ message: 'Sale already paid' });
    }

    const frontUrl = process.env.FRONT_URL; // puede NO existir
    const back_urls =
      frontUrl && /^https?:\/\//.test(frontUrl)
        ? {
            success: `${frontUrl}/checkout/success?sale=${sale.id}`,
            failure: `${frontUrl}/checkout/failure?sale=${sale.id}`,
            pending: `${frontUrl}/checkout/pending?sale=${sale.id}`,
          }
        : undefined; // 👈 si no hay FRONT, no enviamos back_urls

    const pref = await this.mp.createPreference({
      title: `Venta #${sale.id}`,
      quantity: 1, // un solo ítem, total en unit_price
      unit_price: sale.totalAmount,
      external_reference: sale.id,
      notification_url: process.env.MP_WEBHOOK_URL!,
      payer: {
        email: sale.customer?.email ?? undefined,
        name: sale.customer?.name ?? undefined,
      },
      currency_id: 'PEN',
      back_urls, // 👈 opcional
      item_id: sale.id, // opcional, útil para trazabilidad
    });

    // Deja la venta en PENDING
    if (sale.paymentStatus !== PaymentStatus.PENDING) {
      await this.prisma.sale.update({
        where: { id: saleId },
        data: { paymentStatus: PaymentStatus.PENDING },
      });
    }

    // Registro de intento (opcional)
    await this.payments.createRecord({
      saleId: saleId,
      provider: 'MERCADO_PAGO',
      referenceId: String(pref.id),
      status: PaymentStatus.PENDING,
      amount: sale.totalAmount,
      currency: 'PEN',
    });

    return res.json({ init_point: pref.init_point, preference_id: pref.id });
  }

  @Post('payments/mercadopago/webhook')
  async webhook(@Req() req: Request, @Res() res: Response) {
    // Log básico para debug
    console.log('WEBHOOK req.query:', req.query);
    console.log('WEBHOOK req.body:', req.body);

    try {
      const body: any = req.body || {};
      const paymentId =
        body?.data?.id || req.query['data.id'] || req.query['id'];

      if (!paymentId) {
        return res.status(200).send('no-payment-id');
      }

      let mpPayment: any;
      try {
        mpPayment = await this.mp.getPayment(String(paymentId));
      } catch (err: any) {
        console.error('getPayment error:', err?.message || err);
        return res.status(400).json({
          error: 'getPayment_failed',
          paymentId,
          details: err?.message || String(err),
        });
      }

      const saleId = mpPayment?.external_reference;
      if (!saleId) {
        return res.status(200).send('no-external-reference');
      }

      // Idempotencia
      await this.payments.attachMpPayment({
        saleId,
        mpId: String(mpPayment.id),
        status: this.mapMpStatusToPaymentStatus(mpPayment.status ?? ''),
        amount: Number(mpPayment.transaction_amount),
        currency: mpPayment.currency_id ?? 'PEN',
        raw: mpPayment,
      });

      // Validar montos
      const sale = await this.prisma.sale.findUnique({ where: { id: saleId } });
      if (
        sale &&
        Number(sale.totalAmount) !== Number(mpPayment.transaction_amount)
      ) {
        await this.prisma.sale.update({
          where: { id: saleId },
          data: { paymentStatus: PaymentStatus.FAILED },
        });
        return res.status(200).send('amount-mismatch');
      }

      // Actualiza estado
      const mapped = this.mapMpStatusToPaymentStatus(mpPayment.status ?? '');
      await this.prisma.sale.update({
        where: { id: saleId },
        data: { paymentStatus: mapped },
      });

      return res.status(200).send('ok');
    } catch (e: any) {
      console.error('WEBHOOK catch:', e?.message || e);
      // Durante la prueba manual es mejor ver el error:
      return res
        .status(400)
        .json({ error: 'unhandled', details: e?.message || String(e) });
    }
  }

  private mapMpStatusToPaymentStatus(mp: string): PaymentStatus {
    switch ((mp || '').toLowerCase()) {
      case 'approved':
      case 'authorized':
        return PaymentStatus.PAID;
      case 'in_process':
      case 'pending':
        return PaymentStatus.PENDING;
      case 'refunded':
      case 'charged_back':
        return PaymentStatus.REFUNDED;
      case 'rejected':
      case 'cancelled':
      default:
        return PaymentStatus.FAILED;
    }
  }
}
