// src/payments/payments.service.ts
import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  createRecord(params: {
    saleId: string;
    provider: string;
    referenceId?: string | null;
    status: PaymentStatus;
    amount: number;
    currency?: string;
    rawPayload?: any;
  }) {
    return this.prisma.payment.create({
      data: {
        saleId: params.saleId,
        provider: params.provider,
        referenceId: params.referenceId ?? null,
        status: params.status,
        amount: params.amount,
        currency: params.currency ?? 'PEN',
        rawPayload: params.rawPayload ?? null,
      },
    });
  }

  async attachMpPayment(data: {
    saleId: string;
    mpId: string; // id del pago en MP
    status: PaymentStatus;
    amount: number;
    currency?: string;
    raw?: any;
  }) {
    // idempotencia por referenceId
    const exists = await this.prisma.payment.findFirst({
      where: { referenceId: data.mpId },
    });
    if (exists) return exists;

    return this.createRecord({
      saleId: data.saleId,
      provider: 'MERCADO_PAGO',
      referenceId: data.mpId,
      status: data.status,
      amount: data.amount,
      currency: data.currency ?? 'PEN',
      rawPayload: data.raw ?? null,
    });
  }

  updateStatus(id: string, status: PaymentStatus) {
    return this.prisma.payment.update({
      where: { id },
      data: { status },
    });
  }

  findAll(args?: {
    saleId?: string;
    provider?: string;
    status?: PaymentStatus;
  }) {
    return this.prisma.payment.findMany({
      where: {
        saleId: args?.saleId,
        provider: args?.provider,
        status: args?.status,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.payment.findUnique({ where: { id } });
  }

  findBySaleId(saleId: string) {
    return this.prisma.payment.findMany({
      where: { saleId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
