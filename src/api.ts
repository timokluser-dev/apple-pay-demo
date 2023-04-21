import type { PaymentIntent, PaymentRequestPaymentMethodEvent } from '@stripe/stripe-js';

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
}

export interface ShippingAddress {
  country?: string;
  addressLine?: string[];
  region?: string;
  city?: string;
  postalCode?: string;
  recipient?: string;
  phone?: string;
}

export interface ShippingOption {
  id: string;
  label: string;
  detail: string;
  price: number;
}

/**
 * mocked payment api
 * !! should be extracted into a backend in production environments !!
 */
class Api {
  private shippingOptions: ShippingOption[] = [
    {
      id: 'free-shipping',
      label: 'Free shipping',
      detail: 'Arrives in 5 to 7 days',
      price: 0,
    },
    {
      id: 'express-shipping',
      label: 'Express shipping',
      detail: 'Arrives in 1 to 3 days',
      price: 10,
    },
  ];

  public getCart(): Cart {
    console.log('[API]: get cart');

    const items: CartItem[] = [
      {
        id: 1,
        name: 'iPhone 14 Pro',
        price: 1179.0,
      },
      {
        id: 2,
        name: 'AirPods Pro (2. Generation)',
        price: 259.0,
      },
    ];

    return {
      items,
      total: items
        .map((i) => i.price)
        .reduce((a, b) => {
          return a + b;
        }),
    };
  }

  public getAvailableShippingOptions(address: ShippingAddress): ShippingOption[] {
    console.log('[API]: get shipping options for address', address);

    return this.shippingOptions;
  }

  public async createPaymentIntent(
    event: PaymentRequestPaymentMethodEvent
  ): Promise<PaymentIntent> {
    console.log('[API]: process payment on server', event);

    console.log('[API]: create order with name', event.payerName);
    console.log('[API]: create order with email', event.payerEmail);
    console.log('[API]: create order with phone', event.payerPhone);
    console.log(
      '[API]: create order with address',
      [
        event.shippingAddress?.addressLine?.join(', '),
        event.shippingAddress?.postalCode,
        event.shippingAddress?.city,
        event.shippingAddress?.country,
      ].join(', ')
    );

    const shippingOptionId = event.shippingOption?.id;
    if (!shippingOptionId) {
      throw new Error('[API]: no shipping option selected');
    }

    const cart = this.getCart();
    const shippingOption = this.shippingOptions.find((s) => s.id === shippingOptionId);
    if (!shippingOption) {
      throw new Error('[API]: invalid shipping option');
    }

    const total = cart.total * 100 + shippingOption.price * 100;

    const result = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${import.meta.env.VITE_STRIPE_SECRET_KEY}`,
      },
      body: `amount=${total}&currency=chf`,
    });

    return (await result.json()) as PaymentIntent;
  }
}

let client: Api | null = null;

export const useApi = (): Api => {
  if (client) {
    return client;
  }

  client = new Api();
  return client;
};
