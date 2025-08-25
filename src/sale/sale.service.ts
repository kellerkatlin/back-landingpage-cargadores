import { Injectable } from '@nestjs/common';
import { PaymentStatus, SaleStatus, FulfillmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SaleService {
  constructor(private readonly prisma: PrismaService) {}

  private totals(q: number, unit: number, applyTax = false) {
    const subtotal = +(q * unit).toFixed(2);
    const tax = applyTax ? +(subtotal * 0.18).toFixed(2) : 0;
    const total = +(subtotal + tax).toFixed(2);
    return { subtotal, total };
  }

  create(dto: CreateSaleDto) {
    const { subtotal, total } = this.totals(
      dto.quantity,
      dto.unitPrice,
      dto.applyTax,
    );
    return this.prisma.sale.create({
      data: {
        customerId: dto.customerId,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        subtotal,
        totalAmount: total,
        saleStatus: 'CREATED',
        paymentStatus: 'UNPAID',
        fulfillmentStatus: 'NOT_PREPARED',
        notes: dto.notes ?? null,
      },
      include: { customer: true },
    });
  }

  findAll() {
    return this.prisma.sale.findMany({
      include: { customer: true, payments: true, fulfillments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.sale.findUnique({
      where: { id },
      include: { customer: true, payments: true, fulfillments: true },
    });
  }

  async setPaymentStatus(id: string, status: PaymentStatus) {
    const sale = await this.prisma.sale.update({
      where: { id },
      data: { paymentStatus: status },
    });
    return this.maybeComplete(sale.id);
  }

  async setFulfillmentStatus(id: string, status: FulfillmentStatus) {
    await this.prisma.fulfillmentEvent.create({ data: { saleId: id, status } });
    const sale = await this.prisma.sale.update({
      where: { id },
      data: { fulfillmentStatus: status },
    });
    return this.maybeComplete(sale.id);
  }

  async cancel(id: string) {
    const s = await this.prisma.sale.findUnique({ where: { id } });
    if (!s) return null;
    if (s.paymentStatus === PaymentStatus.PAID) {
      throw new Error(
        'No puedes cancelar una venta pagada (haz refund primero)',
      );
    }
    return this.prisma.sale.update({
      where: { id },
      data: { saleStatus: SaleStatus.CANCELED },
    });
  }

  private async maybeComplete(id: string) {
    const s = await this.prisma.sale.findUnique({ where: { id } });
    if (!s) return null;
    const done =
      s.paymentStatus === PaymentStatus.PAID &&
      s.fulfillmentStatus === 'DELIVERED';
    if (done && s.saleStatus !== 'COMPLETED') {
      return this.prisma.sale.update({
        where: { id },
        data: { saleStatus: 'COMPLETED' },
      });
    }
    return s;
  }
}
