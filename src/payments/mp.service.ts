// src/payments/mp.service.ts
import { Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

type BackUrls = { success: string; failure: string; pending: string };

@Injectable()
export class MpService {
  private client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
  });

  async createPreference(input: {
    title: string;
    quantity: number;
    unit_price: number;
    external_reference: string; // saleId
    notification_url: string;
    payer?: { email?: string; name?: string };
    currency_id?: string;
    back_urls?: BackUrls; // 👈 opcional
    item_id?: string; // opcional, por si quieres setear un id del item
  }) {
    const pref = new Preference(this.client);

    const body: any = {
      items: [
        {
          id: input.item_id ?? input.external_reference, // 👈 SDK exige id
          title: input.title,
          quantity: input.quantity,
          unit_price: input.unit_price,
          currency_id: input.currency_id ?? 'PEN',
        },
      ],
      external_reference: input.external_reference,
      notification_url: input.notification_url,
      payer: input.payer,
      // 👇 NO ponemos auto_return si no hay back_urls
    };

    if (input.back_urls) {
      body.back_urls = input.back_urls;
      // body.auto_return = 'approved'; // Úsalo solo si SÍ tienes back_urls válidas
    }

    return pref.create({ body });
  }

  async getPayment(paymentId: string) {
    const p = new Payment(this.client);
    return p.get({ id: paymentId });
  }
}
